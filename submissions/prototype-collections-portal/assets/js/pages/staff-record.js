// Customer record: verification gate, summary, history, follow-ups, preferences (US-03, 05, 07, 15, 21, 23, 25, 34, 37, 43, 46, 50).
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;

  var acct = Staff.accountParam();
  if (!acct) { main.appendChild(Staff.noAccountPanel('open a customer record')); return; }
  var found = Staff.findByAccountNo(acct);
  if (!found) { main.appendChild(Staff.notFoundPanel(acct)); return; }

  var customerId = found.id;
  var user = Auth.user();
  var isLeader = Auth.role() === 'leader';
  var isRep = Auth.role() === 'rep';
  var activeTab = 'summary';
  var tabsNode = null;

  var TYPE_LABELS = {
    interaction: 'Contact', payment: 'Payment', promise: 'Promise', fulfilment: 'Fulfilment', reminder: 'Reminder',
    change: 'Record change', followup: 'Follow-up', reversal: 'Reversal', verification: 'Verification', audit: 'Audit event'
  };
  var TYPE_ORDER = ['interaction', 'payment', 'promise', 'fulfilment', 'reminder', 'change', 'followup', 'reversal', 'verification', 'audit'];
  var CHANNEL_LABELS = { portal: 'Portal', rep: 'Rep', system: 'System', staff: 'Staff' };
  var PREF_CHANNELS = [{ value: 'phone', label: 'Phone' }, { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }];

  var host = el('div', { class: 'stack' });
  main.appendChild(host);
  draw();

  // ---------- helpers ----------

  function label(map, key) { return map[key] || key || ''; }

  function prefChannelLabel(v) {
    var m = PREF_CHANNELS.filter(function (c) { return c.value === v; })[0];
    return m ? m.label : (v || 'Not recorded');
  }

  function addressText(a) {
    return a ? [a.line1, a.city, a.postcode].filter(Boolean).join(', ') : '';
  }

  function outcomeLabel(code) {
    var d = (Store.config('outcomeCodes') || []).filter(function (o) { return o.code === code; })[0];
    return d ? d.label + ' (' + d.code + ')' : (code || '');
  }

  function templateText(id) {
    var t = id ? Store.find('templates', id) : null;
    return t ? t.name + ' v' + t.version : (id || '');
  }

  function dueBadge(f) {
    if (f.status === 'Paused') { return UI.badge('Paused until ' + Fmt.date(f.pausedUntil), 'warn'); }
    var days = Clock.diffDays(f.dueDate, Clock.today());
    if (days > 0) { return UI.badge('Overdue ' + days + (days === 1 ? ' day' : ' days'), 'err'); }
    if (days === 0) { return UI.badge('Due today', 'warn'); }
    return UI.badge('Open');
  }

  function byDue(a, b) {
    var ka = String(a.dueDate) + ' ' + String(a.time || '');
    var kb = String(b.dueDate) + ' ' + String(b.time || '');
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  }

  // ---------- page ----------

  // Rebuilds the whole record; called after any state change.
  function draw() {
    var c = Store.find('customers', customerId);
    var unlocked = Staff.isUnlocked(c.id);
    host.textContent = '';
    host.appendChild(headerPanel(c, unlocked));

    if (!unlocked) {
      host.appendChild(el('div', { class: 'locked-block' }, [
        el('strong', null, ['Account details are locked.']),
        el('p', null, ['Verify the caller below before discussing this account. No contact details, balance or history are shown until the result is Verified.'])
      ]));
      host.appendChild(Staff.verificationPanel(c, draw));
      if (c.locked) { host.appendChild(unlockPanel(c)); }
      return;
    }

    host.appendChild(Staff.accessBar(c, draw));
    if (c.locked) { host.appendChild(unlockPanel(c)); }
    banners(c).forEach(function (b) { host.appendChild(b); });

    tabsNode = UI.tabs([
      { id: 'summary', label: 'Summary', render: function (box) { activeTab = 'summary'; renderSummary(box, c); } },
      { id: 'history', label: 'History', render: function (box) { activeTab = 'history'; renderHistory(box, c); } },
      { id: 'followups', label: 'Follow-ups', render: function (box) { activeTab = 'followups'; renderFollowups(box, c); } },
      { id: 'preferences', label: 'Preferences', render: function (box) { activeTab = 'preferences'; renderPreferences(box, c); } }
    ], { active: activeTab });
    host.appendChild(tabsNode);
  }

  function headerPanel(c, unlocked) {
    var badges = [c.locked ? UI.badge('Account locked', 'err') : UI.badge('Not locked', 'ok')];
    if (unlocked) {
      badges.push(' ', UI.badge('Team ' + c.team));
      if (c.delinquencyHold) { badges.push(' ', UI.badge('Delinquency hold', 'warn')); }
      if (c.emailBounced) { badges.push(' ', UI.badge('Email bounced', 'warn')); }
      if (c.reminderPrefs && c.reminderPrefs.optedOut) { badges.push(' ', UI.badge('Reminders opted out', 'warn')); }
    }
    var links = [
      isRep ? el('a', { class: 'btn btn--primary', href: Staff.logHref(c.accountNo) }, ['Log an interaction']) : null,
      el('a', { class: 'btn', href: 'staff-followups.html' }, ['Follow-ups']),
      el('a', { class: 'btn', href: 'staff-search.html' }, ['New search'])
    ];
    return UI.panel('Account ' + c.accountNo, el('div', { class: 'stack' }, [
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Account number']), el('dd', { class: 'mono' }, [c.accountNo]),
        unlocked ? [el('dt', null, ['Name']), el('dd', null, [c.name])] : null,
        el('dt', null, ['Status']), el('dd', null, badges)
      ]),
      el('div', { class: 'row' }, links)
    ]));
  }

  // Locked-account control (US-23): enabled only after the phone check returned Verified.
  function unlockPanel(c) {
    var verified = Staff.accessMode(c.id) === 'phone';
    var msg = el('div', { 'aria-live': 'polite' });
    var btn = el('button', {
      type: 'button', class: 'btn btn--primary', disabled: !verified, onclick: function () {
        var res = Services.unlock(c.id, user ? user.id : null);
        if (!res.ok) { msg.textContent = ''; msg.appendChild(el('div', { class: 'notice notice--error', role: 'alert' }, [res.error])); return; }
        UI.toast('Account unlocked.', 'ok');
        draw();
      }
    }, ['Unlock account']);
    return UI.panel('Locked account', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--warn' }, ['This account was locked after repeated failed portal verification. Only a rep can unlock it, and only after the caller passes the phone verification.']),
      el('div', { class: 'row' }, [btn, verified ? null : el('span', { class: 'muted' }, ['Enabled once the phone verification returns Verified.'])]),
      msg
    ]), { note: 'Production: POST /customers/{id}/unlock needs a fresh phone-verification token and writes the unlock to the audit store.' });
  }

  function banners(c) {
    var out = [];
    var flag = Services.promiseFlag(c.id);
    if (flag) {
      out.push(el('div', { class: 'notice notice--warn', role: 'status' }, [
        el('strong', null, ['Unfulfilled promise. ']),
        'Promised ' + Fmt.money(flag.amount) + ', due ' + Fmt.date(flag.dueDate) + '. Shortfall ' + Fmt.money(flag.shortfall) + '.' +
        (flag.paidSince > 0 ? ' Paid since: ' + Fmt.money(flag.paidSince) + '.' : '') +
        ' This flag clears automatically once payments cover the shortfall.'
      ]));
    } else {
      var latest = Store.filter('promises', function (p) { return p.customerId === c.id; })
        .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); })[0];
      if (latest && latest.status === 'Not fulfilled') {
        out.push(el('div', { class: 'notice notice--ok', role: 'status' }, [
          el('strong', null, ['Promise flag cleared. ']),
          'Payments since the missed promise of ' + Fmt.money(latest.amount) + ' (due ' + Fmt.date(latest.dueDate) + ') now cover the shortfall.'
        ]));
      }
    }
    if (c.delinquencyHold) {
      out.push(el('div', { class: 'notice notice--warn' }, [
        el('strong', null, ['Delinquency hold. ']), 'The customer has raised a payment query. Check the query before any further collection activity. ',
        el('button', {
          type: 'button', class: 'btn btn--small', onclick: function () {
            var res = Services.resolveQuery(c.id, 'Query reviewed on the customer record.');
            if (!res.ok) { UI.toast(res.error, 'error'); return; }
            UI.toast('Query marked as reviewed. The hold has been lifted.', 'ok');
            draw();
          }
        }, ['Mark query reviewed'])
      ]));
    }
    var lc = c.lastChange;
    if (lc && lc.at) {
      var byCustomer = lc.channel === 'portal' || (!lc.channel && /^C-/.test(String(lc.by || '')));
      var heading = byCustomer ? 'Customer-made change ' + Fmt.datetime(lc.at) : 'Staff-made change ' + Fmt.datetime(lc.at) + ' by ' + Staff.userName(lc.by);
      out.push(el('div', { class: 'notice notice--info', role: 'status' }, [
        el('strong', null, [heading]),
        (lc.fields && lc.fields.length ? ' (' + lc.fields.join(', ') + ')' : '') + '. The details below already include the change, so there is no need to ask the customer to repeat them.'
      ]));
    }
    return out;
  }

  // ---------- summary tab ----------

  function renderSummary(box, c) {
    var openFus = Store.filter('followups', function (f) { return f.customerId === c.id && (f.status === 'Open' || f.status === 'Paused'); });
    var contactHost = el('div');
    showContactView();

    // Read-only contact details with an edit button.
    function showContactView() {
      contactHost.textContent = '';
      var canEdit = Auth.canSeeField('phone') && Auth.canSeeField('email') && Auth.canSeeField('address');
      contactHost.appendChild(el('dl', { class: 'kv' }, [
        el('dt', null, ['Phone']), el('dd', null, [Staff.restricted('phone', c.phone)]),
        el('dt', null, ['Email']), el('dd', null, [Staff.restricted('email', c.email)]),
        el('dt', null, ['Address']), el('dd', null, [Staff.restricted('address', addressText(c.address))])
      ]));
      if (canEdit) {
        contactHost.appendChild(el('button', { type: 'button', class: 'btn btn--small', onclick: showContactEdit }, ['Edit contact details']));
      }
    }

    // Staff edit form (US-43 rep side): same Validate.contact rules as the portal, saved through Services.
    function showContactEdit() {
      contactHost.textContent = '';
      var form = el('form', { novalidate: true }, [
        UI.field({ label: 'Phone', name: 'phone', type: 'tel', required: true, value: c.phone }),
        UI.field({ label: 'Email', name: 'email', type: 'email', required: true, value: c.email }),
        UI.field({ label: 'Address line 1', name: 'address.line1', type: 'text', required: true, value: c.address ? c.address.line1 : '' }),
        UI.field({ label: 'Town or city', name: 'address.city', type: 'text', required: true, value: c.address ? c.address.city : '' }),
        UI.field({ label: 'Postcode', name: 'address.postcode', type: 'text', required: true, value: c.address ? c.address.postcode : '' }),
        el('div', { class: 'row' }, [
          el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save changes']),
          el('button', { type: 'button', class: 'btn', onclick: showContactView }, ['Cancel'])
        ])
      ]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = UI.readForm(form);
        var res = Services.updateContactDetails(c.id, { phone: v.phone, email: v.email, address: v.address }, { channel: 'staff', actorId: user ? user.id : null });
        if (!res.ok) { UI.showErrors(form, res.errors || { _form: res.error }); return; }
        UI.toast('Contact details saved.', 'ok');
        draw();
      });
      contactHost.appendChild(form);
      contactHost.appendChild(el('p', { class: 'muted' }, ['Uses the same validation as the customer portal. The previous contact points are told about the change.']));
    }

    var cards = UI.statCards([
      { label: 'Balance', value: Staff.restricted('balance', Fmt.money(c.balance)), note: 'Original ' + (Auth.canSeeField('balance') ? Fmt.money(c.originalBalance) : 'restricted') },
      { label: 'Due date', value: Fmt.date(c.dueDate) },
      { label: 'Open follow-ups', value: String(openFus.filter(function (f) { return f.status === 'Open'; }).length), note: openFus.length + ' including paused' }
    ]);

    var accountKv = el('dl', { class: 'kv' }, [
      el('dt', null, ['Name']), el('dd', null, [c.name]),
      el('dt', null, ['Date of birth']), el('dd', null, [Staff.restricted('dob', Fmt.date(c.dob))]),
      el('dt', null, ['Internal notes']), el('dd', null, [Staff.restricted('internalNotes', c.internalNotes || 'None')]),
      el('dt', null, ['Ledger reference']), el('dd', { class: 'mono' }, [Staff.restricted('ledgerRef', c.ledgerRef || 'None')])
    ]);

    var recentHost = el('div');
    var recent = Auth.canSeeField('history') ? buildEvents(c).slice(0, 5) : [];
    if (Auth.canSeeField('history')) {
      renderEvents(recentHost, recent, 'No history yet for this customer.');
    } else {
      recentHost.appendChild(Staff.restricted('history', ''));
    }

    var fuHost = el('div');
    if (Auth.canSeeField('followups')) { renderFollowupTable(fuHost, openFus.sort(byDue), 'No open follow-ups.'); }
    else { fuHost.appendChild(Staff.restricted('followups', '')); }

    box.appendChild(el('div', { class: 'stack' }, [
      cards,
      el('div', { class: 'grid grid--2' }, [
        UI.panel('Contact details', contactHost),
        UI.panel('Account details', accountKv)
      ]),
      UI.panel('Recent case history', el('div', { class: 'stack' }, [
        recentHost,
        el('div', { class: 'row' }, [el('button', { type: 'button', class: 'btn btn--small', onclick: function () { tabsNode.select('history'); } }, ['See full history'])])
      ])),
      UI.panel('Open follow-ups', fuHost)
    ]));
  }

  // ---------- history tab (US-05, 15, 37, 50) ----------

  function auditEvent(a) {
    var act = a.action;
    var ent = a.entity;
    var type = null;
    if (ent === 'verification') { type = 'verification'; }
    else if (ent === 'customer' && ['unlock', 'lockout', 'update-reminder-prefs', 'bounce-flag-cleared', 'update-preferences'].indexOf(act) >= 0) { type = 'audit'; }
    else if (ent === 'query') { type = 'audit'; }
    else if (ent === 'payment' && act === 'payment-failed') { type = 'payment'; }
    else if (ent === 'followup' && ['create', 'complete', 'pause', 'reschedule'].indexOf(act) >= 0) { type = 'followup'; }
    else if (ent === 'promise' && ['flag-cleared', 'flag-restored', 'supersede'].indexOf(act) >= 0) { type = 'audit'; }
    if (!type) { return null; }

    var after = a.after && typeof a.after === 'object' ? a.after : null;
    var text;
    if (ent === 'verification') {
      if (act === 'internal-review') { text = a.note || 'Internal review (no caller)'; }
      else {
        var outcome = after.outcome;
        var method = after.method;
        text = 'Identity check by ' + method + ': ' + outcome + (a.channel === 'staff' ? ' (' + a.userLabel + ')' : '');
      }
    } else if (act === 'unlock') { text = 'Account unlocked after phone verification (' + a.userLabel + ').'; }
    else if (act === 'lockout') { text = 'Account locked after repeated failed portal verification.'; }
    else if (act === 'payment-failed') { text = 'Failed payment' + (after && after.amount ? ' of ' + Fmt.money(after.amount) : '') + (after && after.reasonCategory ? ' (' + after.reasonCategory + ')' : '') + '.'; }
    else if (ent === 'followup' && act === 'create' && after) { text = 'Follow-up scheduled for ' + Fmt.date(after.dueDate) + ' ' + (after.time || '') + ', owner ' + Staff.userName(after.ownerId) + (a.note ? ' (' + a.note + ')' : '') + '.'; }
    else if (ent === 'followup' && act === 'complete') { text = 'Follow-up completed (' + a.userLabel + ').'; }
    else if (ent === 'followup' && act === 'reschedule' && after) { text = 'Follow-up rescheduled to ' + Fmt.date(after.dueDate) + ' ' + (after.time || '') + (a.note ? ' (' + a.note + ')' : '') + '.'; }
    else if (ent === 'followup' && act === 'pause') { text = 'Follow-up paused' + (after && after.pausedUntil ? ' until ' + Fmt.date(after.pausedUntil) : '') + '.'; }
    else { text = a.note || act; }

    return {
      type: type, at: a.at, date: String(a.at || '').slice(0, 10), channel: label(CHANNEL_LABELS, a.channel),
      details: text, ref: a.entityId ? String(a.entityId) : '', sortId: a.id
    };
  }

  function describeLog(l) {
    var parts = [];
    if (l.kind === 'interaction') {
      parts.push((l.method || 'Contact') + ': ' + outcomeLabel(l.outcomeCode));
      if (l.promiseAmount) { parts.push('promise ' + Fmt.money(l.promiseAmount) + ' by ' + Fmt.date(l.promiseDate)); }
      if (l.nextAction) { parts.push('next: ' + l.nextAction); }
      if (l.repId) { parts.push('by ' + Staff.userName(l.repId)); }
    } else if ((l.kind === 'payment' || l.kind === 'reversal') && l.amount !== null && l.amount !== undefined) {
      if (!l.notes || String(l.notes).indexOf(Fmt.money(l.amount)) < 0) { parts.push(Fmt.money(l.amount)); }
    } else if (l.kind === 'reminder' && l.method) {
      parts.push(l.method + ' reminder');
    }
    if (l.notes) { parts.push(l.notes); }
    if (l.overrideReason) { parts.push('override reason: ' + l.overrideReason); }
    return parts.join(' - ') || TYPE_LABELS[l.kind] || l.kind;
  }

  // All events for the customer from the logs plus audit-relevant events, newest first.
  function buildEvents(c) {
    var events = [];
    Store.filter('logs', function (l) { return l.customerId === c.id; }).forEach(function (l) {
      var refs = [];
      if (l.reference) { refs.push('Ref ' + l.reference); }
      if (l.templateId) { refs.push('Template ' + templateText(l.templateId)); }
      events.push({
        type: TYPE_LABELS[l.kind] ? l.kind : 'audit', at: l.at, date: String(l.date || l.at || '').slice(0, 10),
        channel: label(CHANNEL_LABELS, l.channel) + (l.method ? ' / ' + l.method : ''),
        details: describeLog(l), ref: refs.join(' | '), sortId: l.id
      });
    });
    Store.filter('audit', function (a) { return a.customerId === c.id; }).forEach(function (a) {
      var ev = auditEvent(a);
      if (ev) { events.push(ev); }
    });
    function key(e) { return e.date + 'T' + String(e.at || '').slice(11, 16); }
    return events.sort(function (a, b) {
      var ka = key(a);
      var kb = key(b);
      if (ka !== kb) { return ka < kb ? 1 : -1; }
      return (parseInt(String(b.sortId).replace(/^.*-/, ''), 10) || 0) - (parseInt(String(a.sortId).replace(/^.*-/, ''), 10) || 0);
    });
  }

  function renderEvents(container, rows, emptyText) {
    UI.table(container, {
      columns: [
        { key: 'at', label: 'When', format: function (v, r) { return Fmt.datetime(r.at || r.date); } },
        { key: 'type', label: 'Type', format: function (v) { return UI.badge(label(TYPE_LABELS, v)); } },
        { key: 'channel', label: 'Channel' },
        { key: 'details', label: 'Details' },
        { key: 'ref', label: 'Reference / template' }
      ],
      rows: rows,
      empty: emptyText || 'No events match.'
    });
  }

  function renderHistory(box, c) {
    if (!Auth.canSeeField('history')) { box.appendChild(Staff.restricted('history', '')); return; }
    var results = el('div');
    var meta = el('p', { class: 'muted', 'aria-live': 'polite' });
    var filters = { type: '', from: '', to: '' };
    var form = null;

    // Builds the list; filters apply only for the leader.
    function run() {
      var all = buildEvents(c);
      var rows = all.filter(function (e) {
        if (filters.type && e.type !== filters.type) { return false; }
        if (filters.from && e.date < filters.from) { return false; }
        if (filters.to && e.date > filters.to) { return false; }
        return true;
      });
      renderEvents(results, rows, all.length ? 'No events match the filters.' : 'No history yet for this customer.');
      meta.textContent = rows.length + ' of ' + all.length + ' events, newest first.';
    }

    if (isLeader) {
      form = el('form', { class: 'row', novalidate: true }, [
        UI.field({ label: 'Event type', name: 'type', type: 'select', options: [{ value: '', label: 'All event types' }].concat(TYPE_ORDER.map(function (t) { return { value: t, label: TYPE_LABELS[t] }; })) }),
        UI.field({ label: 'From date', name: 'from', type: 'date' }),
        UI.field({ label: 'To date', name: 'to', type: 'date' }),
        el('button', { type: 'submit', class: 'btn' }, ['Apply filters']),
        el('button', {
          type: 'button', class: 'btn', onclick: function () {
            form.reset();
            UI.showErrors(form, {});
            filters = { type: '', from: '', to: '' };
            run();
          }
        }, ['Clear'])
      ]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = UI.readForm(form);
        var errors = {};
        if (v.from && Validate.date(v.from)) { errors.from = 'Enter a valid start date.'; }
        if (v.to && Validate.date(v.to)) { errors.to = 'Enter a valid end date.'; }
        if (!errors.from && !errors.to && v.from && v.to && v.from > v.to) { errors.to = 'End date must be on or after the start date.'; }
        UI.showErrors(form, errors);
        if (Object.keys(errors).length) { return; }
        filters = { type: v.type, from: v.from, to: v.to };
        run();
      });
    }

    run();
    box.appendChild(el('div', { class: 'stack' }, [
      isLeader ? form : el('p', { class: 'muted' }, ['Event type and date-range filters are available to team leaders.']),
      meta,
      results,
      UI.howItWorks('History is read from the interaction log and the audit store for this customer. Payments, promises, reminders and fulfilment results are written there automatically by the services that cause them, so nobody types them in.')
    ]));
  }

  // ---------- follow-ups tab ----------

  function renderFollowupTable(container, rows, emptyText) {
    UI.table(container, {
      columns: [
        { key: 'dueDate', label: 'Due', format: function (v, r) { return Fmt.date(r.dueDate) + (r.time ? ' ' + r.time : ''); } },
        { key: 'status', label: 'Status', format: function (v, r) { return dueBadge(r); } },
        { key: 'ownerId', label: 'Owner', format: function (v) { return Staff.userName(v); } },
        { key: 'channel', label: 'Channel' },
        { key: 'outcomeCode', label: 'Outcome', format: function (v) { return outcomeLabel(v); } }
      ],
      rows: rows,
      empty: emptyText
    });
  }

  function renderFollowups(box, c) {
    if (!Auth.canSeeField('followups')) { box.appendChild(Staff.restricted('followups', '')); return; }
    var all = Store.filter('followups', function (f) { return f.customerId === c.id; });
    var open = all.filter(function (f) { return f.status !== 'Done'; }).sort(byDue);
    var done = all.length - open.length;
    var tableHost = el('div');
    renderFollowupTable(tableHost, open, 'No open follow-ups for this customer.');
    box.appendChild(el('div', { class: 'stack' }, [
      tableHost,
      el('p', { class: 'muted' }, [done + ' completed follow-up' + (done === 1 ? '' : 's') + ' not shown. Paused follow-ups resume after the promise due date if the promise is not fulfilled.']),
      el('div', { class: 'row' }, [
        isRep ? el('a', { class: 'btn btn--primary', href: Staff.logHref(c.accountNo) }, ['Log an interaction']) : null,
        el('a', { class: 'btn', href: 'staff-followups.html' }, ['Go to the follow-up list'])
      ])
    ]));
  }

  // ---------- preferences tab (US-34, 49, 53) ----------

  function renderPreferences(box, c) {
    var pref = c.preferred || {};
    var rp = c.reminderPrefs || {};
    var hours = Services.setting('optOutHours', null);

    var optOut = rp.optedOut
      ? [UI.badge('Opted out', 'warn'), rp.optedOutAt ? ' since ' + Fmt.datetime(rp.optedOutAt) : '', ' (opt-out applies within ', UI.tbd('Opt-out processing time', hours === null ? null : hours + ' hours'), ')']
      : [UI.badge('Receiving reminders', 'ok')];

    var view = el('dl', { class: 'kv' }, [
      el('dt', null, ['Preferred channel']), el('dd', null, [prefChannelLabel(pref.channel)]),
      el('dt', null, ['Preferred time window']), el('dd', null, [pref.from && pref.to ? pref.from + ' to ' + pref.to : 'Not recorded']),
      el('dt', null, ['Reminder opt-out']), el('dd', null, optOut),
      el('dt', null, ['Reminder channel']), el('dd', null, [prefChannelLabel(rp.channel)]),
      el('dt', null, ['Email delivery']), el('dd', null, c.emailBounced
        ? [UI.badge('Email bounced', 'warn'), ' Reminders to this address are not arriving. Confirm or correct the address on the Summary tab.']
        : [UI.badge('No bounces recorded', 'ok')]),
      el('dt', null, ['Delinquency hold']), el('dd', null, [c.delinquencyHold ? UI.badge('On hold', 'warn') : UI.badge('No hold', 'ok')])
    ]);

    var form = el('form', { novalidate: true }, [
      UI.field({ label: 'Preferred contact channel', name: 'channel', type: 'select', required: true, options: PREF_CHANNELS, value: pref.channel }),
      UI.field({ label: 'Window starts', name: 'from', type: 'time', required: true, value: pref.from || '09:00' }),
      UI.field({ label: 'Window ends', name: 'to', type: 'time', required: true, value: pref.to || '17:00' }),
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save preferences'])
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var res = Services.setPreferredContact(c.id, { channel: v.channel, from: v.from, to: v.to });
      UI.showErrors(form, res.ok ? {} : (res.errors || { _form: res.error }));
      if (!res.ok) { return; }
      if (!res.changed) {
        UI.toast('No changes to save.', 'info');
        return;
      }
      UI.toast('Preferences saved.', 'ok');
      draw();
    });

    box.appendChild(el('div', { class: 'stack' }, [
      el('div', { class: 'grid grid--2' }, [
        UI.panel('Current preferences', view, { note: 'Reminder opt-out is the customer\'s own choice, made in the portal or from the reminder email. Staff can see it but not change it.' }),
        UI.panel('Record contact preference', el('div', { class: 'stack' }, [
          el('p', null, ['New follow-ups default to this channel and window. Scheduling outside the window needs a logged reason.']),
          form
        ]))
      ])
    ]));
  }
});
