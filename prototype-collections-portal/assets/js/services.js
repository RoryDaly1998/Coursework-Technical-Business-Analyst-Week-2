/*
 * services.js: Services (business primitives) and ReadApi (read-only data interface).
 * Depends on Clock, Store, Auth, Fmt, Validate (core.js). Must load before layout.js.
 *
 * ---------------------------------------------------------------------------
 * RULES THIS FILE FOLLOWS
 *   - All writes go through Store.insert / Store.update. Seed arrays are never edited directly.
 *   - Business-data mutations write an audit row through Services.audit (the only writer of 'audit').
 *     Append-only event logs (verifications, messages, accountViews, apiRequests) are not double-audited,
 *     except when they change a business record (lockout, bounce flag, access denied).
 *   - Expected invalid input never throws: functions return { ok:false, error, errors? } (or a status object).
 *   - Money is rounded to 2dp. Dates 'YYYY-MM-DD', datetimes 'YYYY-MM-DDTHH:mm'.
 *   - Card data and verification answers are never written anywhere. Audit, log and message text is
 *     scrubbed of keys such as answers/card/cvv and of runs of 13+ digits before it is stored.
 *   - Settings are { value, tbd, min, max, demo } objects: read with Services.setting(key) (value, else demo).
 *
 * PUBLIC API (return shapes)
 *   Services.currentActor()                                  -> {id, label, channel:'portal'|'staff'|'system'}
 *   Services.setting(key, fallback?)                         -> value | demo | fallback | null
 *   Services.verify(accountNo, {dob, postcode}, {method, actorId})
 *                                                            -> {result:'Verified'|'Not verified'|'Locked', customerId|null, locked}
 *   Services.unlock(customerId, actorId)                     -> {ok, error?}
 *   Services.audit({entity, entityId, customerId, action, before, after, note, channel?, userId?, userLabel?}) -> audit row
 *   Services.addLog(entry)                                   -> {ok, log?, error?}
 *   Services.postPayment({customerId, amount, channel, idempotencyKey, simulate})
 *                                                            -> {status:'success'|'failed'|'invalid'|'reversed', payment|null, reasonCategory|null, duplicate, error?, errors?}
 *   Services.reversePayment({paymentId, reasonCode, approverId}) -> {ok, error?, reversal?, payment?, balance?}
 *   Services.createPromise({customerId, amount, dueDate, source, verificationResult})
 *                                                            -> {ok, error?, errors?, promise?, superseded?, pausedFollowups?}
 *   Services.refreshPromiseFlags(customerId)                 -> null | {promiseId, amount, dueDate, shortfall, originalShortfall, paidSince}
 *   Services.promiseFlag(customerId)                         -> same as above, read-only
 *   Services.followupDefaults(outcomeCode, customerId?)      -> {dueDate, time, ownerId, channel, followUp, days}
 *   Services.createFollowup({customerId, ownerId, dueDate, time, channel, sourceLogId, outcomeCode, overrideReason})
 *                                                            -> {ok, error?, errors?, followup?}
 *   Services.completeFollowup(id)                            -> {ok, error?, followup?}
 *   Services.rescheduleFollowup(id, {dueDate, time, overrideReason}) -> {ok, error?, errors?, followup?}
 *   Services.REP_CONTACT_PHONE                               the single rep contact number used in all message texts
 *   Services.reassignFollowup(id, newOwnerId)                -> {ok, error?, followup?}
 *   Services.contactCount(customerId, dateIso)               -> number
 *   Services.checkContactLimit(customerId, dateIso)          -> {count, limit, exceeds, windowDays}
 *   Services.updateContactDetails(customerId, patch, {channel, actorId}) -> {ok, errors?, changed?, customer?, messages?}
 *   Services.sendMessage({customerId, kind, templateId, subject, body, links, toOverride, channel?})
 *                                                            -> {ok, error?, message?, status?}
 *   Services.scanForCardData()                               -> [{collection, id, path, sample}]
 *   Services.validateSchema()                                -> {ok, issues:[{customerId, accountNo, field, expected, actual, message}], checked}
 *   Services.reportAlert({type, severity, detail})           -> {ok, alert}
 *   Services.recordAccountView(customerId, displayed?)       -> {ok, view?, error?}
 *   Services.paymentCount(customerId)                        -> number (payments with status 'success')
 *   Services.setReminderPrefs(customerId, {optedOut, channel}) -> {ok, error?, reminderPrefs?}
 *   Services.raiseQuery(customerId, {expectedDate, expectedAmount}?) -> {ok, error?, query?, duplicate?}
 *   Services.resolveQuery(customerId, note?)                 -> {ok, error?, query?}  (rep or leader; lifts the delinquency hold)
 *   Services.paymentTotalSince(customerId, sinceIso, untilIso?) -> number (successful payments with at >= since and, if given, at <= until)
 *   Services.promiseWindow()                                 -> {min, max} days from today
 *   Services.updateSetting(key, value, note?)                -> audit row (sets the setting and audits it)
 *   Services.renderTemplate(name, vars)                      -> {templateId, version, subject?, body} | null (highest Approved version)
 *   Services.setPreferredContact(customerId, {channel, from, to}) -> {ok, error?, errors?, changed?, preferred?}
 *   Services.preferencesLink(customer)                       -> 'portal-preferences.html?t=<token>'
 *   Services.customerByToken(token)                          -> customer | null
 *   ReadApi.request(method, path, {sessionCustomerId})       -> {status, body}
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var PAYMENT_CHANNELS = ['portal', 'phone', 'bank'];
  var SIMULATIONS = ['approve', 'decline', 'timeout', 'timeout-charged'];
  var LOG_KINDS = ['interaction', 'payment', 'promise', 'fulfilment', 'reminder', 'change', 'followup', 'reversal'];
  var STAFF_ROLES = ['rep', 'leader'];
  var CONTACT_PHONE = '0800 000 000';
  var FORBIDDEN_KEYS = /^(answers?|cardnumber|cardno|card|cvv|cvc|pan|expiry|password)$/i;
  var KNOWN_COLLECTIONS = ['customers', 'templates', 'payments', 'promises', 'logs', 'followups', 'audit',
    'verifications', 'messages', 'jobRuns', 'alerts', 'settlements', 'reminderSchedule', 'queries',
    'reversals', 'accountViews', 'accessAttempts', 'apiRequests', 'migration'];

  // ---------- small helpers ----------

  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  // Rounds to 2dp, nudging so 1.005 rounds up.
  function r2(n) {
    var v = Number(n);
    if (!isFinite(v)) { return 0; }
    return Math.round((v + (v < 0 ? -1e-9 : 1e-9)) * 100) / 100;
  }

  function parseAmount(v) {
    if (typeof v === 'number') { return r2(v); }
    return r2(Number(String(v === null || v === undefined ? '' : v).replace(/[\u00a3,\s]/g, '')));
  }

  function idNum(id) { return parseInt(String(id).replace(/^.*-/, ''), 10) || 0; }

  function extend(target, src) {
    Object.keys(src || {}).forEach(function (k) { target[k] = src[k]; });
    return target;
  }

  function isBlank(v) { return v === null || v === undefined || String(v).trim() === ''; }

  function randomToken(n) {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var out = '';
    for (var i = 0; i < n; i++) { out += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return out;
  }

  function findCustomer(id) { return id ? Store.find('customers', String(id)) : null; }

  function findByAccountNo(accountNo) {
    var a = String(accountNo === null || accountNo === undefined ? '' : accountNo).trim();
    return a ? Store.find('customers', function (c) { return String(c.accountNo) === a; }) : null;
  }

  function userById(id) { return id ? Store.find('users', String(id)) : null; }

  // Value of a setting: .value, else .demo, else fallback (null if none).
  function setting(key, fallback) {
    var fb = fallback === undefined ? null : fallback;
    var s = Store.settings()[key];
    if (s === null || s === undefined) { return fb; }
    if (typeof s !== 'object') { return s; }
    var v = (s.value === null || s.value === undefined) ? s.demo : s.value;
    return (v === null || v === undefined) ? fb : v;
  }

  function numSetting(key, fallback) {
    var v = setting(key, null);
    return v !== null && isFinite(Number(v)) ? Number(v) : fallback;
  }

  // Whole minutes since the epoch for 'YYYY-MM-DDTHH:mm' (date-only counts as midnight); null if invalid.
  function minutesOf(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso || ''));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) / 60000 : null;
  }

  // Promise date window in days from today: the setting's min and max (the seed also keeps a plain value of 14).
  function promiseWindow() {
    var s = Store.settings().promiseWindow || {};
    return {
      min: s.min !== null && s.min !== undefined && isFinite(Number(s.min)) ? Number(s.min) : 1,
      max: s.max !== null && s.max !== undefined && isFinite(Number(s.max)) ? Number(s.max) : 14
    };
  }

  // Production: PUT /settings/{key} on the configuration service; every change is audited with before and after.
  function updateSetting(key, value, note) {
    var before = setting(key, null);
    Store.setSetting(key, value);
    return audit({ entity: 'setting', entityId: key, action: 'update', before: { value: before }, after: { value: value }, note: note });
  }

  // Production: GET /templates?name=...&status=Approved (highest version), merged server-side. Unknown placeholders become empty.
  function renderTemplate(name, vars) {
    var wanted = String(name || '').toLowerCase();
    var best = null;
    Store.get('templates').forEach(function (t) {
      if (t.status !== 'Approved' || String(t.name).toLowerCase() !== wanted) { return; }
      if (!best || Number(t.version) > Number(best.version)) { best = t; }
    });
    if (!best) { return null; }
    var v = vars || {};
    function fill(text) {
      return String(text).replace(/\{\{\s*(\w+)\s*\}\}/g, function (m, k) { return v[k] !== undefined && v[k] !== null ? v[k] : ''; });
    }
    var out = { templateId: best.id, version: best.version, body: fill(best.body) };
    if (best.subject) { out.subject = fill(best.subject); }
    return out;
  }

  function firstName(customer) { return String(customer && customer.name ? customer.name : '').split(' ')[0] || 'customer'; }

  // Production: the opaque token in the signed reminder link; it identifies the customer without any account data in the URL.
  function preferencesLink(customer) {
    return 'portal-preferences.html?t=' + encodeURIComponent(customer && customer.unsubToken ? customer.unsubToken : '');
  }

  function customerByToken(token) {
    var t = String(token === null || token === undefined ? '' : token).trim();
    return t ? Store.find('customers', function (c) { return c.unsubToken === t; }) : null;
  }

  // ---------- card-number detection (shared by scan and scrub) ----------

  // Finds runs of 13+ digits (optional single spaces/dashes between digits). ISO dates are ignored.
  function findCardRuns(str) {
    var s = String(str);
    var masked = s.replace(/\d{4}-\d{2}-\d{2}/g, function (m) { return new Array(m.length + 1).join('D'); });
    var re = /\d(?:[ -]?\d){12,}/g;
    var out = [];
    var m;
    while ((m = re.exec(masked)) !== null) { out.push({ index: m.index, text: s.substr(m.index, m[0].length) }); }
    return out;
  }

  function redactString(s) {
    var runs = findCardRuns(s);
    for (var i = runs.length - 1; i >= 0; i--) {
      s = s.slice(0, runs[i].index) + '[removed]' + s.slice(runs[i].index + runs[i].text.length);
    }
    return s;
  }

  // Deep copy that drops secret-looking keys and card-like digit runs.
  function scrub(v) {
    if (typeof v === 'string') { return redactString(v); }
    if (Array.isArray(v)) { return v.map(scrub); }
    if (v && typeof v === 'object') {
      var out = {};
      Object.keys(v).forEach(function (k) { if (!FORBIDDEN_KEYS.test(k)) { out[k] = scrub(v[k]); } });
      return out;
    }
    return v;
  }

  // ---------- actors ----------

  // Production: identity comes from the authenticated session / access token claims.
  function currentActor() {
    var role = Auth.role();
    if (role === 'customer') {
      var cid = Auth.verifiedCustomer();
      var c = findCustomer(cid);
      return { id: cid || 'customer-unverified', label: c ? c.name : 'Customer (not verified)', channel: 'portal' };
    }
    var u = Auth.user();
    return { id: u ? u.id : role, label: u ? u.name : role, channel: 'staff' };
  }

  // Resolves an explicit actor id (staff user, customer, 'SYSTEM'); falls back to the session actor.
  function actorFor(id) {
    if (!id) { return currentActor(); }
    if (id === 'SYSTEM') { return { id: 'SYSTEM', label: 'System', channel: 'system' }; }
    var u = userById(id);
    if (u) { return { id: u.id, label: u.name, channel: 'staff' }; }
    var c = findCustomer(id);
    if (c) { return { id: c.id, label: c.name, channel: 'portal' }; }
    return currentActor();
  }

  function roleOf(actor) {
    var u = userById(actor && actor.id);
    return u ? u.role : null;
  }

  // Customer-channel writes are only allowed for the verified portal session.
  function sessionError(customerId) {
    return Auth.verifiedCustomer() === customerId ? null : 'Verification required before using this service.';
  }

  function failForm(msg) { return { ok: false, error: msg, errors: { _form: msg } }; }

  // ---------- audit and logs ----------

  // Production: append-only audit service (insert-only DB role, no UPDATE/DELETE grants).
  function audit(entry) {
    var e = entry || {};
    var actor = currentActor();
    return Store.insert('audit', {
      at: Clock.now(),
      userId: e.userId !== undefined ? e.userId : actor.id,
      userLabel: e.userLabel !== undefined ? e.userLabel : actor.label,
      channel: e.channel || actor.channel,
      entity: e.entity || null,
      entityId: e.entityId === undefined ? null : e.entityId,
      customerId: e.customerId || null,
      action: e.action || 'unknown',
      before: e.before === undefined ? null : scrub(e.before),
      after: e.after === undefined ? null : scrub(e.after),
      note: e.note ? scrub(String(e.note)) : null
    });
  }

  function auditAs(actor, entry, channel) {
    return audit(extend({ userId: actor.id, userLabel: actor.label, channel: channel || actor.channel }, entry));
  }

  function logChannelFor(actor) {
    return actor.channel === 'portal' ? 'portal' : (actor.channel === 'system' ? 'system' : 'rep');
  }

  // Inserts a log row and audits it (system-channel logs are audited as the system, not the signed-in user).
  function insertLog(entry, actor) {
    var customer = findCustomer(entry.customerId);
    var at = entry.at || Clock.now();
    var row = {
      customerId: entry.customerId,
      kind: entry.kind || 'interaction',
      at: at,
      date: entry.date || String(at).slice(0, 10),
      method: entry.method || null,
      outcomeCode: entry.outcomeCode || null,
      amount: entry.amount === undefined || entry.amount === null ? null : r2(entry.amount),
      promiseAmount: entry.promiseAmount === undefined || entry.promiseAmount === null ? null : r2(entry.promiseAmount),
      promiseDate: entry.promiseDate || null,
      nextAction: entry.nextAction || null,
      notes: entry.notes ? redactString(String(entry.notes)) : null,
      repId: entry.repId !== undefined ? entry.repId : (actor.channel === 'staff' ? actor.id : null),
      team: entry.team !== undefined ? entry.team : (customer ? customer.team : null),
      channel: entry.channel || logChannelFor(actor),
      reference: entry.reference || null,
      templateId: entry.templateId || null
    };
    if (entry.overrideReason) { row.overrideReason = redactString(String(entry.overrideReason)); }
    var saved = Store.insert('logs', row);
    var who = row.channel === 'system' ? { id: 'SYSTEM', label: 'System', channel: 'system' } : actor;
    auditAs(who, { entity: 'log', entityId: saved.id, customerId: saved.customerId, action: 'create',
      after: { kind: saved.kind, outcomeCode: saved.outcomeCode, channel: saved.channel }, note: row.overrideReason ? 'Override reason recorded.' : null });
    return saved;
  }

  // Production: POST /customers/{id}/interactions (case-management API).
  function addLog(entry) {
    var e = entry || {};
    var actor = currentActor();
    if (!findCustomer(e.customerId)) { return { ok: false, error: 'Customer not found.' }; }
    if (e.kind && LOG_KINDS.indexOf(e.kind) < 0) { return { ok: false, error: 'Unknown log kind.' }; }
    var codes = Store.config('outcomeCodes') || [];
    if ((!e.kind || e.kind === 'interaction') && e.outcomeCode && codes.length &&
        !codes.some(function (c) { return c.code === e.outcomeCode; })) {
      return { ok: false, error: 'Unknown outcome code.' };
    }
    var row = insertLog(e, actor);
    return { ok: true, log: clone(row) };
  }

  function alertRow(a) {
    var x = a || {};
    var row = Store.insert('alerts', {
      at: Clock.now(),
      type: x.type || 'general',
      severity: x.severity || 'medium',
      detail: x.detail ? redactString(String(x.detail)) : ''
    });
    audit({ entity: 'alert', entityId: row.id, action: 'create', after: { type: row.type, severity: row.severity }, channel: 'system', userId: 'SYSTEM', userLabel: 'System' });
    return row;
  }

  // Production: POST /alerts to the monitoring/on-call platform.
  function reportAlert(a) { return { ok: true, alert: clone(alertRow(a)) }; }

  // ---------- messages ----------

  // Production: POST /notifications via the email/SMS provider; delivery status arrives by webhook.
  function sendMessage(m) {
    var x = m || {};
    var customer = findCustomer(x.customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    var body = typeof x.body === 'string' ? x.body.trim() : '';
    if (!body) { return { ok: false, error: 'Message body is required.' }; }
    var channel = (x.channel === 'sms' || x.channel === 'email') ? x.channel
      : (x.toOverride && String(x.toOverride).indexOf('@') < 0 ? 'sms' : 'email');
    var to = x.toOverride || (channel === 'sms' ? customer.phone : customer.email) || null;
    var status = !to ? 'failed' : (channel === 'email' && customer.emailBounced ? 'bounced' : 'delivered');
    var links = (Array.isArray(x.links) ? x.links : []).filter(function (l) { return l && l.label && l.href; })
      .map(function (l) { return { label: String(l.label), href: String(l.href) }; });
    var row = Store.insert('messages', {
      at: Clock.now(),
      customerId: customer.id,
      to: to,
      channel: channel,
      kind: x.kind || 'general',
      templateId: x.templateId || null,
      subject: channel === 'sms' ? '' : redactString(String(x.subject || '')),
      body: redactString(body),
      status: status,
      links: links
    });
    // Production: the provider's bounce webhook flags the address.
    if (channel === 'email' && status !== 'delivered' && !customer.emailBounced) {
      Store.update('customers', customer.id, { emailBounced: true });
      audit({ entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'bounce-flag-set',
        before: { emailBounced: false }, after: { emailBounced: true }, note: 'Email did not deliver.', channel: 'system', userId: 'SYSTEM', userLabel: 'System' });
    }
    return { ok: true, message: clone(row), status: status };
  }

  function reversedText(amount, reference, balance) {
    return 'We have reversed your payment of ' + Fmt.money(amount) + ' (reference ' + reference + '). ' +
      'Your balance is now ' + Fmt.money(balance) + '. If you have any questions, call the collections team on ' +
      CONTACT_PHONE + ' or sign in to your account.';
  }

  // ---------- verification ----------

  function normDob(v) {
    var s = String(v === null || v === undefined ? '' : v).trim();
    var m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s);
    if (!m) { return s; }
    return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  }

  function normPostcode(v) { return String(v === null || v === undefined ? '' : v).replace(/\s+/g, '').toUpperCase(); }

  // Raises one alert when failed portal attempts across ANY account reach alertThreshold inside alertWindowMinutes (at most once per window).
  // Production: the identity service's rate monitor sends this to the on-call channel.
  function checkFailureSpike() {
    var threshold = numSetting('alertThreshold', 5);
    var windowMinutes = numSetting('alertWindowMinutes', 10);
    var now = minutesOf(Clock.now());
    function inWindow(at) {
      var m = minutesOf(at);
      return m !== null && m >= now - windowMinutes && m <= now;
    }
    var failed = Store.filter('verifications', function (v) { return v.method === 'portal' && v.outcome !== 'Verified' && inWindow(v.at); }).length;
    if (failed < threshold) { return; }
    if (Store.find('alerts', function (a) { return a.type === 'failed-verification-spike' && inWindow(a.at); })) { return; }
    reportAlert({
      type: 'failed-verification-spike', severity: 'high',
      detail: failed + ' failed portal verification attempts across all accounts in the last ' + windowMinutes + ' minutes (alert threshold ' + threshold + ').'
    });
  }

  // Production: POST /identity/verify (rate-limited). Returns only Verified / Not verified; answers are never stored.
  // The caller must call Auth.setVerified(customerId) (portal) or Auth.setPhoneVerified(customerId, true) (phone) on 'Verified'.
  function verify(accountNo, answers, opts) {
    var o = opts || {};
    var method = o.method === 'phone' ? 'phone' : 'portal';
    var a = answers || {};
    var customer = findByAccountNo(accountNo);
    var actor = method === 'phone' ? actorFor(o.actorId) : { id: o.actorId || null, label: 'Customer (unverified)', channel: 'portal' };
    var result;
    var locked = false;

    function record(outcome) {
      var row = Store.insert('verifications', {
        at: Clock.now(), accountNo: customer ? String(customer.accountNo) : 'unknown', customerId: customer ? customer.id : null,
        method: method, actorId: o.actorId || null, outcome: outcome
      });
      // A Verified portal check is made by the customer, so the audit row names them.
      var who = outcome === 'Verified' && customer && method === 'portal' ? { id: customer.id, label: customer.name, channel: 'portal' } : actor;
      auditAs(who, { entity: 'verification', entityId: row.id, customerId: customer ? customer.id : null, action: 'verify',
        after: { method: method, outcome: outcome } }, method === 'phone' ? 'staff' : 'portal');
      if (method === 'portal' && outcome !== 'Verified') { checkFailureSpike(); }
    }

    if (!customer) {
      record('Not verified');
      return { result: 'Not verified', customerId: null, locked: false };
    }

    // Portal: a locked account stays locked even for correct answers. Phone: reps must be able to verify a locked account to unlock it.
    if (customer.locked && method === 'portal') {
      record('Locked');
      return { result: 'Locked', customerId: customer.id, locked: true };
    }

    var correct = normDob(a.dob) === normDob(customer.dob) && normPostcode(a.postcode) === normPostcode(customer.postcode);

    if (correct) {
      if (method === 'portal' && customer.failedAttempts) { Store.update('customers', customer.id, { failedAttempts: 0 }); }
      record('Verified');
      return { result: 'Verified', customerId: customer.id, locked: !!customer.locked };
    }

    result = 'Not verified';
    locked = !!customer.locked;
    if (method === 'portal') {
      var threshold = numSetting('lockoutThreshold', 3);
      var attempts = (Number(customer.failedAttempts) || 0) + 1;
      var patch = { failedAttempts: attempts };
      if (attempts >= threshold) { patch.locked = true; }
      Store.update('customers', customer.id, patch);
      if (patch.locked) {
        locked = true;
        result = 'Locked';
        auditAs(actor, { entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'lockout',
          before: { locked: false, failedAttempts: attempts - 1 }, after: { locked: true, failedAttempts: attempts } }, 'portal');
        alertRow({ type: 'lockout', severity: 'high', detail: 'Account ' + customer.accountNo + ' locked after ' + attempts + ' failed portal verification attempts.' });
      }
    }
    record(result);
    return { result: result, customerId: customer.id, locked: locked };
  }

  // Production: POST /customers/{id}/unlock (requires a fresh phone-verification token).
  function unlock(customerId, actorId) {
    var customer = findCustomer(customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    var actor = actorFor(actorId);
    if (STAFF_ROLES.indexOf(roleOf(actor)) < 0) { return { ok: false, error: 'Only a rep or team leader can unlock an account.' }; }
    if (!Auth.phoneVerified(customer.id)) { return { ok: false, error: 'Verify the caller by phone before unlocking.' }; }
    if (!customer.locked) { return { ok: false, error: 'This account is not locked.' }; }
    Store.update('customers', customer.id, { locked: false, failedAttempts: 0 });
    auditAs(actor, { entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'unlock',
      before: { locked: true, failedAttempts: customer.failedAttempts }, after: { locked: false, failedAttempts: 0 }, note: 'Unlocked after phone verification.' }, 'staff');
    return { ok: true };
  }

  // ---------- payments ----------

  function paymentCount(customerId) {
    return Store.filter('payments', function (p) { return p.customerId === customerId && p.status === 'success'; }).length;
  }

  function payFail(msg, errors) {
    return { status: 'invalid', payment: null, reasonCategory: 'Validation', duplicate: false, error: msg, errors: errors || { _form: msg } };
  }

  /*
   * Production: POST /payments via the hosted payment provider; the Idempotency-Key header makes retries safe.
   * Idempotency design: exactly ONE payments row exists per idempotencyKey.
   *   - repeat key on a 'success' row  -> that row is returned (duplicate:true), nothing is charged again;
   *   - repeat key on a 'failed' row   -> the SAME row is retried in place (attempts + 1), no second row;
   *   - 'timeout-charged' stores the row as 'failed' with providerCharged:true (the provider took the money but we
   *     got no answer). The retry with the same key replays the provider's original charge, so it succeeds exactly
   *     once and the balance drops once.
   * Only the demo token is stored; the card form is never read.
   */
  function postPayment(req) {
    var r = req || {};
    var customer = findCustomer(r.customerId);
    if (!customer) { return payFail('Customer not found.'); }
    var key = typeof r.idempotencyKey === 'string' ? r.idempotencyKey.trim() : '';
    if (!key) { return payFail('An idempotency key is required.'); }
    var channel = PAYMENT_CHANNELS.indexOf(r.channel) >= 0 ? r.channel : 'portal';
    if (channel === 'portal') {
      var g = sessionError(customer.id);
      if (g) { return payFail(g); }
    }
    var actor = currentActor();
    var amount = parseAmount(r.amount);
    var row = Store.find('payments', function (p) { return p.idempotencyKey === key; });

    if (row) {
      if (row.customerId !== customer.id || r2(row.amount) !== amount) {
        return payFail('This idempotency key was already used for a different payment.');
      }
      if (row.status !== 'failed') {
        return { status: row.status, payment: clone(row), reasonCategory: row.reasonCategory || null, duplicate: true };
      }
    }

    var amountError = Validate.amount(r.amount, { max: customer.balance });
    if (amountError) { return payFail(amountError, { amount: amountError }); }

    var simulate = SIMULATIONS.indexOf(r.simulate) >= 0 ? r.simulate : 'approve';
    var retried = !!row;
    if (!row) {
      row = Store.insert('payments', {
        customerId: customer.id, amount: amount, date: Clock.today(), at: Clock.now(), channel: channel,
        status: 'failed', reasonCategory: null, reference: null, idempotencyKey: key,
        providerToken: 'tok_demo_' + randomToken(8), providerCharged: false, attempts: 0
      });
      Store.update('payments', row.id, { reference: 'PR-' + (100000 + idNum(row.id)) });
    }

    var success = false;
    var category = null;
    var charged = !!row.providerCharged;
    if (charged || simulate === 'approve') {
      success = true;
    } else if (simulate === 'decline') {
      category = 'Card declined';
    } else {
      category = 'Provider timeout';
      charged = simulate === 'timeout-charged';
    }

    Store.update('payments', row.id, {
      attempts: (Number(row.attempts) || 0) + 1, date: Clock.today(), at: Clock.now(),
      status: success ? 'success' : 'failed', reasonCategory: success ? null : category, providerCharged: charged
    });
    row = Store.find('payments', row.id);

    if (!success) {
      auditAs(actor, { entity: 'payment', entityId: row.id, customerId: customer.id, action: 'payment-failed',
        after: { amount: amount, status: 'failed', reasonCategory: category, attempts: row.attempts, providerCharged: charged },
        note: retried ? 'Retry with the same idempotency key.' : null });
      return { status: 'failed', payment: clone(row), reasonCategory: category, duplicate: false };
    }

    var before = r2(customer.balance);
    var after = Math.max(0, r2(before - amount));
    Store.update('customers', customer.id, { balance: after });
    auditAs(actor, { entity: 'payment', entityId: row.id, customerId: customer.id, action: 'payment-success',
      before: { balance: before }, after: { balance: after, amount: amount, reference: row.reference, channel: channel },
      note: retried ? 'Succeeded on retry; charged once.' : null });
    insertLog({ customerId: customer.id, kind: 'payment', amount: amount, reference: row.reference,
      channel: channel === 'portal' ? 'portal' : (channel === 'bank' ? 'system' : 'rep'),
      notes: 'Payment of ' + Fmt.money(amount) + ' received (' + channel + ').' }, actor);
    refreshPromiseFlags(customer.id);
    return { status: 'success', payment: clone(row), reasonCategory: null, duplicate: false };
  }

  // Production: POST /payments/{id}/reversals (leader approval, maker-checker) then provider refund.
  function reversePayment(req) {
    var r = req || {};
    var approver = r.approverId ? userById(r.approverId) : (Auth.role() === 'leader' ? Auth.user() : null);
    if (!approver || approver.role !== 'leader') { return { ok: false, error: 'Only a team leader can approve a reversal.' }; }
    var reasonCode = typeof r.reasonCode === 'string' ? r.reasonCode.trim() : '';
    if (!reasonCode) { return { ok: false, error: 'A reason code is required.' }; }
    var list = setting('reversalReasonCodes', []);
    if (Array.isArray(list) && list.length) {
      var codes = list.map(function (c) { return c && typeof c === 'object' ? c.code : c; });
      if (codes.indexOf(reasonCode) < 0) { return { ok: false, error: 'Choose a valid reason code.' }; }
    }
    var payment = r.paymentId ? Store.find('payments', String(r.paymentId)) : null;
    if (!payment) { return { ok: false, error: 'Payment not found.' }; }
    if (payment.status !== 'success') {
      return { ok: false, error: payment.status === 'reversed' ? 'This payment has already been reversed.' : 'Only successful payments can be reversed.' };
    }
    var customer = findCustomer(payment.customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }

    var actor = { id: approver.id, label: approver.name, channel: 'staff' };
    var amount = r2(payment.amount);
    var before = r2(customer.balance);
    var after = r2(before + amount);
    Store.update('customers', customer.id, { balance: after });
    Store.update('payments', payment.id, { status: 'reversed', reversedAt: Clock.now() });
    var reversal = Store.insert('reversals', {
      paymentId: payment.id, customerId: customer.id, amount: amount, reasonCode: reasonCode, approvedBy: approver.id, at: Clock.now()
    });
    auditAs(actor, { entity: 'payment', entityId: payment.id, customerId: customer.id, action: 'reversal',
      before: { status: 'success', balance: before }, after: { status: 'reversed', balance: after }, note: 'Reason code ' + reasonCode + '.' });
    insertLog({ customerId: customer.id, kind: 'reversal', amount: amount, reference: payment.reference, channel: 'rep',
      notes: 'Payment ' + payment.reference + ' reversed (' + reasonCode + ').' }, actor);
    // Highest Approved version of the 'Payment reversed' template; falls back to fixed text if none.
    var tpl = renderTemplate('Payment reversed', { name: firstName(customer), amount: Fmt.money(amount), reference: payment.reference });
    sendMessage({
      customerId: customer.id, kind: 'reversal', templateId: tpl ? tpl.templateId : null, subject: 'Your payment has been reversed',
      body: tpl ? tpl.body : reversedText(amount, payment.reference, after),
      links: [{ label: 'View your account', href: 'portal-account.html' }]
    });
    refreshPromiseFlags(customer.id);
    return { ok: true, reversal: clone(reversal), payment: clone(Store.find('payments', payment.id)), balance: after };
  }

  // ---------- promises ----------

  // Latest promise for a customer (by createdAt, then id).
  function latestPromise(customerId) {
    var best = null;
    Store.get('promises').forEach(function (p) {
      if (p.customerId !== customerId) { return; }
      if (!best || String(p.createdAt || '') > String(best.createdAt || '') ||
          (String(p.createdAt || '') === String(best.createdAt || '') && idNum(p.id) > idNum(best.id))) { best = p; }
    });
    return best;
  }

  // The single 'payments since' rule: successful payments with at >= since and, if given, at <= until.
  // A date-only bound compares by day, so a date-only until covers the whole of that day.
  // Production: SUM(amount) over the payment ledger for the customer and window.
  function paymentTotalSince(customerId, sinceIso, untilIso) {
    var since = String(sinceIso || '');
    var until = untilIso ? String(untilIso) : '';
    var total = 0;
    Store.get('payments').forEach(function (pay) {
      if (pay.customerId !== customerId || pay.status !== 'success') { return; }
      var at = String(pay.at || pay.date || '');
      var afterStart = (at.length < 16 || since.length < 16) ? at.slice(0, 10) >= since.slice(0, 10) : at >= since;
      var beforeEnd = !until || ((at.length < 16 || until.length < 16) ? at.slice(0, 10) <= until.slice(0, 10) : at <= until);
      if (afterStart && beforeEnd) { total += Number(pay.amount) || 0; }
    });
    return r2(total);
  }

  // Computes the flag for the latest promise without writing anything.
  function computeFlag(customerId) {
    var p = latestPromise(customerId);
    if (!p || p.status !== 'Not fulfilled') { return null; }
    var original = typeof p.shortfall === 'number' ? p.shortfall : r2(Number(p.amount) - (Number(p.received) || 0));
    var paid = paymentTotalSince(customerId, p.checkedAt || p.dueDate);
    var remaining = r2(original - paid);
    if (remaining <= 0) { return { promise: p, flag: null }; }
    return { promise: p, flag: { promiseId: p.id, amount: r2(p.amount), dueDate: p.dueDate, shortfall: remaining, originalShortfall: r2(original), paidSince: paid } };
  }

  /*
   * Production: derived view/read model on the account (flag computed from promise + payment ledger).
   * Design: status stays 'Not fulfilled' (history and the unfulfilled report keep it); the flag is DERIVED from the
   * latest promise plus successful payments after the fulfilment check (checkedAt, else after dueDate).
   * promiseFlag() is read-only; refreshPromiseFlags() also stamps promise.flagClearedAt (and audits) when payments
   * cover the shortfall, and clears the stamp again if a reversal re-opens it.
   */
  function promiseFlag(customerId) {
    var c = computeFlag(customerId);
    return c ? c.flag : null;
  }

  function refreshPromiseFlags(customerId) {
    var c = computeFlag(customerId);
    if (!c) { return null; }
    var p = c.promise;
    if (!c.flag && !p.flagClearedAt) {
      Store.update('promises', p.id, { flagClearedAt: Clock.now() });
      audit({ entity: 'promise', entityId: p.id, customerId: customerId, action: 'flag-cleared',
        before: { flagged: true }, after: { flagged: false }, note: 'Payments since the promise date cover the shortfall.', channel: 'system', userId: 'SYSTEM', userLabel: 'System' });
    } else if (c.flag && p.flagClearedAt) {
      Store.update('promises', p.id, { flagClearedAt: null });
      audit({ entity: 'promise', entityId: p.id, customerId: customerId, action: 'flag-restored',
        before: { flagged: false }, after: { flagged: true }, note: 'Shortfall re-opened.', channel: 'system', userId: 'SYSTEM', userLabel: 'System' });
    }
    return c.flag;
  }

  // Production: POST /customers/{id}/promises (supersedes the active promise; pauses collection activity).
  function createPromise(req) {
    var r = req || {};
    var customer = findCustomer(r.customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.', errors: { _form: 'Customer not found.' } }; }
    var source = r.source === 'rep' ? 'rep' : 'portal';
    if (source === 'portal') {
      var g = sessionError(customer.id);
      if (g) { return failForm(g); }
    }
    var errors = {};
    var amountError = Validate.amount(r.amount, { max: customer.balance });
    if (amountError) { errors.amount = amountError; }
    var win = promiseWindow();
    var today = Clock.today();
    var dateError = Validate.date(r.dueDate, { min: Clock.addDays(today, win.min), max: Clock.addDays(today, win.max) });
    if (dateError) { errors.dueDate = dateError; }
    if (isBlank(r.verificationResult)) { errors.verificationResult = 'A verification result is required.'; }
    var keys = Object.keys(errors);
    if (keys.length) { return { ok: false, error: errors[keys[0]], errors: errors }; }

    var actor = currentActor();
    var amount = parseAmount(r.amount);
    var dueDate = String(r.dueDate).trim();
    var olds = Store.filter('promises', function (p) { return p.customerId === customer.id && p.status === 'Active'; });
    var promise = Store.insert('promises', {
      customerId: customer.id, amount: amount, dueDate: dueDate, createdAt: Clock.now(), source: source,
      verificationResult: String(r.verificationResult), status: 'Active', reference: null,
      supersedes: olds.length ? olds[0].id : null
    });
    Store.update('promises', promise.id, { reference: 'PTP-' + (100000 + idNum(promise.id)) });

    olds.forEach(function (old) {
      Store.update('promises', old.id, { status: 'Superseded', supersededBy: promise.id });
      auditAs(actor, { entity: 'promise', entityId: old.id, customerId: customer.id, action: 'supersede',
        before: { status: 'Active' }, after: { status: 'Superseded', supersededBy: promise.id } });
    });

    var paused = Store.filter('followups', function (f) { return f.customerId === customer.id && f.status === 'Open'; });
    paused.forEach(function (f) {
      Store.update('followups', f.id, { status: 'Paused', pausedUntil: dueDate });
      auditAs(actor, { entity: 'followup', entityId: f.id, customerId: customer.id, action: 'pause',
        before: { status: 'Open' }, after: { status: 'Paused', pausedUntil: dueDate }, note: 'Paused by promise to pay.' });
    });

    auditAs(actor, { entity: 'promise', entityId: promise.id, customerId: customer.id, action: 'create',
      after: { amount: amount, dueDate: dueDate, source: source, verificationResult: promise.verificationResult, status: 'Active' } });
    insertLog({ customerId: customer.id, kind: 'promise', amount: amount, promiseAmount: amount, promiseDate: dueDate,
      reference: Store.find('promises', promise.id).reference, channel: source === 'portal' ? 'portal' : 'rep',
      notes: 'Promise to pay ' + Fmt.money(amount) + ' by ' + Fmt.date(dueDate) + '.' }, actor);

    var ref = Store.find('promises', promise.id).reference;
    var confirmation = renderTemplate('Promise confirmation', {
      name: firstName(customer), amount: Fmt.money(amount), date: Fmt.date(dueDate), reference: ref, phone: CONTACT_PHONE
    });
    sendMessage({
      customerId: customer.id, kind: 'promise-confirmation', templateId: confirmation ? confirmation.templateId : null, subject: 'Your promise to pay is confirmed',
      body: confirmation ? confirmation.body : 'Your promise to pay ' + Fmt.money(amount) + ' by ' + Fmt.date(dueDate) + ' is recorded (reference ' + ref + ').',
      links: [{ label: 'View your promise', href: 'portal-promise.html' }, { label: 'View your account', href: 'portal-account.html' }]
    });
    return { ok: true, promise: clone(Store.find('promises', promise.id)), superseded: olds.map(function (o) { return o.id; }), pausedFollowups: paused.length };
  }

  // ---------- follow-ups ----------

  var TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

  // Production: GET /followup-rules?outcome=... (per-outcome interval) merged with the customer's contact preference.
  function followupDefaults(outcomeCode, customerId) {
    var def = (Store.config('outcomeCodes') || []).filter(function (o) { return o.code === outcomeCode; })[0] || null;
    var days = def && isFinite(Number(def.followUpDays)) && Number(def.followUpDays) > 0 ? Number(def.followUpDays) : 1;
    var customer = findCustomer(customerId);
    var pref = (customer && customer.preferred) || {};
    var actor = currentActor();
    return {
      dueDate: Clock.addDays(Clock.today(), days),
      time: pref.from && TIME_RE.test(pref.from) ? pref.from : '09:00',
      ownerId: STAFF_ROLES.indexOf(roleOf(actor)) >= 0 ? actor.id : null,
      channel: pref.channel || null,
      followUp: !!(def && def.followUp),
      days: days
    };
  }

  // Production: POST /followups. A changed default date or a time outside the preferred window needs overrideReason.
  function createFollowup(req) {
    var r = req || {};
    var customer = findCustomer(r.customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.', errors: { _form: 'Customer not found.' } }; }
    var defs = followupDefaults(r.outcomeCode, customer.id);
    var ownerId = r.ownerId || defs.ownerId;
    var dueDate = r.dueDate || defs.dueDate;
    var time = r.time || defs.time;
    var reason = isBlank(r.overrideReason) ? '' : String(r.overrideReason).trim();
    var errors = {};

    var owner = userById(ownerId);
    if (!owner || STAFF_ROLES.indexOf(owner.role) < 0) { errors.ownerId = 'Choose a rep or team leader as the owner.'; }
    var dateError = Validate.date(dueDate, { min: Clock.today() });
    if (dateError) { errors.dueDate = dateError; }
    if (!TIME_RE.test(String(time))) { errors.time = 'Enter a time as HH:MM.'; }
    if (!Object.keys(errors).length && !reason) {
      var pref = customer.preferred || {};
      if (r.outcomeCode && dueDate !== defs.dueDate) { errors.overrideReason = 'Enter a reason for changing the default follow-up date.'; }
      else if (pref.from && pref.to && (time < pref.from || time > pref.to)) { errors.overrideReason = 'Enter a reason for choosing a time outside the customer\'s preferred window.'; }
    }
    var keys = Object.keys(errors);
    if (keys.length) { return { ok: false, error: errors[keys[0]], errors: errors }; }

    var actor = currentActor();
    // An Active promise due after this follow-up keeps it paused until the promise date (resumed by the fulfilment check).
    var promise = Store.find('promises', function (p) { return p.customerId === customer.id && p.status === 'Active' && String(p.dueDate) > dueDate; });
    var row = Store.insert('followups', {
      customerId: customer.id, ownerId: ownerId, dueDate: dueDate, time: time, channel: r.channel || defs.channel,
      status: promise ? 'Paused' : 'Open', pausedUntil: promise ? promise.dueDate : null, sourceLogId: r.sourceLogId || null, outcomeCode: r.outcomeCode || null,
      overrideReason: reason ? redactString(reason) : null, createdAt: Clock.now(), completedAt: null, reassignedFrom: null
    });
    var notes = [];
    if (reason) { notes.push('Override reason recorded.'); }
    if (promise) { notes.push('Paused until promise date ' + Fmt.date(promise.dueDate) + '.'); }
    auditAs(actor, { entity: 'followup', entityId: row.id, customerId: customer.id, action: 'create',
      after: { ownerId: ownerId, dueDate: dueDate, time: time, outcomeCode: row.outcomeCode, status: row.status, pausedUntil: row.pausedUntil }, note: notes.length ? notes.join(' ') : null });
    return { ok: true, followup: clone(row) };
  }

  // Production: PATCH /followups/{id} {dueDate, time}. Same override-reason rules as createFollowup.
  function rescheduleFollowup(id, req) {
    var f = id ? Store.find('followups', String(id)) : null;
    if (!f) { return { ok: false, error: 'Follow-up not found.' }; }
    if (f.status === 'Done') { return { ok: false, error: 'Completed follow-ups cannot be rescheduled.' }; }
    var r = req || {};
    var customer = findCustomer(f.customerId);
    var dueDate = r.dueDate || f.dueDate;
    var time = r.time || f.time;
    var reason = isBlank(r.overrideReason) ? '' : String(r.overrideReason).trim();
    var errors = {};

    var dateError = Validate.date(dueDate, { min: Clock.today() });
    if (dateError) { errors.dueDate = dateError; }
    if (!TIME_RE.test(String(time))) { errors.time = 'Enter a time as HH:MM.'; }
    if (!Object.keys(errors).length && dueDate === f.dueDate && time === f.time) { errors._form = 'No changes to save.'; }
    if (!Object.keys(errors).length && !reason) {
      var pref = (customer && customer.preferred) || {};
      var defs = followupDefaults(f.outcomeCode, f.customerId);
      if (f.outcomeCode && dueDate !== defs.dueDate) { errors.overrideReason = 'Enter a reason for changing the default follow-up date.'; }
      else if (pref.from && pref.to && (time < pref.from || time > pref.to)) { errors.overrideReason = 'Enter a reason for choosing a time outside the customer\'s preferred window.'; }
    }
    var keys = Object.keys(errors);
    if (keys.length) { return { ok: false, error: errors[keys[0]], errors: errors }; }

    var patch = { dueDate: dueDate, time: time };
    if (reason) { patch.overrideReason = redactString(reason); }
    Store.update('followups', f.id, patch);
    audit({ entity: 'followup', entityId: f.id, customerId: f.customerId, action: 'reschedule',
      before: { dueDate: f.dueDate, time: f.time }, after: { dueDate: dueDate, time: time }, note: reason ? 'Override reason recorded.' : null });
    return { ok: true, followup: clone(Store.find('followups', f.id)) };
  }

  // Production: PATCH /followups/{id} {status:'Done'}.
  function completeFollowup(id) {
    var f = id ? Store.find('followups', String(id)) : null;
    if (!f) { return { ok: false, error: 'Follow-up not found.' }; }
    if (f.status === 'Done') { return { ok: false, error: 'This follow-up is already complete.' }; }
    var before = f.status;
    Store.update('followups', f.id, { status: 'Done', completedAt: Clock.now() });
    audit({ entity: 'followup', entityId: f.id, customerId: f.customerId, action: 'complete', before: { status: before }, after: { status: 'Done' } });
    return { ok: true, followup: clone(Store.find('followups', f.id)) };
  }

  // Production: POST /followups/{id}/reassign (team leader only).
  function reassignFollowup(id, newOwnerId) {
    var f = id ? Store.find('followups', String(id)) : null;
    if (!f) { return { ok: false, error: 'Follow-up not found.' }; }
    var actor = currentActor();
    if (roleOf(actor) !== 'leader') { return { ok: false, error: 'Only a team leader can reassign follow-ups.' }; }
    var owner = userById(newOwnerId);
    if (!owner || STAFF_ROLES.indexOf(owner.role) < 0) { return { ok: false, error: 'Choose a rep or team leader as the new owner.' }; }
    if (f.status === 'Done') { return { ok: false, error: 'Completed follow-ups cannot be reassigned.' }; }
    if (f.ownerId === owner.id) { return { ok: false, error: 'This follow-up already belongs to that owner.' }; }
    var oldOwner = userById(f.ownerId);
    Store.update('followups', f.id, { ownerId: owner.id, reassignedFrom: f.ownerId });
    insertLog({ customerId: f.customerId, kind: 'followup', channel: 'rep',
      notes: 'Follow-up reassigned from ' + (oldOwner ? oldOwner.name : f.ownerId) + ' to ' + owner.name + '.' }, actor);
    audit({ entity: 'followup', entityId: f.id, customerId: f.customerId, action: 'reassign',
      before: { ownerId: f.ownerId }, after: { ownerId: owner.id } });
    return { ok: true, followup: clone(Store.find('followups', f.id)) };
  }

  // ---------- contact limit ----------

  // Window length for contactLimit, read from settings.contactLimit.windowDays (default 7).
  function contactWindowDays() {
    var n = Number((Store.settings().contactLimit || {}).windowDays);
    return isFinite(n) && n > 0 ? n : 7;
  }

  // Production: GET /customers/{id}/contact-count?asOf=... (interaction and reminder logs in the window ending asOf).
  function contactCount(customerId, dateIso) {
    var end = dateIso || Clock.today();
    var start = Clock.addDays(end, -(contactWindowDays() - 1));
    return Store.filter('logs', function (l) {
      if (l.customerId !== customerId || (l.kind !== 'interaction' && l.kind !== 'reminder')) { return false; }
      var d = String(l.date || l.at || '').slice(0, 10);
      return d >= start && d <= end;
    }).length;
  }

  // exceeds is true when one more contact on dateIso would break the limit (count >= limit).
  function checkContactLimit(customerId, dateIso) {
    var count = contactCount(customerId, dateIso);
    var limit = numSetting('contactLimit', null);
    return { count: count, limit: limit, exceeds: limit !== null && count >= limit, windowDays: contactWindowDays() };
  }

  // ---------- contact details ----------

  function sameAddress(a, b) {
    return !!a && !!b && a.line1 === b.line1 && a.city === b.city && a.postcode === b.postcode;
  }

  // Production: PATCH /customers/{id}/contact (validated server-side; before/after in the audit store).
  function updateContactDetails(customerId, patch, opts) {
    var o = opts || {};
    var customer = findCustomer(customerId);
    if (!customer) { return failForm('Customer not found.'); }
    var actor = actorFor(o.actorId);
    var channel = (o.channel === 'portal' || o.channel === 'staff') ? o.channel : (actor.channel === 'portal' ? 'portal' : 'staff');
    if (channel === 'portal') {
      var g = sessionError(customer.id);
      if (g) { return failForm(g); }
    }
    var allowedKeys = ['phone', 'email', 'address'];
    var editable = Array.isArray(customer.editableFields) ? customer.editableFields : [];
    var p = patch && typeof patch === 'object' ? patch : {};
    var errors = {};
    var clean = {};
    Object.keys(p).forEach(function (k) {
      if (allowedKeys.indexOf(k) < 0 || (channel === 'portal' && editable.indexOf(k) < 0)) {
        errors[k] = 'This field cannot be changed here.';
      } else if (k === 'address') {
        var a = p.address && typeof p.address === 'object' ? p.address : {};
        var merged = extend({}, customer.address || {});
        ['line1', 'city', 'postcode'].forEach(function (f) { if (a[f] !== undefined) { merged[f] = String(a[f]).trim(); } });
        clean.address = { line1: merged.line1 || '', city: merged.city || '', postcode: merged.postcode || '' };
      } else {
        clean[k] = String(p[k] === null || p[k] === undefined ? '' : p[k]).trim();
      }
    });
    extend(errors, Validate.contact(clean));
    if (Object.keys(errors).length) { return { ok: false, error: errors[Object.keys(errors)[0]], errors: errors }; }
    if (!Object.keys(clean).length) { return failForm('Enter the details you want to change.'); }
    if (clean.address) { clean.address.postcode = clean.address.postcode.toUpperCase(); }

    var changed = [];
    var before = {};
    var after = {};
    if (clean.phone !== undefined && clean.phone !== customer.phone) { changed.push('phone'); before.phone = customer.phone; after.phone = clean.phone; }
    if (clean.email !== undefined && clean.email !== customer.email) { changed.push('email'); before.email = customer.email; after.email = clean.email; }
    if (clean.address !== undefined && !sameAddress(clean.address, customer.address)) {
      changed.push('address'); before.address = clone(customer.address); after.address = clone(clean.address);
    }
    if (!changed.length) { return failForm('No changes to save.'); }

    var oldEmail = customer.email;
    var oldPhone = customer.phone;
    var now = Clock.now();
    var upd = { lastChange: { by: actor.id, at: now, fields: changed.slice(), channel: channel } };
    changed.forEach(function (f) { upd[f] = clone(after[f]); });
    Store.update('customers', customer.id, upd);

    auditAs(actor, { entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'update-contact',
      before: before, after: after, note: 'Fields changed: ' + changed.join(', ') + '.' }, channel);
    insertLog({ customerId: customer.id, kind: 'change', channel: channel === 'portal' ? 'portal' : 'rep',
      notes: 'Contact details updated (' + changed.join(', ') + ').' }, actor);

    // Notify the PREVIOUS contact points; the new values are deliberately not repeated in the message.
    var what = changed.map(function (f) { return f === 'phone' ? 'phone number' : (f === 'email' ? 'email address' : 'address'); }).join(' and ');
    var notice = renderTemplate('Details changed', { name: firstName(customer), what: what, phone: CONTACT_PHONE });
    var text = notice ? notice.body : 'The ' + what + ' on your account was changed. If you did not make this change, call ' + CONTACT_PHONE + '.';
    var link = [{ label: 'Sign in to review your details', href: 'portal-verify.html' }];
    var sends = [];
    if (changed.indexOf('email') >= 0) { sends.push({ toOverride: oldEmail, channel: 'email' }); }
    if (changed.indexOf('phone') >= 0) { sends.push({ toOverride: oldPhone, channel: 'sms' }); }
    if (!sends.length) { sends.push({ toOverride: oldEmail, channel: 'email' }); }
    var messages = [];
    sends.forEach(function (s) {
      var res = sendMessage({ kind: 'previous-contact', customerId: customer.id, templateId: notice ? notice.templateId : null, subject: 'Your account details were changed',
        body: text, links: link, toOverride: s.toOverride, channel: s.channel });
      if (res.ok) { messages.push(res.message.id); }
    });

    // A corrected email address is a new address, so the old bounce flag no longer applies.
    if (changed.indexOf('email') >= 0 && Store.find('customers', customer.id).emailBounced) {
      Store.update('customers', customer.id, { emailBounced: false });
      auditAs(actor, { entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'bounce-flag-cleared',
        before: { emailBounced: true }, after: { emailBounced: false }, note: 'Email address changed.' }, channel);
    }
    return { ok: true, changed: changed, customer: clone(Store.find('customers', customer.id)), messages: messages };
  }

  // ---------- preferences, queries, views ----------

  // Production: PUT /customers/{id}/reminder-preferences (works from the signed link in a reminder email).
  function setReminderPrefs(customerId, prefs) {
    var customer = findCustomer(customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    var p = prefs && typeof prefs === 'object' ? prefs : {};
    var verified = Auth.verifiedCustomer();
    if (Auth.role() === 'customer' && verified && verified !== customer.id) { return { ok: false, error: 'You can only change your own preferences.' }; }
    if (p.optedOut !== undefined && typeof p.optedOut !== 'boolean') { return { ok: false, error: 'Opted out must be true or false.' }; }
    if (p.channel !== undefined && ['email', 'sms', 'both'].indexOf(p.channel) < 0) { return { ok: false, error: 'Choose email, SMS or both.' }; }
    if (p.optedOut === undefined && p.channel === undefined) { return { ok: false, error: 'No preference supplied.' }; }

    var current = extend({}, customer.reminderPrefs || {});
    var next = extend({}, current);
    if (p.optedOut !== undefined) { next.optedOut = p.optedOut; if (p.optedOut !== !!current.optedOut) { next.optedOutAt = p.optedOut ? Clock.now() : null; } }
    if (p.channel !== undefined) { next.channel = p.channel; }
    var actor = currentActor();
    if (actor.channel === 'portal') { actor = { id: customer.id, label: customer.name, channel: 'portal' }; }
    Store.update('customers', customer.id, { reminderPrefs: next });
    auditAs(actor, { entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'update-reminder-prefs', before: current, after: next });
    return { ok: true, reminderPrefs: clone(next) };
  }

  // Production: POST /customers/{id}/queries; opens a case and places a hold on collection activity.
  function raiseQuery(customerId, details) {
    var customer = findCustomer(customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    if (Auth.role() === 'customer') {
      var g = sessionError(customer.id);
      if (g) { return { ok: false, error: g }; }
    }
    var actor = currentActor();
    var existing = Store.find('queries', function (q) { return q.customerId === customer.id && q.status === 'Open'; });
    if (existing) {
      if (!customer.delinquencyHold) { Store.update('customers', customer.id, { delinquencyHold: true }); }
      return { ok: true, query: clone(existing), duplicate: true };
    }
    var d = details && typeof details === 'object' ? details : {};
    var promise = latestPromise(customer.id);
    var query = Store.insert('queries', {
      customerId: customer.id, at: Clock.now(),
      expectedDate: d.expectedDate || (promise ? promise.dueDate : null),
      expectedAmount: d.expectedAmount !== undefined && d.expectedAmount !== null ? parseAmount(d.expectedAmount) : (promise ? r2(promise.amount) : null),
      status: 'Open'
    });
    var before = !!customer.delinquencyHold;
    Store.update('customers', customer.id, { delinquencyHold: true });
    auditAs(actor, { entity: 'query', entityId: query.id, customerId: customer.id, action: 'raise-query',
      before: { delinquencyHold: before }, after: { delinquencyHold: true, status: 'Open' } });
    return { ok: true, query: clone(query), duplicate: false };
  }

  // Production: PUT /customers/{id}/contact-preference (staff-recorded channel and time window).
  function setPreferredContact(customerId, prefs) {
    var customer = findCustomer(customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    var p = prefs && typeof prefs === 'object' ? prefs : {};
    var errors = {};
    if (['phone', 'email', 'sms'].indexOf(p.channel) < 0) { errors.channel = 'Choose a preferred channel.'; }
    if (!TIME_RE.test(String(p.from))) { errors.from = 'Enter the start time.'; }
    if (!TIME_RE.test(String(p.to))) { errors.to = 'Enter the end time.'; }
    if (!errors.from && !errors.to && p.from >= p.to) { errors.to = 'The end time must be after the start time.'; }
    var keys = Object.keys(errors);
    if (keys.length) { return { ok: false, error: errors[keys[0]], errors: errors }; }

    var cur = customer.preferred || {};
    var before = { channel: cur.channel || null, from: cur.from || null, to: cur.to || null };
    var after = { channel: p.channel, from: p.from, to: p.to };
    if (before.channel === after.channel && before.from === after.from && before.to === after.to) {
      return { ok: true, changed: false, preferred: clone(after) };
    }
    Store.update('customers', customer.id, { preferred: after });
    audit({ entity: 'customer', entityId: customer.id, customerId: customer.id, action: 'update-preferences',
      before: before, after: after, note: 'Contact preference recorded by staff.' });
    return { ok: true, changed: true, preferred: clone(after) };
  }

  // Production: POST /customers/{id}/queries/{queryId}/resolve (rep or team leader); lifts the hold on collection activity.
  function resolveQuery(customerId, note) {
    var customer = findCustomer(customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    var actor = currentActor();
    if (STAFF_ROLES.indexOf(roleOf(actor)) < 0) { return { ok: false, error: 'Only a rep or team leader can mark a query reviewed.' }; }
    var query = Store.find('queries', function (q) { return q.customerId === customer.id && q.status === 'Open'; });
    if (!query && !customer.delinquencyHold) { return { ok: false, error: 'There is no open query on this account.' }; }
    if (query) { Store.update('queries', query.id, { status: 'Resolved', resolvedAt: Clock.now(), resolvedBy: actor.id }); }
    Store.update('customers', customer.id, { delinquencyHold: false });
    audit({ entity: 'query', entityId: query ? query.id : null, customerId: customer.id, action: 'resolve-query',
      before: { status: query ? 'Open' : null, delinquencyHold: true }, after: { status: query ? 'Resolved' : null, delinquencyHold: false },
      note: note || 'Query reviewed.' });
    return { ok: true, query: query ? clone(Store.find('queries', query.id)) : null };
  }

  // Production: account-view event written by the portal API on each page load (append-only; not double-audited).
  // displayed defaults to the source values; pass what the page really rendered to make the sampling check meaningful.
  function recordAccountView(customerId, displayed) {
    var customer = findCustomer(customerId);
    if (!customer) { return { ok: false, error: 'Customer not found.' }; }
    var source = { balance: r2(customer.balance), dueDate: customer.dueDate || null, paymentCount: paymentCount(customer.id) };
    var shown = displayed && typeof displayed === 'object'
      ? { balance: displayed.balance, dueDate: displayed.dueDate, paymentCount: displayed.paymentCount }
      : clone(source);
    var view = Store.insert('accountViews', { at: Clock.now(), customerId: customer.id, displayed: shown, source: source });
    return { ok: true, view: clone(view) };
  }

  // ---------- integrity checks ----------

  var CUSTOMER_TYPES = {
    id: 'string', accountNo: 'string', name: 'string', dob: 'date', postcode: 'string', email: 'string', phone: 'string',
    balance: 'number', originalBalance: 'number', dueDate: 'date?', team: 'string', locked: 'boolean',
    failedAttempts: 'number', emailBounced: 'boolean', delinquencyHold: 'boolean', ledgerRef: 'string',
    internalNotes: 'string?', editableFields: 'array', address: 'object', preferred: 'object?', reminderPrefs: 'object',
    lastChange: 'object?'
  };

  function typeName(v) { return v === null ? 'null' : (Array.isArray(v) ? 'array' : typeof v); }

  function typeOk(v, spec) {
    var nullable = spec.charAt(spec.length - 1) === '?';
    var t = nullable ? spec.slice(0, -1) : spec;
    if (v === null || v === undefined) { return nullable; }
    if (t === 'number') { return typeof v === 'number' && isFinite(v); }
    if (t === 'date') { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v); }
    if (t === 'array') { return Array.isArray(v); }
    if (t === 'object') { return typeof v === 'object' && !Array.isArray(v); }
    return typeof v === t;
  }

  // Production: nightly data-quality job / schema constraints on the customer table. Reports types only, never values.
  function validateSchema() {
    var issues = [];
    var customers = Store.get('customers');
    function check(c, field, spec, v) {
      if (!typeOk(v, spec)) {
        issues.push({ customerId: c && c.id !== undefined ? c.id : null, accountNo: c && c.accountNo !== undefined ? String(c.accountNo) : null,
          field: field, expected: spec.replace('?', ' or null'), actual: typeName(v),
          message: field + ' should be ' + spec.replace('?', ' or null') + ' but is ' + typeName(v) + '.' });
      }
    }
    customers.forEach(function (c) {
      Object.keys(CUSTOMER_TYPES).forEach(function (f) { check(c, f, CUSTOMER_TYPES[f], c[f]); });
      if (c.address && typeof c.address === 'object') {
        ['line1', 'city', 'postcode'].forEach(function (f) { check(c, 'address.' + f, 'string', c.address[f]); });
      }
      if (c.reminderPrefs && typeof c.reminderPrefs === 'object') { check(c, 'reminderPrefs.optedOut', 'boolean', c.reminderPrefs.optedOut); }
    });
    return { ok: issues.length === 0, issues: issues, checked: customers.length };
  }

  // Walks a value and collects card-like runs; never returns the full number.
  function scanValue(value, coll, id, path, out) {
    if (typeof value === 'string') {
      findCardRuns(value).forEach(function (run) {
        out.push({ collection: coll, id: id, path: path, sample: Fmt.mask(run.text.replace(/\D/g, ''), 4) });
      });
    } else if (typeof value === 'number') {
      if (isFinite(value) && Math.abs(value) >= 1e12 && Math.floor(value) === value) {
        findCardRuns(String(Math.abs(value))).forEach(function (run) {
          out.push({ collection: coll, id: id, path: path, sample: Fmt.mask(run.text, 4) });
        });
      }
    } else if (Array.isArray(value)) {
      value.forEach(function (v, i) { scanValue(v, coll, id, path + '[' + i + ']', out); });
    } else if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (k) { scanValue(value[k], coll, id, path ? path + '.' + k : k, out); });
    }
  }

  // Production: DLP / PCI scan of the data stores. Store has no list-collections call, so names are listed here plus any extra SEED_ACTIVITY keys.
  function scanForCardData() {
    var names = KNOWN_COLLECTIONS.slice();
    Object.keys(window.SEED_ACTIVITY || {}).forEach(function (k) { if (names.indexOf(k) < 0) { names.push(k); } });
    var out = [];
    names.forEach(function (name) {
      var data = Store.get(name);
      if (Array.isArray(data)) {
        data.forEach(function (item) { scanValue(item, name, item && item.id !== undefined ? item.id : null, '', out); });
      } else {
        scanValue(data, name, null, '', out);
      }
    });
    return out;
  }

  // ---------- public object ----------

  var Services = {
    REP_CONTACT_PHONE: CONTACT_PHONE,
    currentActor: currentActor,
    setting: setting,
    verify: verify,
    unlock: unlock,
    audit: audit,
    addLog: addLog,
    postPayment: postPayment,
    reversePayment: reversePayment,
    createPromise: createPromise,
    refreshPromiseFlags: refreshPromiseFlags,
    promiseFlag: promiseFlag,
    followupDefaults: followupDefaults,
    createFollowup: createFollowup,
    completeFollowup: completeFollowup,
    rescheduleFollowup: rescheduleFollowup,
    reassignFollowup: reassignFollowup,
    contactCount: contactCount,
    checkContactLimit: checkContactLimit,
    updateContactDetails: updateContactDetails,
    sendMessage: sendMessage,
    scanForCardData: scanForCardData,
    validateSchema: validateSchema,
    reportAlert: reportAlert,
    recordAccountView: recordAccountView,
    paymentCount: paymentCount,
    paymentTotalSince: paymentTotalSince,
    promiseWindow: promiseWindow,
    updateSetting: updateSetting,
    renderTemplate: renderTemplate,
    preferencesLink: preferencesLink,
    customerByToken: customerByToken,
    setPreferredContact: setPreferredContact,
    resolveQuery: resolveQuery,
    setReminderPrefs: setReminderPrefs,
    raiseQuery: raiseQuery
  };

  // ---------- ReadApi ----------

  var ReadApi = {
    // Production: GET /api/... on a read-only replica; a customer token only ever sees its own record. Every call is logged.
    request: function (method, path, opts) {
      var m = String(method || '').toUpperCase();
      var p = String(path || '').trim();
      var sid = opts && opts.sessionCustomerId ? String(opts.sessionCustomerId) : null;
      var res = route(m, p, sid);
      Store.insert('apiRequests', {
        at: Clock.now(), sessionCustomerId: sid, method: m, path: redactString(p.slice(0, 200)), status: res.status, note: res.note
      });
      return { status: res.status, body: res.body };
    }
  };

  function ownRecord(c) {
    var out = clone(c);
    ['dob', 'postcode', 'internalNotes', 'ledgerRef', 'unsubToken'].forEach(function (k) { delete out[k]; });
    out.readOnly = true;
    return out;
  }

  function route(m, rawPath, sid) {
    var session = sid ? findCustomer(sid) : null;
    if (!session) {
      return { status: 401, body: { error: 'Not authenticated.' }, note: sid ? 'Unknown session customer' : 'No session' };
    }
    if (m !== 'GET') {
      return { status: 405, body: { error: 'Method not allowed. This interface is read-only.', allow: ['GET'] }, note: 'Write attempt rejected' };
    }
    var path = rawPath.replace(/[?#].*$/, '').replace(/\/+$/, '');
    if (path === '/api/me/account') { return { status: 200, body: ownRecord(session), note: 'Own record' }; }
    if (path === '/api/me/payments') {
      var pays = Store.filter('payments', function (x) { return x.customerId === session.id; }).map(function (x) {
        return { id: x.id, date: x.date, at: x.at, amount: x.amount, channel: x.channel, status: x.status, reference: x.reference, reasonCategory: x.reasonCategory || null };
      });
      return { status: 200, body: { readOnly: true, paymentCount: paymentCount(session.id), payments: pays }, note: 'Own payments' };
    }
    if (path === '/api/me/promise') {
      var active = Store.find('promises', function (x) { return x.customerId === session.id && x.status === 'Active'; });
      return { status: 200, body: { readOnly: true, promise: active ? clone(active) : null }, note: 'Own active promise' };
    }
    var mm = /^\/api\/customers\/([^\/]+)$/.exec(path);
    if (mm) {
      var key = mm[1];
      try { key = decodeURIComponent(key); } catch (e) { /* keep raw key */ }
      if (key === session.id || key === String(session.accountNo)) { return { status: 200, body: ownRecord(session), note: 'Own record' }; }
      // Same 403 for other customers and unknown identifiers, so the response does not reveal which accounts exist.
      audit({ entity: 'api', entityId: null, customerId: session.id, action: 'access-denied',
        note: 'Attempt to read another customer record through the data interface.', channel: 'portal', userId: session.id, userLabel: session.name });
      return { status: 403, body: { error: 'Forbidden. You can only read your own record.' }, note: 'Access to another customer blocked' };
    }
    return { status: 404, body: { error: 'Not found.' }, note: 'Unknown path' };
  }

  window.Services = Services;
  window.ReadApi = ReadApi;
})();
