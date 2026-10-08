/*
 * jobs-engine.js: Jobs (scheduled-job logic for the fulfilment check and the reminder job).
 * Needs Clock, Store, Fmt, Validate (core.js) and Services (services.js). Load after layout.js, before the page script.
 *
 * PUBLIC API
 *   Jobs.runFulfilmentCheck({simulateFailure})
 *       simulateFailure: true = every attempt fails; a number n = the first n attempts fail, then it succeeds.
 *       -> {ok, status:'success'|'failed', attempts:[{attempt, status, startedAt, endedAt, note, processed}],
 *           processed, results:[{promiseId, customerId, accountNo, name, amount, received, shortfall, result,
 *           message:{status, id, note}|null, resumed, closed}], retries, maxAttempts, deadline, alert|null}
 *   Jobs.pendingFulfilment()                  -> Active promises due today or earlier that have not been checked
 *   Jobs.scheduleReminders()                  -> {days, created:[reminderSchedule rows]}
 *   Jobs.previewSchedule(daysBefore)          -> [{customerId, accountNo, name, dueDate, existing|null, daysBefore, sendDate}]
 *   Jobs.dueReminders()                       -> unsent reminderSchedule rows with sendDate <= today and dueDate >= today (what runReminders evaluates)
 *   Jobs.rollDueDates(days)                   -> {days, moved:[{customerId, from, to}]} demo: moves due dates of customers with a balance forward
 *   Jobs.runReminders()                       -> {run, scheduled, evaluated, notDue, sent:[...], skipped:[...], failureRate,
 *                                                 threshold, alert|null}
 *
 * Production: these are scheduled batch jobs (for example a nightly cron or a cloud scheduler). The run
 * history rows are what the monitoring dashboard reads; each retry is a separate row.
 */
