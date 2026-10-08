/* portal-verify: identity check (account number + date of birth + postcode), generic failure, lockout, rep route. US-19, US-20, US-23. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var stack = el('div', { class: 'stack' });
  main.appendChild(stack);

  var verifiedId = Auth.verifiedCustomer();
  var customer = verifiedId ? Store.find('customers', verifiedId) : null;

  // Already verified: no form, just the way on.
  if (customer) {
    stack.appendChild(UI.panel('You are verified', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--ok' }, ['You are signed in as ' + Portal.firstName(customer) + '.']),
      el('div', { class: 'row' }, [
        el('a', { class: 'btn btn--primary', href: 'portal-account.html' }, ['Go to my account']),
        el('button', {
          type: 'button', class: 'btn', onclick: function () { Auth.setVerified(null); window.location.reload(); }
        }, ['Sign out'])
      ])
    ])));
    stack.appendChild(Portal.repContactPanel());
    return;
  }

  var result = el('div', { 'aria-live': 'polite' });

  var form = el('form', { novalidate: true, autocomplete: 'off' }, [
    UI.field({ label: 'Account number', name: 'accountNo', required: true, help: 'Shown on your statement and reminder messages.', attrs: { inputmode: 'numeric', autocomplete: 'off', maxlength: '20' } }),
    UI.field({ label: 'Date of birth', name: 'dob', type: 'date', required: true, attrs: { max: Clock.today(), autocomplete: 'off' } }),
    UI.field({ label: 'Postcode', name: 'postcode', required: true, help: 'The postcode we hold for your account.', attrs: { autocomplete: 'off', maxlength: '10' } }),
    el('button', { type: 'submit', class: 'btn btn--primary' }, ['Verify and continue'])
  ]);

  // One identical message for wrong details, an unknown account and a locked account, so it reveals neither which answer was wrong, nor that the account exists, nor that it is locked.
  function failure() {
    return el('div', { class: 'notice notice--error', role: 'alert' }, [
      el('strong', null, ['We could not verify you with the details entered. ']),
      'Check your details and try again, or speak to a collections rep. ',
      'Call ' + Portal.REP_PHONE + ' (details below).'
    ]);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    result.textContent = '';
    var v = UI.readForm(form);
    var errors = {};
    if (!v.accountNo) { errors.accountNo = 'Enter your account number.'; }
    if (!v.dob) { errors.dob = 'Enter your date of birth.'; }
    else if (Validate.date(v.dob, { max: Clock.today() })) { errors.dob = 'Enter your date of birth as a valid date.'; }
    if (!v.postcode) { errors.postcode = 'Enter your postcode.'; }
    UI.showErrors(form, errors);
    if (Object.keys(errors).length) { return; }

    // Incomplete forms never reach Services.verify, so they do not count towards lockout.
    var res = Services.verify(v.accountNo, { dob: v.dob, postcode: v.postcode }, { method: 'portal' });
    if (res.result === 'Verified') {
      Auth.setVerified(res.customerId);
      window.location.href = 'portal-account.html';
      return;
    }
    form.elements.dob.value = '';
    form.elements.postcode.value = '';
    result.appendChild(failure());
  });

  stack.appendChild(UI.panel('Verify your identity', el('div', { class: 'stack' }, [
    el('p', null, ['We need to check it is you before showing any account information or taking a payment.']),
    form,
    result,
    el('p', { class: 'muted' }, ['Demo accounts and their details are listed on the ', el('a', { href: 'index.html' }, ['home page']), '. Account 100006 is already locked.']),
    el('p', { class: 'muted' }, ['We use these details only to check who you are: ', el('a', { href: 'index.html#privacy' }, ['read the privacy notice']), '.'])
  ]), {
    note: ['Production would use a stronger method (for example a one-time code). The answers are checked on the server and are never stored: only the outcome is logged. ' +
      'The account locks after ', UI.tbd('Failed attempts before lockout', Services.setting('lockoutThreshold')), ' failed attempts and only a rep can unlock it after phone verification. ' +
      'The message is the same for wrong details, an unknown account and a locked account, so it never says which answer was wrong or whether the account exists or is locked. The lock shows to staff only, and the number of attempts left is not shown.']
  }));

  stack.appendChild(Portal.repContactPanel({
    title: 'Cannot verify? Talk to a rep',
    lead: 'If verification fails, or you would rather not use the portal, a collections rep can help you directly.'
  }));
});
