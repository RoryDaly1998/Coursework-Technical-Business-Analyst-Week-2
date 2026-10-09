/* outbox: simulated mailbox. Accessible to verified customers (own messages) and IT role (delivery telemetry). US-13, US-28, US-36, US-45, US-48, US-49. */
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;
  var role = Auth.role();
  var isStaff = role !== 'customer';
  var isIT = role === 'it';
  var ownerId = isStaff ? null : Auth.verifiedCustomer();
  var customers = Store.get('customers').slice().sort(function (a, b) { return String(a.accountNo).localeCompare(String(b.accountNo)); });
  var filterId = '';
  var unknownAcct = false;

  var KIND_LABELS = {
    reminder: 'Payment reminder', 'payment-confirmation': 'Payment confirmation', 'promise-confirmation': 'Promise confirmation',
    'missing-payment': 'Missing payment', 'previous-contact': 'Details changed',
    reversal: 'Payment reversed'
  };

  if (isStaff && UI.query('acct')) {
    var wanted = Portal.byAcct(UI.query('acct'));
    if (wanted) { filterId = wanted.id; } else { unknownAcct = true; }
  }

  function idNum(id) { return parseInt(String(id).replace(/^.*-/, ''), 10) || 0; }

  function statusBadge(status) {
    if (status === 'delivered') { return UI.badge('Delivered', 'ok'); }
    if (status === 'bounced') { return UI.badge('Bounced', 'warn'); }
    if (status === 'failed') { return UI.badge('Failed', 'error'); }
    return UI.badge('Sent');
  }

  function templateText(m) {
    var t = m.templateId ? Store.find('templates', m.templateId) : null;
    return t ? t.name + ' (version ' + t.version + ')' : 'No template';
  }

  function linksRow(m) {
    if (isStaff) {
      // Message links open customer-only pages, so staff see the labels as plain text.
      var labels = (m.links || []).map(function (l) { return l.label; });
      return labels.length ? el('p', { class: 'muted' }, ['Links in this message: ' + labels.join(', ') + '.']) : null;
    }
    var anchors = [];
    (m.links || []).forEach(function (l) {
      var href = Portal.messageHref(m, l);
      anchors.push(href
        ? el('a', { class: 'btn btn--small', href: href }, [l.label])
        : el('span', { class: 'muted' }, [l.label + ' (link not available)']));
    });
    return anchors.length ? el('div', { class: 'row' }, [el('strong', null, ['Links:'])].concat(anchors)) : null;
  }

  function messageCard(m) {
    var c = Store.find('customers', m.customerId);
    var channelText = m.channel === 'sms' ? 'Text message' : 'Email';
    var undelivered = m.status === 'bounced' || m.status === 'failed';
    if (isIT) {
      return UI.panel(KIND_LABELS[m.kind] || m.kind || 'Message', el('div', { class: 'stack' }, [
        el('div', { class: 'row' }, [UI.badge(channelText), statusBadge(m.status)]),
        el('dl', { class: 'kv' }, [
          el('dt', null, ['Sent']), el('dd', null, [Fmt.datetime(m.at)]),
          el('dt', null, ['To (masked)']), el('dd', { class: 'mono' }, [m.to ? Fmt.mask(m.to) : 'No address on record']),
          el('dt', null, ['Account']), el('dd', { class: 'mono' }, [c ? c.accountNo : m.customerId]),
          el('dt', null, ['Kind']), el('dd', null, [KIND_LABELS[m.kind] || m.kind || 'Message']),
          el('dt', null, ['Template']), el('dd', null, [templateText(m)]),
          el('dt', null, ['Status']), el('dd', null, [m.status || 'sent'])
        ])
      ]));
    }
    return UI.panel(m.subject || channelText, el('div', { class: 'stack' }, [
      el('div', { class: 'row' }, [
        UI.badge(channelText), statusBadge(m.status),
        el('span', { class: 'muted mono' }, [KIND_LABELS[m.kind] || m.kind || 'Message'])
      ]),
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Sent']), el('dd', null, [Fmt.datetime(m.at)]),
        el('dt', null, ['To']), el('dd', null, [m.to || 'No address on record'])
      ]),
      el('p', null, [m.body]),
      undelivered ? el('div', { class: 'notice notice--warn' }, [m.status === 'bounced' ? 'This message bounced: the address does not accept mail.' : 'This message could not be delivered.']) : null,
      linksRow(m)
    ]));
  }

  function visibleMessages() {
    var rows = Store.filter('messages', function (m) {
      if (!isStaff) { return m.customerId === ownerId; }
      return !filterId || m.customerId === filterId;
    });
    rows.sort(function (a, b) {
      var byTime = String(b.at).localeCompare(String(a.at));
      return byTime || idNum(b.id) - idNum(a.id);
    });
    return rows;
  }

  var listHolder = el('div', { class: 'stack' });

  function renderList() {
    var rows = visibleMessages();
    listHolder.textContent = '';
    listHolder.appendChild(el('p', { class: 'muted', 'aria-live': 'polite' }, [rows.length + (rows.length === 1 ? ' message' : ' messages')]));
    if (!rows.length) {
      listHolder.appendChild(UI.emptyState(isStaff ? 'No messages for this selection.' : 'You have no messages yet. Confirmations and reminders will appear here.'));
      return;
    }
    rows.forEach(function (m) { listHolder.appendChild(messageCard(m)); });
  }

  var parts = [];
  parts.push(el('div', { class: 'notice notice--info' }, [
    isIT
      ? 'IT sees delivery details only: masked address, status, kind and template. The message text is not shown.'
      : 'These are the messages we have sent to you.'
  ]));

  if (isStaff) {
    if (unknownAcct) { parts.push(el('div', { class: 'notice notice--warn', role: 'alert' }, ['No customer matches that account number, so all messages are shown.'])); }
    var select = el('select', {
      class: 'select', name: 'customer', onchange: function (e) { filterId = e.target.value; renderList(); }
    }, [el('option', { value: '' }, ['All customers'])].concat(customers.map(function (c) {
      return el('option', { value: c.id, selected: c.id === filterId }, ['Account ' + c.accountNo]);
    })));
    parts.push(el('div', { class: 'row' }, [el('label', { class: 'demo-control' }, [el('span', null, ['Customer']), select])]));
  }

  parts.push(listHolder);
  parts.push(UI.howItWorks('Messages go out through an email and SMS provider, which reports delivery back (delivered, bounced, failed). A customer can only ever read messages addressed to them; IT sees delivery status and telemetry, while staff roles manage cases through the customer record.'));
  main.appendChild(el('div', { class: 'stack' }, parts));
  renderList();
});