(function () {
  'use strict';

  var CONTACT_PHONE = Services.REP_CONTACT_PHONE;

  // ---------- helpers ----------

  function r2(n) {
    var v = Number(n);
    return isFinite(v) ? Math.round((v + (v < 0 ? -1e-9 : 1e-9)) * 100) / 100 : 0;
  }

  function firstName(c) { return String(c && c.name ? c.name : '').split(' ')[0] || 'customer'; }

  // Audit row written as the system (the job itself), not as whoever pressed the button.
  function sysAudit(entry) {
    entry.userId = 'SYSTEM';
    entry.userLabel = 'System';
    entry.channel = 'system';
    return Services.audit(entry);
  }

  // Reasons a customer must not be contacted: open query hold, or the latest logged outcome flags hardship or a wrong person.
  function contactBlocks(customer) {
    var reasons = [];
    if (customer.delinquencyHold) { reasons.push('On hold: query under review'); }
    var latest = null;
    Store.get('logs').forEach(function (l) {
      if (l.customerId !== customer.id || l.kind !== 'interaction' || !l.outcomeCode) { return; }
      if (!latest || String(l.at) >= String(latest.at)) { latest = l; }
    });
    if (latest && latest.outcomeCode === 'HARD') { reasons.push('Hardship flagged'); }
    if (latest && latest.outcomeCode === 'WRONG') { reasons.push('Wrong person flagged'); }
    return reasons;
  }

  function repFor(customer) {
    var reps = Store.get('users').filter(function (u) { return u.role === 'rep' && u.team === customer.team; });
    return reps.length ? reps[0] : null;
  }

  function recordRun(job, startedAt, processed, status, attempt, note) {
    return Store.insert('jobRuns', {
      job: job, startedAt: startedAt, endedAt: Clock.now(), processed: processed, status: status, attempt: attempt, note: note
    });
  }

  // ---------- fulfilment check ----------

  // Active promises due today or earlier that have not been checked yet (this is what makes the job idempotent).
  function pendingFulfilment() {
    var today = Clock.today();
    return Store.filter('promises', function (p) {
      return p.status === 'Active' && !p.checkedAt && String(p.dueDate) <= today;
    });
  }

  // Pauses lifted by the check: Fulfilled closes them, anything else resumes them.
  function settleFollowups(customerId, result, promise) {
    var out = { resumed: 0, closed: 0 };
    Store.filter('followups', function (f) { return f.customerId === customerId && f.status === 'Paused'; }).forEach(function (f) {
      if (result === 'Fulfilled') {
        Store.update('followups', f.id, { status: 'Done', completedAt: Clock.now() });
        sysAudit({ entity: 'followup', entityId: f.id, customerId: customerId, action: 'complete',
          before: { status: 'Paused' }, after: { status: 'Done' }, note: 'Promise ' + promise.id + ' fulfilled; paused follow-up closed.' });
        out.closed++;
      } else {
        Store.update('followups', f.id, { status: 'Open', pausedUntil: null });
        sysAudit({ entity: 'followup', entityId: f.id, customerId: customerId, action: 'resume',
          before: { status: 'Paused' }, after: { status: 'Open' }, note: 'Promise ' + promise.id + ' ' + result.toLowerCase() + '; follow-up resumed.' });
        out.resumed++;
      }
    });
    return out;
  }

  // Sends the missing-payment message (approved template) after a Not fulfilled result.
  function sendMissingPayment(customer, promise, amount) {
    var blocks = contactBlocks(customer);
    if (blocks.length) { return { status: 'not sent', id: null, note: blocks.join('; ') }; }
    var tpl = Services.renderTemplate('Missing payment', {
      name: firstName(customer), amount: Fmt.money(amount), dueDate: Fmt.date(promise.dueDate), reference: promise.reference || promise.id
    });
    if (!tpl) { return { status: 'not sent', id: null, note: 'No approved missing-payment template.' }; }
    var rep = repFor(customer);
    var res = Services.sendMessage({
      customerId: customer.id,
      kind: 'missing-payment',
      templateId: tpl.templateId,
      subject: 'We have not received your payment',
      body: tpl.body,
      links: [
        { label: 'Pay now', href: 'portal-pay.html' },
        { label: 'Contact your rep: ' + (rep ? rep.name + ', ' : '') + CONTACT_PHONE, href: 'portal-account.html' },
        { label: 'Think this is a mistake? Raise a query', href: 'portal-account.html' }
      ]
    });
    if (!res.ok) { return { status: 'not sent', id: null, note: res.error }; }
    return { status: res.status, id: res.message.id, note: 'Template ' + tpl.templateId + ' (version ' + tpl.version + ')' };
  }

  // Classifies one promise, writes the result, the fulfilment log, the message and the follow-up changes.
  function evaluatePromise(p) {
    var customer = Store.find('customers', p.customerId);
    if (!customer) { return null; }
    var amount = r2(p.amount);
    var received = Services.paymentTotalSince(p.customerId, p.createdAt);
    var result = received >= amount ? 'Fulfilled' : (received > 0 ? 'Partially fulfilled' : 'Not fulfilled');
    var shortfall = Math.max(0, r2(amount - received));

    Store.update('promises', p.id, { status: result, received: received, shortfall: shortfall, checkedAt: Clock.now() });
    sysAudit({ entity: 'promise', entityId: p.id, customerId: p.customerId, action: 'fulfilment-check',
      before: { status: 'Active' }, after: { status: result, received: received, shortfall: shortfall },
      note: 'Automatic fulfilment check.' });
    Services.addLog({
      customerId: p.customerId, kind: 'fulfilment', date: Clock.today(), amount: received, promiseAmount: amount, promiseDate: p.dueDate,
      notes: result + ': promised ' + amount.toFixed(2) + ', received ' + received.toFixed(2) + ', shortfall ' + shortfall.toFixed(2) + '.',
      repId: null, channel: 'system', reference: p.id
    });

    var settled = settleFollowups(p.customerId, result, p);
    var message = result === 'Not fulfilled' ? sendMissingPayment(customer, p, amount) : null;
    Services.refreshPromiseFlags(p.customerId);

    return {
      promiseId: p.id, customerId: p.customerId, accountNo: customer.accountNo, name: customer.name,
      amount: amount, received: received, shortfall: shortfall, result: result,
      message: message, resumed: settled.resumed, closed: settled.closed
    };
  }

  function countBy(results, result) {
    return results.filter(function (r) { return r.result === result; }).length;
  }

  // Runs the check with automatic retries. See the header comment for the option and return shape.
  function runFulfilmentCheck(opts) {
    var o = opts || {};
    var failures = o.simulateFailure === true ? Infinity : Math.max(0, Math.floor(Number(o.simulateFailure) || 0));
    var retries = Math.max(0, Math.floor(Number(Services.setting('jobRetries', 2)) || 0));
    var maxAttempts = 1 + retries;
    var deadline = Services.setting('jobDeadline', '07:00');
    var attempts = [];
    var results = [];
    var ok = false;
    var lastRow = null;

    for (var n = 1; n <= maxAttempts; n++) {
      var startedAt = Clock.now();
      if (n <= failures) {
        var last = n === maxAttempts;
        lastRow = recordRun('fulfilment-check', startedAt, 0, last ? 'failed' : 'retried', n,
          last ? 'Data source timeout. No retries left.' : 'Data source timeout. Retry ' + n + ' of ' + retries + ' scheduled.');
        attempts.push({ attempt: n, status: lastRow.status, startedAt: lastRow.startedAt, endedAt: lastRow.endedAt, note: lastRow.note, processed: 0 });
        continue;
      }
      pendingFulfilment().forEach(function (p) {
        var item = evaluatePromise(p);
        if (item) { results.push(item); }
      });
      var note = results.length
        ? results.length + (results.length === 1 ? ' promise' : ' promises') + ' checked: ' + countBy(results, 'Fulfilled') + ' fulfilled, ' +
          countBy(results, 'Partially fulfilled') + ' partially fulfilled, ' + countBy(results, 'Not fulfilled') + ' not fulfilled.'
        : 'No promises due. Promises already checked are not checked again.';
      if (n > 1) { note = 'Succeeded on retry (attempt ' + n + '). ' + note; }
      lastRow = recordRun('fulfilment-check', startedAt, results.length, 'success', n, note);
      attempts.push({ attempt: n, status: 'success', startedAt: lastRow.startedAt, endedAt: lastRow.endedAt, note: note, processed: results.length });
      ok = true;
      break;
    }

    var alert = null;
    if (!ok) {
      var res = Services.reportAlert({
        type: 'job-failed', severity: 'high',
        detail: 'Fulfilment check failed on all ' + maxAttempts + ' attempts and has not completed successfully by the agreed deadline (' +
          deadline + ', TBD). Manual action needed.'
      });
      alert = res.alert;
    }
    if (o.simulatePastDeadline) {
      var resDeadline = Services.reportAlert({
        type: 'job-deadline-missed', severity: 'high',
        detail: 'Fulfilment check has not completed successfully by agreed deadline (' + deadline + ', TBD). Automated alert dispatched to on-call IT team.'
      });
      if (!alert) { alert = resDeadline.alert; }
    }
    Services.audit({ entity: 'jobRun', entityId: lastRow ? lastRow.id : null, action: 'run-fulfilment-check',
      after: { status: ok ? 'success' : 'failed', attempts: attempts.length, processed: results.length },
      note: 'Fulfilment check started manually from the jobs page.' });

    return {
      ok: ok, status: ok ? 'success' : 'failed', attempts: attempts, processed: results.length, results: results,
      retries: retries, maxAttempts: maxAttempts, deadline: deadline, alert: alert
    };
  }

  // ---------- reminders ----------

  // Latest schedule row for this customer and due date, or null.
  function scheduleRowFor(customerId, dueDate) {
    var found = null;
    Store.get('reminderSchedule').forEach(function (r) {
      if (r.customerId === customerId && r.dueDate === dueDate) { found = r; }
    });
    return found;
  }

  function sendDateFor(dueDate, daysBefore) { return Clock.addDays(dueDate, -Number(daysBefore)); }

  // Creates schedule rows (current reminderDaysBefore) for customers with no row for their due date. Existing rows are never changed.
  function scheduleReminders() {
    var days = Number(Services.setting('reminderDaysBefore', 3));
    var created = [];
    var now = Clock.now();
    Store.get('customers').slice().forEach(function (c) {
      if (!c.dueDate || scheduleRowFor(c.id, c.dueDate)) { return; }
      created.push(Store.insert('reminderSchedule', {
        customerId: c.id, dueDate: c.dueDate, daysBefore: days, sendDate: sendDateFor(c.dueDate, days), sent: false, scheduledAt: now
      }));
    });
    if (created.length) {
      sysAudit({ entity: 'reminderSchedule', entityId: null, action: 'schedule', after: { rows: created.length, daysBefore: days },
        note: 'New reminders scheduled with the current timing. Existing rows keep their timing.' });
    }
    return { days: days, created: created };
  }

  // What each customer's reminder would look like if scheduled with daysBefore; nothing is written.
  function previewSchedule(daysBefore) {
    var days = Number(daysBefore);
    return Store.get('customers').filter(function (c) { return !!c.dueDate; }).map(function (c) {
      return {
        customerId: c.id, accountNo: c.accountNo, name: c.name, dueDate: c.dueDate,
        existing: scheduleRowFor(c.id, c.dueDate), daysBefore: days, sendDate: sendDateFor(c.dueDate, days)
      };
    });
  }

  // The one filter for "will be evaluated now": unsent, send date reached (stored sendDate) and not already past its due date.
  function dueReminders() {
    var today = Clock.today();
    return Store.filter('reminderSchedule', function (r) { return !r.sent && r.sendDate <= today && r.dueDate >= today; });
  }

  // Demo: moves due dates of customers with a balance forward, as if the next billing cycle had started.
  function rollDueDates(days) {
    var n = Math.floor(Number(days));
    var moved = [];
    if (!isFinite(n) || n === 0) { return { days: 0, moved: moved }; }
    Store.get('customers').slice().forEach(function (c) {
      if (!c.dueDate || !(Number(c.balance) > 0)) { return; }
      var from = c.dueDate;
      var to = Clock.addDays(from, n);
      Store.update('customers', c.id, { dueDate: to });
      Services.audit({ entity: 'customer', entityId: c.id, customerId: c.id, action: 'roll-due-date',
        before: { dueDate: from }, after: { dueDate: to }, note: 'Demo: next billing cycle (' + n + ' days).' });
      moved.push({ customerId: c.id, from: from, to: to });
    });
    return { days: n, moved: moved };
  }

  // Channels a customer wants reminders on.
  function channelsFor(customer) {
    var pref = (customer.reminderPrefs && customer.reminderPrefs.channel) || 'email';
    return pref === 'both' ? ['email', 'sms'] : [pref === 'sms' ? 'sms' : 'email'];
  }

  // Sends every reminder that dueReminders() returns, and reports Sent and Skipped (with reasons).
  function runReminders() {
    var startedAt = Clock.now();
    var today = Clock.today();
    var scheduled = scheduleReminders().created.length;
    var sent = [];
    var skipped = [];
    var notDue = Store.filter('reminderSchedule', function (r) { return !r.sent && r.sendDate > today; }).length;

    dueReminders().forEach(function (row) {
      var c = Store.find('customers', row.customerId);
      if (!c) { skipped.push({ customerId: row.customerId, accountNo: '', name: 'Unknown customer', reason: 'Customer not found' }); return; }

      var reasons = contactBlocks(c);
      if (Number(c.balance) <= 0) { reasons.push('Zero balance: nothing due'); }
      if (c.reminderPrefs && c.reminderPrefs.optedOut) { reasons.push('Opted out of reminders'); }

      var wanted = channelsFor(c);
      var usable = wanted.filter(function (ch) {
        return ch === 'sms' ? Validate.phone(c.phone) === null : Validate.email(c.email) === null;
      });
      if (!usable.length) { reasons.push('No valid contact detail for ' + wanted.join(' / ')); }

      var limit = Services.checkContactLimit(c.id, today);
      if (limit.exceeds) { reasons.push('Contact limit reached (' + limit.count + ' of ' + limit.limit + ' in ' + limit.windowDays + ' days)'); }

      var vars = { name: firstName(c), amount: Fmt.money(c.balance), dueDate: Fmt.date(row.dueDate), reference: 'Account ' + c.accountNo, link: 'portal-verify.html' };
      var plan = [];
      usable.forEach(function (ch) {
        var tpl = Services.renderTemplate('Reminder before due (' + ch + ')', vars);
        if (tpl) { plan.push({ channel: ch, template: tpl }); } else { reasons.push('No approved ' + ch + ' reminder template'); }
      });

      if (reasons.length) {
        skipped.push({ customerId: c.id, accountNo: c.accountNo, name: c.name, reason: reasons.join('; ') });
        return;
      }

      var links = [
        { label: 'Pay now', href: 'portal-pay.html' },
        { label: 'Contact a rep: ' + CONTACT_PHONE, href: 'portal-account.html' },
        { label: 'Unsubscribe / preferences', href: Services.preferencesLink(c) }
      ];
      var sentHere = 0;
      var failedHere = [];
      plan.forEach(function (step) {
        var res = Services.sendMessage({
          customerId: c.id, kind: 'reminder', templateId: step.template.templateId, channel: step.channel,
          subject: step.channel === 'sms' ? '' : 'Payment reminder', body: step.template.body, links: links
        });
        if (!res.ok) { failedHere.push(res.error); return; }
        sentHere++;
        Services.addLog({
          customerId: c.id, kind: 'reminder', date: today, method: step.channel === 'sms' ? 'SMS' : 'Email', amount: c.balance,
          notes: 'Reminder sent before due date (' + res.status + ').', repId: null, channel: 'system',
          reference: res.message.id, templateId: step.template.templateId
        });
        sent.push({
          customerId: c.id, accountNo: c.accountNo, name: c.name, channel: step.channel, templateId: step.template.templateId,
          templateVersion: step.template.version, messageId: res.message.id, status: res.status, amount: r2(c.balance), dueDate: row.dueDate
        });
      });
      if (sentHere) {
        Store.update('reminderSchedule', row.id, { sent: true, sentAt: Clock.now() });
      } else {
        skipped.push({ customerId: c.id, accountNo: c.accountNo, name: c.name, reason: 'Message could not be sent: ' + failedHere.join('; ') });
      }
    });

    Store.filter('reminderSchedule', function (r) { return r.sent && r.dueDate >= today; }).forEach(function (row) {
      var c = Store.find('customers', row.customerId);
      if (c && c.reminderPrefs && c.reminderPrefs.optedOut) {
        if (!skipped.some(function (sk) { return sk.customerId === c.id; })) {
          skipped.push({ customerId: c.id, accountNo: c.accountNo, name: c.name, reason: 'Opted out of reminders' });
        }
      }
    });

    var failed = sent.filter(function (s) { return s.status === 'bounced' || s.status === 'failed'; }).length;
    var rate = sent.length ? Math.round((failed / sent.length) * 1000) / 10 : 0;
    var threshold = Number(Services.setting('failureRateThreshold', 10));
    var alert = null;
    if (sent.length && rate > threshold) {
      alert = Services.reportAlert({
        type: 'reminder-failure-rate', severity: 'medium',
        detail: 'Reminder failure rate ' + rate + '% in this run exceeded the ' + threshold + '% threshold (bounced and failed deliveries).'
      }).alert;
    }

    var evaluated = sent.length + skipped.length;
    var run = recordRun('reminders', startedAt, evaluated, 'success', 1,
      sent.length + ' sent, ' + skipped.length + ' skipped' + (notDue ? ', ' + notDue + ' not yet due' : '') + '.');
    Services.audit({ entity: 'jobRun', entityId: run.id, action: 'run-reminders',
      after: { sent: sent.length, skipped: skipped.length, failureRate: rate }, note: 'Reminder job started manually from the jobs page.' });

    return { run: run, scheduled: scheduled, evaluated: evaluated, notDue: notDue, sent: sent, skipped: skipped, failureRate: rate, threshold: threshold, alert: alert };
  }

  window.Jobs = {
    runFulfilmentCheck: runFulfilmentCheck,
    pendingFulfilment: pendingFulfilment,
    scheduleReminders: scheduleReminders,
    previewSchedule: previewSchedule,
    dueReminders: dueReminders,
    rollDueDates: rollDueDates,
    runReminders: runReminders
  };
})();
