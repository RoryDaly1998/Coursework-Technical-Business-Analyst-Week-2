/*
 * portal.js: Portal (shared customer-portal helpers). Loads after layout.js, before assets/js/pages/<pageId>.js.
 * Depends on Clock, Store, Auth, Fmt, UI, Services, PAGES.
 *
 * Portal.REP_PHONE                      rep contact number (same number the Services message texts use)
 * Portal.firstName(customer)            'Alex'
 * Portal.current()                      the verified customer record, or null
 * Portal.byAcct(acctOrId)               customer by account number or id, or null
 * Portal.promiseWindow()                {min, max} days from today (Services.promiseWindow, the rule Services.createPromise applies)
 * Portal.promisePlans()                 permitted percentages of the balance, e.g. [100, 50, 25]
 * Portal.settingNode(key)               'TBD (demo: n)' node for a TBD setting, else its plain value
 * Portal.dueText(isoDate)               'due in 3 days' | 'due today' | '2 days overdue'
 * Portal.balancePanel({balance, dueDate, originalBalance})  "Balance summary" panel
 * Portal.repContactPanel({title, lead}) rep contact route panel
 * Portal.statusBadge(paymentStatus)     badge for success | failed | reversed
 * Portal.channelLabel(channel)          'Online' | 'Phone' | 'Bank transfer'
 * Portal.newKey()                       idempotency key (letters only, so it can never look like a card number)
 * Portal.messageHref(message, link)     safe href for a message link, or null if it is not an existing page
 */
(function () {
  'use strict';

  var el = UI.el;

  function r2(n) { return Math.round((Number(n) + 1e-9) * 100) / 100; }

  function firstName(c) {
    return String((c && c.name) || '').trim().split(/\s+/)[0] || 'there';
  }

  function current() {
    var id = Auth.verifiedCustomer();
    return id ? Store.find('customers', id) : null;
  }

  function byAcct(value) {
    var a = String(value === null || value === undefined ? '' : value).trim();
    if (!a) { return null; }
    return Store.find('customers', function (c) { return String(c.accountNo) === a || c.id === a; });
  }

  function promisePlans() {
    var v = Services.setting('promisePlans', null);
    var plans = (Array.isArray(v) ? v : []).map(Number).filter(function (n) { return isFinite(n) && n > 0 && n <= 100; });
    return plans.length ? plans : [100, 50, 25];
  }

  function settingNode(key) {
    var s = Store.settings()[key] || {};
    var v = Services.setting(key);
    return s.tbd ? UI.tbd(s.label || key, v) : String(v === null ? '' : v);
  }

  function dueText(dueDate) {
    var d = Clock.diffDays(Clock.today(), dueDate);
    if (d === null) { return ''; }
    if (d === 0) { return 'due today'; }
    if (d > 0) { return 'due in ' + d + (d === 1 ? ' day' : ' days'); }
    return Math.abs(d) + (d === -1 ? ' day' : ' days') + ' overdue';
  }

  function balancePanel(info) {
    var balance = Number(info.balance) || 0;
    var items = [
      { label: 'Current balance', value: Fmt.money(balance), kind: balance <= 0 ? 'ok' : null, note: balance <= 0 ? 'Nothing to pay' : null },
      { label: 'Due date', value: Fmt.date(info.dueDate), note: balance > 0 ? dueText(info.dueDate) : 'No payment needed' }
    ];
    if (typeof info.originalBalance === 'number') {
      items.push({
        label: 'Paid so far', value: Fmt.money(Math.max(0, r2(info.originalBalance - balance))),
        note: 'of ' + Fmt.money(info.originalBalance) + ' originally owed'
      });
    }
    return UI.panel('Balance summary', UI.statCards(items));
  }

  function repContactPanel(opts) {
    var o = opts || {};
    return UI.panel(o.title || 'Talk to a collections rep', el('div', null, [
      el('p', null, [o.lead || 'A rep can take a payment, agree a plan or check your account with you.']),
      el('dl', { class: 'kv' }, [
        el('dt', null, ['Phone']), el('dd', { class: 'mono' }, [Services.REP_CONTACT_PHONE]),
        el('dt', null, ['Opening hours']), el('dd', null, [UI.tbd('Rep contact hours', 'Mon-Fri 08:00-18:00')])
      ]),
      el('p', { class: 'muted' }, ['This route is always available, including when online access is paused. A rep will verify you by phone first.'])
    ]));
  }

  function statusBadge(status) {
    if (status === 'success') { return UI.badge('Received', 'ok'); }
    if (status === 'failed') { return UI.badge('Failed', 'error'); }
    if (status === 'reversed') { return UI.badge('Reversed', 'warn'); }
    return UI.badge(String(status || 'Unknown'));
  }

  function channelLabel(channel) {
    return { portal: 'Online', phone: 'Phone', bank: 'Bank transfer' }[channel] || String(channel || '');
  }

  function newKey() {
    var chars = 'abcdefghijklmnopqrstuvwxyz';
    var out = '';
    for (var i = 0; i < 16; i++) { out += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return 'idem-' + out;
  }

  // Relative links to pages in PAGES only; a preferences link without a token gets the customer's ?t= link so it works without sign-in.
  function messageHref(message, link) {
    var raw = String((link && link.href) || '');
    var m = /^([A-Za-z0-9_\-]+\.html)(?:[?#].*)?$/.exec(raw);
    if (!m) { return null; }
    var page = null;
    window.PAGES.forEach(function (p) { if (p.file.split('?')[0] === m[1]) { page = p; } });
    if (!page) { return null; }
    if (page.id === 'portal-preferences' && !/[?&]t=/.test(raw)) {
      var c = Store.find('customers', message.customerId);
      if (c) { return Services.preferencesLink(c); }
    }
    return raw;
  }

  window.Portal = {
    REP_PHONE: Services.REP_CONTACT_PHONE,
    firstName: firstName,
    current: current,
    byAcct: byAcct,
    promiseWindow: Services.promiseWindow,
    promisePlans: promisePlans,
    settingNode: settingNode,
    dueText: dueText,
    balancePanel: balancePanel,
    repContactPanel: repContactPanel,
    statusBadge: statusBadge,
    channelLabel: channelLabel,
    newKey: newKey,
    messageHref: messageHref
  };
})();
