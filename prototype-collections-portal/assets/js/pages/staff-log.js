// Standard interaction log with follow-up scheduling (US-08, 30, 33, 34).
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;

  var acct = Staff.accountParam();
  if (!acct) { main.appendChild(Staff.noAccountPanel('log an interaction')); return; }
  var customer = Staff.findByAccountNo(acct);
  if (!customer) { main.appendChild(Staff.notFoundPanel(acct)); return; }

  var cid = customer.id;
  var today = Clock.today();
  var codes = Store.config('outcomeCodes') || [];
  var methods = Store.config('contactMethods') || [];
  var nextActions = Store.config('nextActions') || [];
  var TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!codes.length || !methods.length || !nextActions.length) {
    main.appendChild(el('div', { class: 'notice notice--error' }, ['The outcome codes, contact methods or next actions are not configured, so the log form cannot be shown.']));
    return;
  }

  function codeDef(code) { return codes.filter(function (c) { return c.code === code; })[0] || null; }

  function parseMoney(v) { return Number(String(v).replace(/[\u00a3,\s]/g, '')); }

  function pickMethod(channel) {
    var m = methods.filter(function (x) { return x.toLowerCase() === String(channel || '').toLowerCase(); })[0];
    return m || methods[0];
  }

  function placeholder(text) { return { value: '', label: text }; }

  var unlocked = Staff.isUnlocked(cid);
  var win = Services.promiseWindow();
  var formHost = el('div');
  var afterHost = el('div', { class: 'stack' });

  // ---------- log form ----------

  var limitBox = el('div', { 'aria-live': 'polite' });
  var overrideWrap = el('div', { class: 'hidden' }, [
    UI.field({
      label: 'Override reason (contact limit)', name: 'overrideReason', type: 'textarea', required: true,
      help: 'Required because this contact exceeds the contact limit. The reason is saved with the log. Fictional data only: do not type real personal details.'
    })
  ]);
  var promiseBox = el('div', { class: 'hidden' }, [
    el('h3', null, ['Promise details']),
    UI.field({ label: 'Promised amount (\u00a3)', name: 'promiseAmount', type: 'text', required: true, attrs: { inputmode: 'decimal' } }),
    UI.field({
      label: 'Promise date', name: 'promiseDate', type: 'date', required: true,
      attrs: { min: Clock.addDays(today, win.min), max: Clock.addDays(today, win.max) },
      help: 'Between ' + win.min + ' and ' + win.max + ' days from today.'
    }),
    el('div', { class: 'notice notice--info' }, [
      'The promise is saved on the account with verification result "', el('strong', null, [Staff.verificationResult(cid)]), '" taken from this session\'s phone verification.'
    ])
  ]);

  var form = el('form', { novalidate: true }, [
    UI.field({ label: 'Contact date', name: 'date', type: 'date', required: true, value: today, attrs: { max: today } }),
    UI.field({ label: 'Contact method', name: 'method', type: 'select', required: true, options: [placeholder('Select a contact method')].concat(methods) }),
    UI.field({
      label: 'Outcome code', name: 'outcomeCode', type: 'select', required: true,
      options: [placeholder('Select an outcome')].concat(codes.map(function (c) { return { value: c.code, label: c.code + ' - ' + c.label }; }))
    }),
    promiseBox,
    UI.field({ label: 'Next action', name: 'nextAction', type: 'select', required: true, options: [placeholder('Select the next action')].concat(nextActions) }),
    UI.field({ label: 'Notes', name: 'notes', type: 'textarea', help: 'Do not enter card numbers or verification answers. Fictional data only: do not type real personal details.' }),
    limitBox,
    overrideWrap,
    el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save log']),
      el('a', { class: 'btn', href: Staff.recordHref(customer.accountNo) }, ['Cancel and return to the record'])
    ])
  ]);
  formHost.appendChild(form);

  // Shows the contact-limit warning and override field for the chosen date; returns true if the limit is exceeded.
  function refreshLimit() {
    limitBox.textContent = '';
    var date = form.elements.date.value;
    if (Validate.date(date, { max: today })) { overrideWrap.classList.add('hidden'); return false; }
    var chk = Services.checkContactLimit(cid, date);
    if (!chk.exceeds) { overrideWrap.classList.add('hidden'); return false; }
    limitBox.appendChild(el('div', { class: 'notice notice--warn', role: 'status' }, [
      el('strong', null, ['Contact limit reached. ']),
      'This customer has had ' + chk.count + ' contacts in the last ' + chk.windowDays + ' days (limit ', UI.tbd('Contact limit', chk.limit), '). ' +
      'Saving this contact exceeds the limit, so an override reason is required.'
    ]));
    overrideWrap.classList.remove('hidden');
    return true;
  }

  function refreshOutcome() {
    var def = codeDef(form.elements.outcomeCode.value);
    promiseBox.classList.toggle('hidden', !(def && def.requiresPromise));
  }

  form.elements.date.addEventListener('change', refreshLimit);
  form.elements.date.addEventListener('input', refreshLimit);
  form.elements.outcomeCode.addEventListener('change', refreshOutcome);
  refreshLimit();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t0 = window.performance && performance.now ? performance.now() : Date.now();
    var v = UI.readForm(form);
    var def = codeDef(v.outcomeCode);
    var errors = {};
    var err;
    if ((err = Validate.date(v.date, { max: today }))) { errors.date = err; }
    if (!v.method) { errors.method = 'Select a contact method.'; }
    if (!def) { errors.outcomeCode = 'Select an outcome code.'; }
    if (!v.nextAction) { errors.nextAction = 'Select the next action.'; }
    if (def && def.requiresPromise) {
      if ((err = Validate.amount(v.promiseAmount, { max: customer.balance }))) { errors.promiseAmount = err; }
      if ((err = Validate.date(v.promiseDate, { min: Clock.addDays(today, win.min), max: Clock.addDays(today, win.max) }))) { errors.promiseDate = err; }
    }
    var exceeds = errors.date ? false : refreshLimit();
    if (exceeds && !v.overrideReason) { errors.overrideReason = 'Enter a reason for exceeding the contact limit.'; }
    UI.showErrors(form, errors);
    if (Object.keys(errors).length) { return; }

    var promise = null;
    if (def.requiresPromise) {
      var pr = Services.createPromise({
        customerId: cid, amount: parseMoney(v.promiseAmount), dueDate: v.promiseDate, source: 'rep', verificationResult: Staff.verificationResult(cid)
      });
      if (!pr.ok) {
        var pe = pr.errors || { _form: pr.error };
        var shown = {};
        if (pe.amount) { shown.promiseAmount = pe.amount; }
        if (pe.dueDate) { shown.promiseDate = pe.dueDate; }
        if (pe.verificationResult || pe._form) { shown._form = pe.verificationResult || pe._form; }
        UI.showErrors(form, shown);
        return;
      }
      promise = pr.promise;
    }

    var res = Services.addLog({
      customerId: cid, kind: 'interaction', date: v.date, method: v.method, outcomeCode: def.code,
      promiseAmount: promise ? promise.amount : null, promiseDate: promise ? promise.dueDate : null,
      nextAction: v.nextAction, notes: v.notes, overrideReason: exceeds ? v.overrideReason : '',
      reference: promise ? promise.reference : null
    });
    if (!res.ok) { UI.showErrors(form, { _form: res.error }); return; }

    var ms = Math.max(1, Math.round((window.performance && performance.now ? performance.now() : Date.now()) - t0));
    showSaved(res.log, def, promise, ms);
  });

  // ---------- after save ----------

  function showSaved(log, def, promise, ms) {
    formHost.textContent = '';
    formHost.appendChild(el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--ok', role: 'status' }, [
        el('strong', null, ['Saved in ' + ms + ' ms (target ']), UI.tbd('Log save time target', 'n seconds'), el('strong', null, [').']),
        ' The log is linked to account ' + customer.accountNo + ' (log ' + log.id + ').'
      ]),
      promise ? el('div', { class: 'notice notice--info' }, [
        'Promise to pay recorded: ' + Fmt.money(promise.amount) + ' by ' + Fmt.date(promise.dueDate) + ' (reference ' + promise.reference + '). ' +
        'Existing open follow-ups for this customer are paused until that date.'
      ]) : null,
      el('div', { class: 'row' }, [
        el('a', { class: 'btn btn--primary', href: Staff.recordHref(customer.accountNo) }, ['Back to customer record']),
        el('a', { class: 'btn', href: Staff.logHref(customer.accountNo) }, ['Log another interaction']),
        el('a', { class: 'btn', href: 'staff-followups.html' }, ['Go to follow-ups'])
      ])
    ]));
    if (def.followUp) {
      afterHost.appendChild(followupPanel(log, def));
    } else {
      afterHost.appendChild(el('div', { class: 'notice notice--info' }, ['The outcome "' + def.label + '" does not schedule a follow-up.']));
    }
  }

  function followupPanel(log, def) {
    var defaults = Services.followupDefaults(def.code, cid);
    var pref = customer.preferred || {};
    var hasWindow = !!(pref.from && pref.to);
    var panelBody = el('div', { class: 'stack' });

    // Created in 'created' state: the interval comes from the outcome code; the rep can override it afterwards.
    function renderCreated(f, message) {
      panelBody.textContent = '';
      var oform = el('form', { novalidate: true, class: 'hidden' }, [
        UI.field({ label: 'New follow-up date', name: 'dueDate', type: 'date', required: true, value: f.dueDate, attrs: { min: today } }),
        UI.field({ label: 'New follow-up time', name: 'time', type: 'time', required: true, value: f.time }),
        UI.field({
          label: 'Override reason', name: 'overrideReason', type: 'textarea', required: true,
          help: 'Required. Saved with the follow-up and in the audit trail. Fictional data only: do not type real personal details.'
        }),
        el('div', { class: 'row' }, [
          el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save new date and time']),
          el('button', { type: 'button', class: 'btn', onclick: function () { oform.classList.add('hidden'); toggle.classList.remove('hidden'); } }, ['Cancel'])
        ])
      ]);
      var toggle = el('button', { type: 'button', class: 'btn', onclick: function () { oform.classList.remove('hidden'); toggle.classList.add('hidden'); } }, ['Override date/time']);

      oform.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = UI.readForm(oform);
        var errors = {};
        if (Validate.date(v.dueDate, { min: today })) { errors.dueDate = 'Enter a follow-up date of today or later.'; }
        if (!TIME_RE.test(v.time)) { errors.time = 'Enter a time.'; }
        if (!v.overrideReason) { errors.overrideReason = 'Enter a reason for overriding the date or time.'; }
        UI.showErrors(oform, errors);
        if (Object.keys(errors).length) { return; }
        var res = Services.rescheduleFollowup(f.id, { dueDate: v.dueDate, time: v.time, overrideReason: v.overrideReason });
        if (!res.ok) { UI.showErrors(oform, res.errors || { _form: res.error }); return; }
        renderCreated(res.followup, 'Follow-up rescheduled. Override reason saved.');
      });

      panelBody.appendChild(el('div', { class: 'notice notice--ok', role: 'status' }, [
        el('strong', null, [message || 'Follow-up created. ']),
        f.status === 'Paused' ? ' It is paused until ' + Fmt.date(f.pausedUntil) + ' because of the promise to pay.' : ''
      ]));
      panelBody.appendChild(el('dl', { class: 'kv' }, [
        el('dt', null, ['Follow-up date']), el('dd', null, [Fmt.date(f.dueDate) + ' at ' + f.time]),
        el('dt', null, ['Owner']), el('dd', null, [Staff.userName(f.ownerId)]),
        el('dt', null, ['Contact method']), el('dd', null, [f.channel || '']),
        el('dt', null, ['Default date']), el('dd', null, [Fmt.date(defaults.dueDate) + ' (' + defaults.days + (defaults.days === 1 ? ' day' : ' days') + ' after the contact, set per outcome code)']),
        el('dt', null, ['Preferred window']), el('dd', null, [hasWindow ? prefLabel(pref) : 'None recorded'])
      ]));
      panelBody.appendChild(toggle);
      panelBody.appendChild(oform);
      panelBody.appendChild(el('div', { class: 'row' }, [
        el('a', { class: 'btn btn--primary', href: Staff.recordHref(customer.accountNo) }, ['Back to customer record']),
        el('a', { class: 'btn', href: 'staff-followups.html' }, ['View follow-ups'])
      ]));
    }

    var created = Services.createFollowup({
      customerId: cid, ownerId: defaults.ownerId, dueDate: defaults.dueDate, time: defaults.time, channel: pickMethod(defaults.channel),
      sourceLogId: log.id, outcomeCode: def.code, overrideReason: ''
    });
    if (created.ok) {
      renderCreated(created.followup);
    } else {
      panelBody.appendChild(el('div', { class: 'notice notice--error', role: 'alert' }, [
        'The log was saved, but the follow-up could not be created: ' + created.error
      ]));
    }

    return UI.panel('Follow-up', panelBody, {
      note: 'Production: saving the log creates the diary item (POST /followups) from the outcome rule. Changing the date or time afterwards (PATCH /followups/{id}) is only accepted with a reason, which is stored with the follow-up and in the audit trail.'
    });
  }

  function prefLabel(pref) {
    return pref.from + ' to ' + pref.to + (pref.channel ? ' by ' + pref.channel : '');
  }

  // ---------- page ----------

  var headerRows = [
    el('dt', null, ['Account number']), el('dd', { class: 'mono' }, [customer.accountNo]),
    unlocked ? [el('dt', null, ['Name']), el('dd', null, [customer.name])] : null
  ];
  main.appendChild(el('div', { class: 'stack' }, [
    UI.panel('Customer', el('div', { class: 'stack' }, [
      el('dl', { class: 'kv' }, headerRows),
      unlocked ? null : el('div', { class: 'notice notice--warn' }, [
        'The caller has not been verified in this session. You can still log the contact, but verify the caller on the ',
        el('a', { href: Staff.recordHref(customer.accountNo) }, ['customer record']),
        ' before discussing the account.'
      ]),
      el('div', { class: 'row' }, [el('a', { class: 'btn', href: Staff.recordHref(customer.accountNo) }, ['Back to customer record'])])
    ])),
    UI.panel('Log an interaction', formHost, {
      note: 'Production: saving posts to POST /customers/{id}/interactions. Outcome codes and mandatory fields come from the agreed case-management configuration, so every team records the same fields.'
    }),
    afterHost
  ]));
});
