/* staff-approvals page script (US-18): a team leader approves the reversal of a successful payment. Layout supplies the h1 and the role guard. */
Layout.ready(function (main) {
  'use strict';

  var el = UI.el;
  var leader = Auth.user();
  var selectedId = null;
  var filterText = '';
  var lastResult = null;

  var introMount = el('div');
  var listMount = el('div');
  var tableMount = el('div');
  var formMount = el('div');
  var resultMount = el('div');
  var historyMount = el('div');
  var filterInput = el('input', {
    class: 'input', type: 'search', id: 'approvals-filter', placeholder: 'Account number, name or payment reference',
    oninput: function (e) { filterText = e.target.value.trim().toLowerCase(); renderList(); }
  });

  function customerOf(id) { return Store.find('customers', id); }

  function customerLabel(c) { return c ? c.accountNo + ' - ' + c.name : 'Unknown customer'; }

  function userName(id) {
    var u = id ? Store.find('users', id) : null;
    return u ? u.name : (id || '');
  }

  // Reason codes from settings, as {value, label}.
  function reasonOptions() {
    var list = Services.setting('reversalReasonCodes', []);
    return (Array.isArray(list) ? list : []).map(function (c) {
      return typeof c === 'object' ? { value: c.code, label: c.code + ' - ' + c.label } : { value: c, label: c };
    });
  }

  function reasonLabel(code) {
    var found = reasonOptions().filter(function (o) { return o.value === code; })[0];
    return found ? found.label : code;
  }

  // Successful payments across all customers, newest first, narrowed by the search box.
  function approvablePayments() {
    return Store.filter('payments', function (p) { return p.status === 'success'; }).filter(function (p) {
      if (!filterText) { return true; }
      var c = customerOf(p.customerId);
      var hay = [c ? c.accountNo : '', c ? c.name : '', p.reference || ''].join(' ').toLowerCase();
      return hay.indexOf(filterText) >= 0;
    }).sort(function (a, b) { return String(b.at || b.date).localeCompare(String(a.at || a.date)); });
  }

  function renderIntro() {
    introMount.textContent = '';
    var role = leader ? leader.name : 'Team leader';
    introMount.appendChild(el('div', { class: 'notice notice--info' }, [
      'Signed in as ' + role + '. Only team leaders can approve a reversal. Every reversal needs a reason code, corrects the balance, ' +
      'is logged on the account and sends the customer a notification.'
    ]));
  }

  // Builds the panel once (so the search box keeps focus); later calls only redraw the table.
  function renderList() {
    if (!listMount.firstChild) {
      listMount.appendChild(UI.panel('1. Choose a payment', el('div', { class: 'stack' }, [
        el('div', { class: 'form-field' }, [el('label', { class: 'form-field__label', for: 'approvals-filter' }, ['Find a payment']), filterInput]),
        tableMount
      ]), {
        note: 'In a live system this list would come from the payments ledger, and the provider would be asked to refund the card through its API.'
      }));
    }
    var payments = approvablePayments();
    UI.table(tableMount, {
      columns: [
        { key: 'date', label: 'Date', format: function (v, p) { return Fmt.datetime(p.at || v); } },
        { key: 'customerId', label: 'Customer', format: function (v) { return customerLabel(customerOf(v)); } },
        { key: 'amount', label: 'Amount', format: function (v) { return Fmt.money(v); } },
        { key: 'channel', label: 'Channel' },
        { key: 'reference', label: 'Reference', format: function (v) { return el('span', { class: 'mono' }, [v || '']); } },
        {
          key: 'id', label: 'Action', format: function (v) {
            return v === selectedId
              ? UI.badge('Selected', 'ok')
              : el('button', { type: 'button', class: 'btn btn--small', onclick: function () { select(v); } }, ['Select']);
          }
        }
      ],
      rows: payments,
      empty: filterText ? 'No successful payments match your search.' : 'There are no successful payments to reverse.'
    });
  }

  function select(id) {
    selectedId = id;
    renderList();
    renderForm();
    formMount.scrollIntoView();
  }

  function kv(pairs) {
    var dl = el('dl', { class: 'kv' });
    pairs.forEach(function (p) { dl.appendChild(el('dt', null, [p[0]])); dl.appendChild(el('dd', null, [p[1]])); });
    return dl;
  }

  function renderForm() {
    formMount.textContent = '';
    var payment = selectedId ? Store.find('payments', selectedId) : null;
    if (!payment || payment.status !== 'success') {
      selectedId = null;
      formMount.appendChild(UI.panel('2. Approve the reversal', UI.emptyState('Select a payment above to review it.')));
      return;
    }
    var customer = customerOf(payment.customerId);
    var balance = customer ? Number(customer.balance) : 0;

    var form = el('form', { novalidate: true });
    form.appendChild(UI.field({
      label: 'Reason code', name: 'reasonCode', type: 'select', required: true,
      options: [{ value: '', label: 'Choose a reason code' }].concat(reasonOptions()),
      help: 'Required. The reason is recorded on the reversal, the audit trail and the account log.'
    }));
    form.appendChild(el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--danger' }, ['Approve reversal']),
      el('button', { type: 'button', class: 'btn', onclick: function () { selectedId = null; renderList(); renderForm(); } }, ['Cancel'])
    ]));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = UI.readForm(form);
      var err = Validate.required(values.reasonCode);
      if (err) { UI.showErrors(form, { reasonCode: 'Choose a reason code before approving.' }); return; }
      UI.showErrors(form, {});
      UI.confirm('Reverse payment ' + payment.reference + ' of ' + Fmt.money(payment.amount) + ' for ' + customerLabel(customer) +
        '? The balance will rise by the same amount and the customer will be told.', { title: 'Approve reversal', confirmLabel: 'Approve', danger: true })
        .then(function (ok) { if (ok) { approve(payment, customer, values.reasonCode, form); } });
    });

    formMount.appendChild(UI.panel('2. Approve the reversal', el('div', { class: 'stack' }, [
      kv([
        ['Customer', customerLabel(customer)],
        ['Payment reference', payment.reference || ''],
        ['Payment', Fmt.money(payment.amount) + ' on ' + Fmt.datetime(payment.at || payment.date) + ' (' + payment.channel + ')'],
        ['Balance now', Fmt.money(balance)],
        ['Balance after reversal', Fmt.money(balance + Number(payment.amount))]
      ]),
      form
    ])));
  }

  function approve(payment, customer, reasonCode, form) {
    if (!leader) { UI.showErrors(form, { _form: 'No team leader is signed in.' }); return; }
    var before = customer ? Number(customer.balance) : 0;
    var res = Services.reversePayment({ paymentId: payment.id, reasonCode: reasonCode, approverId: leader.id });
    if (!res.ok) { UI.showErrors(form, { _form: res.error || 'The reversal could not be approved.' }); return; }
    lastResult = { payment: res.payment, reversal: res.reversal, before: before, after: res.balance, customerId: payment.customerId };
    selectedId = null;
    UI.toast('Reversal approved for ' + payment.reference + '.', 'ok');
    renderList();
    renderForm();
    renderResult();
    renderHistory();
    resultMount.scrollIntoView();
  }

  function renderResult() {
    resultMount.textContent = '';
    if (!lastResult) { return; }
    var r = lastResult;
    var c = customerOf(r.customerId);
    var logs = Store.filter('logs', function (l) { return l.customerId === r.customerId && l.kind === 'reversal' && l.reference === r.payment.reference; });
    var log = logs.length ? logs[logs.length - 1] : null;
    var msgs = Store.filter('messages', function (m) { return m.customerId === r.customerId && m.kind === 'reversal'; });
    var msg = msgs.length ? msgs[msgs.length - 1] : null;
    var acct = c ? encodeURIComponent(c.accountNo) : '';

    resultMount.appendChild(UI.panel('3. Result', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--ok' }, ['Reversal approved by ' + (leader ? leader.name : 'a team leader') + ' at ' + Fmt.datetime(r.reversal.at) + '.']),
      kv([
        ['Customer', customerLabel(c)],
        ['Payment reversed', r.payment.reference + ' (' + Fmt.money(r.reversal.amount) + ')'],
        ['Reason code', reasonLabel(r.reversal.reasonCode)],
        ['Balance before', Fmt.money(r.before)],
        ['Corrected balance', Fmt.money(r.after)],
        ['Reversal record', r.reversal.id],
        ['Reversal log on the account', log ? log.id + ': ' + log.notes : 'Not found'],
        ['Customer notification', msg ? 'Sent by ' + msg.channel + ' (' + msg.status + '): ' + msg.subject : 'Not found']
      ]),
      el('div', { class: 'row' }, [
        el('a', { class: 'btn', href: 'outbox.html?acct=' + acct }, ['View the customer notification in the outbox']),
        el('a', { class: 'btn', href: 'staff-record.html?acct=' + acct }, ['Open the customer record'])
      ])
    ])));
  }

  function renderHistory() {
    var rows = Store.get('reversals').slice().sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    var body = el('div');
    UI.table(body, {
      columns: [
        { key: 'at', label: 'Approved', format: function (v) { return Fmt.datetime(v); } },
        { key: 'customerId', label: 'Customer', format: function (v) { return customerLabel(customerOf(v)); } },
        {
          key: 'paymentId', label: 'Payment', format: function (v) {
            var p = Store.find('payments', v);
            return p ? p.reference : v;
          }
        },
        { key: 'amount', label: 'Amount', format: function (v) { return Fmt.money(v); } },
        { key: 'reasonCode', label: 'Reason', format: function (v) { return reasonLabel(v); } },
        { key: 'approvedBy', label: 'Approved by', format: function (v) { return userName(v); } }
      ],
      rows: rows,
      empty: 'No reversals have been approved yet.'
    });
    historyMount.textContent = '';
    historyMount.appendChild(UI.panel('Reversals already approved', body));
  }

  renderIntro();
  renderList();
  renderForm();
  renderHistory();
  main.appendChild(el('div', { class: 'stack' }, [introMount, listMount, formMount, resultMount, historyMount]));
});
