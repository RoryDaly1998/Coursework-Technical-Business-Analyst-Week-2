// Staff home: search by account number, then open the record (US-03).
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;

  var input = UI.field({
    label: 'Account number', name: 'acct', type: 'text', required: true,
    help: 'Six-digit account number, for example 100001.',
    attrs: { inputmode: 'numeric', autocomplete: 'off', maxlength: '12' }
  });
  var form = el('form', { novalidate: true }, [
    input,
    el('button', { type: 'submit', class: 'btn btn--primary' }, ['Search'])
  ]);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var acct = UI.readForm(form).acct.replace(/\s+/g, '');
    var errors = {};
    if (!acct) { errors.acct = 'Enter an account number.'; }
    else if (!/^\d{1,12}$/.test(acct)) { errors.acct = 'Use digits only, up to 12 digits.'; }
    else if (!Staff.findByAccountNo(acct)) { errors.acct = 'No customer found for that account number. Check it and try again.'; }
    UI.showErrors(form, errors);
    if (Object.keys(errors).length) { return; }
    Staff.markSearch(acct);
    window.location.href = Staff.recordHref(acct);
  });

  var searchPanel = UI.panel('Find a customer', el('div', { class: 'stack' }, [
    form,
    el('p', { class: 'muted' }, ['The record opens in one step. Target: opens within ', UI.tbd('Record open time target', 'n seconds'), ' of the search.'])
  ]), {
    note: 'Search calls GET /customers?accountNo=... on the central customer database, which is the single source for contact details, balance, history and follow-ups.'
  });

  main.appendChild(el('div', { class: 'stack' }, [searchPanel]));
});
