/* api-demo page script: read-only data interface console (US-40). Requests go through ReadApi.request. */
(function () {
  'use strict';

  var el = UI.el;
  var STATUS_TEXT = { 200: 'OK', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed' };

  function custLabel(id) {
    var c = id ? Store.find('customers', id) : null;
    return c ? c.accountNo + ' - ' + c.name : (id || 'No session');
  }

  function idNum(id) { return parseInt(String(id).replace(/^.*-/, ''), 10) || 0; }

  Layout.ready(function (main) {
    var customers = Store.get('customers');
    var sessionField = UI.field({
      label: 'Act as customer', name: 'session', type: 'select',
      options: [{ value: '', label: 'No session (not signed in)' }].concat(customers.map(function (c) { return { value: c.id, label: c.accountNo + ' - ' + c.name }; })),
      value: customers.length ? customers[0].id : '',
      help: 'The interface only returns the record of the customer whose session sends the request. With no session every request is refused with 401.'
    });
    var sessionSelect = sessionField.querySelector('select');
    var methodField = UI.field({ label: 'Write method', name: 'method', type: 'select', options: ['POST', 'PUT'], value: 'PUT' });
    var methodSelect = methodField.querySelector('select');

    var resultMount = el('div', null, [UI.emptyState('Choose a customer, then press one of the request buttons.')]);
    var recentMount = el('div');

    function renderRecent() {
      var rows = Store.get('apiRequests').slice().sort(function (a, b) {
        var x = String(a.at || '');
        var y = String(b.at || '');
        return x < y ? 1 : (x > y ? -1 : idNum(b.id) - idNum(a.id));
      }).slice(0, 15);
      UI.table(recentMount, {
        columns: [
          { key: 'at', label: 'Time', format: function (v) { return Fmt.datetime(v); } },
          { key: 'sessionCustomerId', label: 'Session', format: function (v) { return custLabel(v); } },
          { key: 'method', label: 'Method' },
          { key: 'path', label: 'Path' },
          { key: 'status', label: 'Status', format: function (v) { return UI.badge(String(v), v === 200 ? 'ok' : 'warn'); } },
          { key: 'note', label: 'Note' }
        ],
        rows: rows,
        empty: 'No requests have been logged yet.'
      });
    }

    // Sends one request and shows the status and body; expectedWithSession is the status a signed-in customer should get.
    function send(method, path, expectedWithSession) {
      var sid = sessionSelect.value || null;
      var expected = sid ? expectedWithSession : 401;
      var res = ReadApi.request(method, path, { sessionCustomerId: sid });
      var notes = {
        200: 'Read-only: the record is returned but nothing can be changed through this interface.',
        403: 'Refused. The attempt was logged in the request table below and written to the audit trail.',
        405: 'Refused. This interface only accepts GET requests.',
        401: 'Refused. There is no customer session on this request.'
      };
      resultMount.textContent = '';
      resultMount.appendChild(UI.panel('Response', el('div', { class: 'stack' }, [
        el('p', { class: 'mono' }, [method + ' ' + path + (sid ? ' as ' + custLabel(sid) : ' with no session')]),
        el('p', null, [
          'Status: ', UI.badge(res.status + ' ' + (STATUS_TEXT[res.status] || ''), res.status === 200 ? 'ok' : 'warn'),
          ' Expected ' + expected + ': ', res.status === expected ? UI.badge('As expected', 'ok') : UI.badge('Unexpected', 'error')
        ]),
        notes[res.status] ? el('p', { class: 'muted' }, [notes[res.status]]) : null,
        el('div', { class: 'table-wrap' }, [el('pre', { class: 'mono', tabindex: '0' }, [JSON.stringify(res.body, null, 2)])])
      ])));
      renderRecent();
    }

    function sendOwn() { send('GET', '/api/me/account', 200); }

    function sendOther() {
      var sid = sessionSelect.value;
      var other = customers.filter(function (c) { return c.id !== sid; })[0];
      if (!other) { UI.toast('There is no other customer to request.', 'warn'); return; }
      send('GET', '/api/customers/' + other.id, 403);
    }

    function sendWrite() { send(methodSelect.value, '/api/me/account', 405); }

    main.appendChild(el('div', { class: 'stack' }, [
      UI.panel('Request console', el('div', { class: 'stack' }, [
        sessionField,
        el('div', { class: 'row' }, [
          el('button', { type: 'button', class: 'btn btn--primary', onclick: sendOwn }, ['GET own record']),
          el('button', { type: 'button', class: 'btn', onclick: sendOther }, ['GET another customer\'s record'])
        ]),
        el('div', { class: 'row' }, [
          methodField,
          el('button', { type: 'button', class: 'btn', onclick: sendWrite }, ['Send write attempt'])
        ])
      ]), { note: 'The customer portal would call a read-only API in front of a replica of the database. The session token identifies the customer, so the API can only ever return that customer\'s own record, and it has no write routes.' }),
      resultMount,
      UI.panel('Recent requests', recentMount),
      UI.panel('Related report', el('p', null, [el('a', { href: 'reports.html?r=security-status' }, ['Security status report']), ' (role access tests, encryption and backup evidence, unauthorised access log).']))
    ]));

    renderRecent();
  });
})();
