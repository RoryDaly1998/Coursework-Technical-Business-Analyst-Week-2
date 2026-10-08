/* portal-account: balance, due date, payments, active promise, query. Reads through ReadApi and logs each view. US-28, US-40, US-41, US-42. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var customerId = Auth.verifiedCustomer();

  function get(path) { return ReadApi.request('GET', path, { sessionCustomerId: customerId }); }

  function actionLinks() {
    return UI.panel('What would you like to do?', el('div', { class: 'row' }, [
      el('a', { class: 'btn btn--primary', href: 'portal-pay.html' }, ['Make a payment']),
      el('a', { class: 'btn', href: 'portal-promise.html' }, ['Promise to pay']),
      el('a', { class: 'btn', href: 'portal-details.html' }, ['Update my details']),
      el('a', { class: 'btn', href: 'portal-preferences.html' }, ['Reminder preferences']),
      el('a', { class: 'btn', href: 'outbox.html' }, ['My messages'])
    ]));
  }

  function paymentsPanel(payments) {
    var holder = el('div');
    var rows = payments.slice().sort(function (a, b) { return String(b.at || b.date).localeCompare(String(a.at || a.date)); });
    UI.table(holder, {
      columns: [
        { key: 'date', label: 'Date', format: function (v) { return Fmt.date(v); } },
        { key: 'reference', label: 'Reference', format: function (v) { return el('span', { class: 'mono' }, [v || '']); } },
        { key: 'amount', label: 'Amount', format: function (v) { return Fmt.money(v); } },
        { key: 'channel', label: 'Method', format: function (v) { return Portal.channelLabel(v); } },
        { key: 'status', label: 'Status', format: function (v, row) { return el('span', null, [Portal.statusBadge(v), row.reasonCategory ? ' ' + row.reasonCategory : null]); } }
      ],
      rows: rows,
      empty: 'No payments recorded on this account yet.'
    });
    return UI.panel('Payments', holder);
  }

  function promisePanel(promise) {
    if (!promise) {
      return UI.panel('Active promise to pay', el('div', { class: 'stack' }, [
        UI.emptyState('You have no active promise to pay.'),
        el('div', null, [el('a', { class: 'btn', href: 'portal-promise.html' }, ['Make a promise to pay'])])
      ]));
    }
    return UI.panel('Active promise to pay', el('div', { class: 'stack' }, [
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Amount']), el('dd', null, [Fmt.money(promise.amount)]),
        el('dt', null, ['Pay by']), el('dd', null, [Fmt.date(promise.dueDate), ' (' + Portal.dueText(promise.dueDate) + ')']),
        el('dt', null, ['Reference']), el('dd', { class: 'mono' }, [promise.reference || '']),
        el('dt', null, ['Status']), el('dd', null, [UI.badge(promise.status, 'ok')]),
        el('dt', null, ['Made on']), el('dd', null, [Fmt.datetime(promise.createdAt)])
      ]),
      el('a', { class: 'btn btn--small', href: 'portal-promise.html' }, ['View or change my promise'])
    ]));
  }

  function queryPanel(account, rerender) {
    var open = Store.find('queries', function (q) { return q.customerId === customerId && q.status === 'Open'; });
    if (open || account.delinquencyHold) {
      return UI.panel('Your query', el('div', { class: 'stack' }, [
        el('div', null, [UI.badge('Query open: collection activity on hold', 'warn')]),
        el('p', null, [
          open ? 'You raised a query on ' + Fmt.datetime(open.at) + '. ' : '',
          'A rep will review your query, and collection activity on your account is paused until it has been reviewed. A rep will contact you.'
        ])
      ]));
    }
    var form = el('form', { novalidate: true }, [
      el('p', null, ['If a payment you made or promised is not showing, tell us. We will pause collection activity until a rep has reviewed it.']),
      UI.field({ label: 'Amount you expected us to have (optional)', name: 'expectedAmount', help: 'For example 60.00', attrs: { inputmode: 'decimal', autocomplete: 'off' } }),
      UI.field({ label: 'Date of that payment (optional)', name: 'expectedDate', type: 'date' }),
      el('button', { type: 'submit', class: 'btn' }, ['Raise a query'])
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form);
      var errors = {};
      if (v.expectedAmount && Validate.amount(v.expectedAmount)) { errors.expectedAmount = Validate.amount(v.expectedAmount); }
      if (v.expectedDate && Validate.date(v.expectedDate)) { errors.expectedDate = Validate.date(v.expectedDate); }
      UI.showErrors(form, errors);
      if (Object.keys(errors).length) { return; }
      var details = {};
      if (v.expectedAmount) { details.expectedAmount = v.expectedAmount; }
      if (v.expectedDate) { details.expectedDate = v.expectedDate; }
      var res = Services.raiseQuery(customerId, details);
      if (!res.ok) { UI.showErrors(form, { _form: res.error }); return; }
      UI.toast(res.duplicate ? 'A query is already open on your account.' : 'Query raised. Collection activity is on hold.', 'ok');
      rerender();
    });
    return UI.panel('Is a payment missing?', form, {
      note: 'Raising a query creates a case and sets a delinquency hold on the account. The hold shows on the rep record, the scheduled jobs skip the account, and it stays until a rep reviews the query.'
    });
  }

  // Reads everything through the read-only interface; logs the view only on the first load.
  function load(logView) {
    main.textContent = '';
    var account = get('/api/me/account');
    var pays = get('/api/me/payments');
    var promise = get('/api/me/promise');
    if (account.status !== 200 || pays.status !== 200 || promise.status !== 200) {
      main.appendChild(el('div', { class: 'stack' }, [
        el('div', { class: 'notice notice--error', role: 'alert' }, ['We could not load your account just now. Please try again, or call a collections rep on ' + Portal.REP_PHONE + '.']),
        el('div', null, [el('button', { type: 'button', class: 'btn', onclick: function () { window.location.reload(); } }, ['Try again'])]),
        Portal.repContactPanel()
      ]));
      return;
    }
    var a = account.body;
    var stackEl = el('div', { class: 'stack' }, [
      el('div', { class: 'row' }, [
        el('span', { class: 'muted' }, ['Hello ' + Portal.firstName(a) + '.']),
        el('button', { type: 'button', class: 'btn btn--small', onclick: function () { window.location.reload(); } }, ['Refresh']),
        a.delinquencyHold ? UI.badge('Query open', 'warn') : null
      ]),
      Portal.balancePanel(a),
      el('div', { class: 'grid grid--2' }, [paymentsPanel(pays.body.payments), promisePanel(promise.body.promise)]),
      actionLinks(),
      queryPanel(a, function () { load(false); }),
      UI.howItWorks('The page reads only the signed-in customer\'s own data through a read-only interface (GET only). Each load writes an account-view entry (customer and time) that compliance samples against the source record.')
    ]);
    main.appendChild(stackEl);
    if (logView) {
      Services.recordAccountView(customerId, { balance: a.balance, dueDate: a.dueDate, paymentCount: pays.body.paymentCount });
    }
  }

  load(true);
});
