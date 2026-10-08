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

  var demoRows = [
    ['100001', 'Happy path: verify, view history, edit contact details, log an interaction.'],
    ['100004', 'Promise due today. After the fulfilment check runs (Scheduled jobs, IT role) the unfulfilled-promise banner appears.'],
    ['100006', 'Locked account: verify the caller by phone, then unlock.'],
    ['100008', 'Unfulfilled promise already flagged; contact limit reached, so logging needs an override reason.'],
    ['100009', 'Prefers SMS from 09:00 to 12:00 (preferred contact window demo).']
  ];
  var demoList = el('ul', null, demoRows.map(function (r) {
    return el('li', null, [
      el('a', { href: Staff.recordHref(r[0]), onclick: function () { Staff.markSearch(r[0]); } }, [r[0]]),
      ' ' + r[1]
    ]);
  }));

  main.appendChild(el('div', { class: 'stack' }, [
    searchPanel,
    el('div', { class: 'grid grid--2' }, [
      UI.panel('One record, no second system', el('div', { class: 'stack' }, [
        el('p', null, ['Contact details, balance, case history and open follow-ups are all on the customer record. A standard case needs no second system.']),
        el('p', null, ['Fields your role may not see show as "Restricted for your role". Account details stay locked until the caller is verified.']),
        el('div', { class: 'row' }, [el('a', { class: 'btn', href: 'staff-followups.html' }, ['Go to follow-ups'])])
      ])),
      UI.panel('Demo accounts', el('div', { class: 'stack' }, [
        demoList,
        el('p', { class: 'muted' }, ['Demo hints only. Any rep can open any account in this demo. A live service would not list accounts.'])
      ]))
    ])
  ]));
});
