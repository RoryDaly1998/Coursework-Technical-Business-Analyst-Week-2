/* portal-promise: choose a permitted plan and a date inside the window, confirm, view the active promise. US-35, US-36. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var customerId = Auth.verifiedCustomer();

  function money2(n) { return (Math.round((n + 1e-9) * 100) / 100); }

  // Plans are percentages of the balance from settings; zero amounts and duplicates are dropped.
  function plansFor(balance) {
    var plans = [];
    Portal.promisePlans().forEach(function (pct) {
      var amount = money2(balance * pct / 100);
      if (amount > 0 && !plans.some(function (p) { return p.amount === amount; })) { plans.push({ pct: pct, amount: amount }); }
    });
    return plans;
  }

  function activePromise() {
    return Store.find('promises', function (p) { return p.customerId === customerId && p.status === 'Active'; });
  }

  function activePanel(promise) {
    if (!promise) {
      return UI.panel('Your active promise', UI.emptyState('You have no active promise to pay. Choose a plan below to make one.'));
    }
    return UI.panel('Your active promise', el('div', { class: 'stack' }, [
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Amount']), el('dd', null, [Fmt.money(promise.amount)]),
        el('dt', null, ['Pay by']), el('dd', null, [Fmt.date(promise.dueDate), ' (' + Portal.dueText(promise.dueDate) + ')']),
        el('dt', null, ['Reference']), el('dd', { class: 'mono' }, [promise.reference || '']),
        el('dt', null, ['Status']), el('dd', null, [UI.badge(promise.status, 'ok')]),
        el('dt', null, ['Made on']), el('dd', null, [Fmt.datetime(promise.createdAt) + (promise.source === 'rep' ? ' (agreed with a rep)' : ' (online)')])
      ]),
      el('p', { class: 'muted' }, ['Only one promise can be active. Making a new one replaces this one.'])
    ]));
  }

  function confirmationPanel(info) {
    var p = info.promise;
    var mails = Store.filter('messages', function (m) { return m.customerId === customerId && m.kind === 'promise-confirmation'; });
    var mail = mails.length ? mails[mails.length - 1] : null;
    var mailNote = mail && mail.status === 'bounced'
      ? el('div', { class: 'notice notice--warn' }, ['We could not deliver the confirmation email because the address we hold bounced. ', el('a', { href: 'outbox.html' }, ['Read it in My messages']), ' or ', el('a', { href: 'portal-details.html' }, ['update your email address']), '.'])
      : el('div', { class: 'notice notice--info' }, ['A confirmation email has been sent. ', el('a', { href: 'outbox.html' }, ['See it in My messages'])]);
    return UI.panel('Promise confirmation', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--ok', role: 'status' }, ['Your promise to pay has been recorded. No money has been taken.']),
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Amount']), el('dd', null, [Fmt.money(p.amount)]),
        el('dt', null, ['Pay by']), el('dd', null, [Fmt.date(p.dueDate)]),
        el('dt', null, ['Reference']), el('dd', { class: 'mono' }, [p.reference])
      ]),
      info.superseded ? el('p', null, ['Your previous promise has been replaced.']) : null,
      info.paused ? el('p', null, ['We will pause reminder calls until ' + Fmt.date(p.dueDate) + '.']) : null,
      mailNote
    ]));
  }

  function formPanel(c, active, onDone) {
    var win = Portal.promiseWindow();
    var minIso = Clock.addDays(Clock.today(), win.min);
    var maxIso = Clock.addDays(Clock.today(), win.max);
    var plans = plansFor(c.balance);
    var first = plans.length ? plans[0].amount.toFixed(2) : '';

    var form = el('form', { novalidate: true }, [
      UI.field({
        label: 'How much will you pay?', name: 'plan', type: 'radio', value: first, required: true,
        options: plans.map(function (p) {
          return { value: p.amount.toFixed(2), label: (p.pct === 100 ? 'Full balance' : p.pct + '% of balance') + ': ' + Fmt.money(p.amount) };
        })
      }),
      UI.field({
        label: 'On what date will you pay?', name: 'dueDate', type: 'date', required: true,
        help: 'Choose a date from ' + Fmt.date(minIso) + ' to ' + Fmt.date(maxIso) + '.', attrs: { min: minIso, max: maxIso }
      }),
      el('button', { type: 'submit', class: 'btn btn--primary' }, [active ? 'Replace my promise' : 'Make my promise'])
    ]);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var errors = {};
      if (!v.plan) { errors.plan = 'Choose how much you will pay.'; }
      else if (!plans.some(function (p) { return p.amount.toFixed(2) === v.plan; })) { errors.plan = 'Choose one of the plans shown.'; }
      var dateError = Validate.date(v.dueDate, { min: minIso, max: maxIso });
      if (dateError) { errors.dueDate = dateError; }
      UI.showErrors(form, errors);
      if (Object.keys(errors).length) { return; }

      var save = function () {
        var res = Services.createPromise({
          customerId: customerId, amount: v.plan, dueDate: v.dueDate, source: 'portal',
          verificationResult: 'Verified'
        });
        if (!res.ok) {
          var source = res.errors || { _form: res.error };
          var mapped = {};
          Object.keys(source).forEach(function (k) { mapped[k === 'amount' ? 'plan' : k] = source[k]; });
          UI.showErrors(form, mapped);
          return;
        }
        onDone({ promise: res.promise, superseded: res.superseded && res.superseded.length, paused: res.pausedFollowups });
      };
      if (active) {
        UI.confirm('This will replace your current promise of ' + Fmt.money(active.amount) + ' by ' + Fmt.date(active.dueDate) + '. Continue?', { title: 'Replace your promise', confirmLabel: 'Replace' })
          .then(function (ok) { if (ok) { save(); } });
      } else { save(); }
    });

    return UI.panel(active ? 'Change your promise' : 'Promise to pay', el('div', { class: 'stack' }, [
      el('p', null, ['Tell us how much you will pay and when. No money is taken now. You pay later through this portal or by phone.']),
      form
    ]), {
      note: ['The permitted plans come from a policy setting, and the payment date must fall inside a window of ',
        UI.tbd('Promise date window', Portal.promiseWindow().max), ' days from today. The service re-checks both, so a typed-in date outside the window is rejected too. Only one promise can be active per account.']
    });
  }

  function render(info) {
    main.textContent = '';
    var c = Store.find('customers', customerId);
    var active = activePromise();
    var parts = [];
    if (info) { parts.push(confirmationPanel(info)); }
    parts.push(Portal.balancePanel(c));
    parts.push(activePanel(active));
    if (c.balance > 0) {
      parts.push(formPanel(c, active, render));
    } else {
      parts.push(el('div', { class: 'notice notice--info' }, ['You have nothing left to pay, so no promise is needed.']));
    }
    parts.push(el('div', { class: 'row' }, [
      el('a', { class: 'btn', href: 'portal-account.html' }, ['Back to my account']),
      el('a', { class: 'btn', href: 'portal-pay.html' }, ['Pay now instead'])
    ]));
    main.appendChild(el('div', { class: 'stack' }, parts));
  }

  render();
});
