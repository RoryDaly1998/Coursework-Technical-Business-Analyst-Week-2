/* portal-pay: full or partial card payment, confirmation, failure and safe retry. US-12, US-13, US-14. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var customerId = Auth.verifiedCustomer();
  var retryError = '';
  var SIMULATIONS = [
    { value: 'approve', label: 'Approve' },
    { value: 'decline', label: 'Decline' },
    { value: 'timeout', label: 'Timeout (not charged)' },
    { value: 'timeout-charged', label: 'Timeout but charged' }
  ];

  function customer() { return Store.find('customers', customerId); }

  // Retry state survives a reload; it is dropped as soon as it no longer matches a failed payment of this customer.
  function pendingAttempt() {
    var saved = Store.session.get('payRetry');
    if (!saved || saved.customerId !== customerId) { return null; }
    var row = Store.find('payments', function (p) { return p.idempotencyKey === saved.key; });
    if (!row || row.customerId !== customerId || row.status !== 'failed') { Store.session.remove('payRetry'); return null; }
    return { key: saved.key, amount: row.amount, payment: row };
  }

  function simulateControl() {
    return el('label', { class: 'demo-control' }, [
      el('span', null, ['Demo: simulate provider result']),
      el('select', { class: 'select', name: 'simulate' }, SIMULATIONS.map(function (o) { return el('option', { value: o.value }, [o.label]); }))
    ]);
  }

  function cardInput(id, label, hint, secret) {
    return el('div', { class: 'form-field' }, [
      el('label', { class: 'form-field__label', for: id }, [label + ' (Test form: do not enter a real card)']),
      el('input', {
        class: 'input', type: secret ? 'password' : 'text', id: id, autocomplete: 'off', placeholder: hint, 'data-card': true,
        inputmode: secret ? 'numeric' : null
      })
    ]);
  }

  function cardPanel() {
    return UI.panel('Card details', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--info' }, ['In production this would be the payment provider\'s hosted form; nothing typed here is read or stored. This prototype keeps only a payment token (for example tok_demo_ab12cd34).']),
      el('div', { class: 'grid grid--3' }, [
        cardInput('card-number', 'Card number', 'Demo only: not read'),
        cardInput('card-expiry', 'Expiry date', 'MM/YY'),
        cardInput('card-security', 'Security code', '3 digits', true)
      ])
    ]), { label: 'Simulated provider form' });
  }

  // The card boxes are never read; they are only emptied after each attempt.
  function clearCard(form) {
    Array.prototype.forEach.call(form.querySelectorAll('input[data-card]'), function (i) { i.value = ''; });
  }

  // US-13: the confirmation message is sent here (postPayment sends none) and takes its amount from the payment record.
  function sendConfirmation(payment) {
    var c = customer();
    var tpl = Services.renderTemplate('Payment confirmation', {
      name: Portal.firstName(c), amount: Fmt.money(payment.amount), date: Fmt.date(payment.date), reference: payment.reference
    });
    return Services.sendMessage({
      customerId: customerId,
      kind: 'payment-confirmation',
      templateId: tpl ? tpl.templateId : null,
      subject: 'Payment received',
      body: tpl ? tpl.body : 'Hello ' + Portal.firstName(c) + ', we received your payment of ' + Fmt.money(payment.amount) + ' on ' + Fmt.date(payment.date) +
        '. Your reference is ' + payment.reference + '. Thank you.',
      links: [{ label: 'View my account', href: 'portal-account.html' }]
    });
  }

  // One attempt, new or retried. A retry passes the same key, so the service never creates a second payment.
  function attempt(key, amount, simulate, form) {
    var before = Store.find('payments', function (p) { return p.idempotencyKey === key; });
    var wasCharged = !!(before && before.providerCharged);
    var res = Services.postPayment({ customerId: customerId, amount: amount, channel: 'portal', idempotencyKey: key, simulate: simulate });

    if (res.status === 'invalid') {
      if (before) { retryError = res.error || 'This payment cannot be retried.'; render(); }
      else { UI.showErrors(form, res.errors || { _form: res.error }); }
      return;
    }
    if (res.status === 'failed') {
      Store.session.set('payRetry', { customerId: customerId, key: key });
      retryError = '';
      render();
      return;
    }
    if (res.status === 'success') {
      Store.session.remove('payRetry');
      retryError = '';
      var mail = res.duplicate ? null : sendConfirmation(res.payment);
      render({ payment: res.payment, mail: mail, wasCharged: wasCharged });
      return;
    }
    UI.toast('This payment could not be processed.', 'error');
  }

  function confirmationPanel(info) {
    var p = info.payment;
    var c = customer();
    var mailNote;
    if (info.mail && info.mail.ok && info.mail.status !== 'bounced') {
      mailNote = el('div', { class: 'notice notice--info' }, ['A confirmation email for ' + Fmt.money(p.amount) + ' has been sent to the address we hold. ', el('a', { href: 'outbox.html' }, ['See it in My messages'])]);
    } else if (info.mail && info.mail.ok) {
      mailNote = el('div', { class: 'notice notice--warn' }, ['We could not deliver the confirmation email because the address we hold bounced. ', el('a', { href: 'outbox.html' }, ['Read it in My messages']), ' or ', el('a', { href: 'portal-details.html' }, ['update your email address']), '.']);
    } else if (info.mail) {
      mailNote = el('div', { class: 'notice notice--warn' }, ['We could not send the confirmation email. Keep this page as your confirmation.']);
    }
    return UI.panel('Payment confirmation', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--ok', role: 'status' }, ['Thank you. Your payment was successful.']),
      info.wasCharged ? el('div', { class: 'notice notice--info' }, ['Your earlier attempt had already reached the card provider. It has now been confirmed once, so you have not been charged twice.']) : null,
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Amount paid']), el('dd', null, [Fmt.money(p.amount)]),
        el('dt', null, ['Date']), el('dd', null, [Fmt.date(p.date)]),
        el('dt', null, ['Reference']), el('dd', { class: 'mono' }, [p.reference]),
        el('dt', null, ['Balance now']), el('dd', null, [Fmt.money(c.balance)])
      ]),
      mailNote,
      el('div', { class: 'row' }, [
        el('a', { class: 'btn btn--primary', href: 'portal-account.html' }, ['Back to my account']),
        el('a', { class: 'btn', href: 'outbox.html' }, ['My messages'])
      ])
    ]));
  }

  function newPaymentPanel(c) {
    var modeField = UI.field({
      label: 'How much would you like to pay?', name: 'mode', type: 'radio', value: 'full',
      options: [{ value: 'full', label: 'Pay the full balance (' + Fmt.money(c.balance) + ')' }, { value: 'partial', label: 'Pay a different amount' }]
    });
    var amountField = UI.field({
      label: 'Amount (\u00a3)', name: 'amount', help: 'Up to ' + Fmt.money(c.balance) + ', with no more than two decimal places.',
      attrs: { inputmode: 'decimal', autocomplete: 'off' }
    });
    amountField.classList.add('hidden');

    var form = el('form', { novalidate: true }, [
      modeField, amountField, cardPanel(),
      el('div', { class: 'row' }, [simulateControl(), el('button', { type: 'submit', class: 'btn btn--primary' }, ['Pay now'])])
    ]);
    form.addEventListener('change', function () {
      amountField.classList.toggle('hidden', UI.readForm(form).mode !== 'partial');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var fresh = customer();
      var amount = v.mode === 'partial' ? v.amount : fresh.balance;
      var err = Validate.amount(amount, { max: fresh.balance });
      UI.showErrors(form, err ? { amount: err } : {});
      if (err) { return; }
      clearCard(form);
      attempt(Portal.newKey(), amount, v.simulate, form);
    });
    return UI.panel('Pay by card', form, {
      note: 'Card entry happens in a payment-provider hosted form, so card numbers never reach our systems. We send the provider an idempotency key with every payment so a retry can never charge twice.'
    });
  }

  function retryPanel(pending) {
    var p = pending.payment;
    var reason = p.reasonCategory || 'Payment not completed';
    var timedOut = /timeout/i.test(reason);
    var form = el('form', { novalidate: true }, [
      el('div', { class: 'row' }, [
        simulateControl(),
        el('button', { type: 'submit', class: 'btn btn--primary' }, ['Retry payment of ' + Fmt.money(pending.amount)]),
        (reason === 'Card declined' || retryError) ? el('button', {
          type: 'button', class: 'btn', onclick: function () { Store.session.remove('payRetry'); retryError = ''; render(); }
        }, ['Cancel this attempt and start a new payment']) : null
      ])
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempt(pending.key, pending.amount, UI.readForm(form).simulate, form);
    });
    return UI.panel('Your payment did not go through', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--error', role: 'alert' }, [
        el('strong', null, ['Payment of ' + Fmt.money(pending.amount) + ' failed. ']), 'Reason: ' + reason + '.'
      ]),
      el('p', null, [timedOut
        ? 'We did not get an answer from the card provider, so we cannot be sure whether the payment went through. Retrying is safe: it reuses the same payment reference, so you will not be charged twice.'
        : 'Your card was not accepted. You can retry, which reuses the same payment reference so you cannot be charged twice, or start again with a different amount.']),
      el('p', { class: 'muted' }, ['This failed attempt is recorded on your account (reference ' + p.reference + ', attempt ' + (p.attempts || 1) + '). ', el('a', { href: 'portal-account.html' }, ['View my account'])]),
      retryError ? el('div', { class: 'notice notice--warn', role: 'alert' }, [retryError]) : null,
      form
    ]), { note: 'The retry sends the same idempotency key. The provider returns the original result if it already took the money, so one payment is recorded and the balance drops once.' });
  }

  // info (optional) holds the details of a payment that has just succeeded.
  function render(info) {
    main.textContent = '';
    var c = customer();
    var pending = pendingAttempt();
    var parts = [];
    if (info) { parts.push(confirmationPanel(info)); }
    parts.push(Portal.balancePanel(c));
    if (pending) {
      parts.push(retryPanel(pending));
    } else if (c.balance > 0) {
      parts.push(newPaymentPanel(c));
    } else {
      parts.push(el('div', { class: 'notice notice--info' }, [info ? 'Your balance is now clear.' : 'You have nothing to pay at the moment.']));
    }
    parts.push(Portal.repContactPanel({
      title: pending ? 'Need help? Talk to a collections rep' : 'Prefer to pay by phone?',
      lead: pending ? 'If the payment keeps failing, a rep can take payment with you or look into it.' : 'A collections rep can take your payment over the phone.'
    }));
    main.appendChild(el('div', { class: 'stack' }, parts));
  }

  render();
});
