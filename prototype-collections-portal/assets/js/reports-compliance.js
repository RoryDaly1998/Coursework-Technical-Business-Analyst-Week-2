/*
 * reports-compliance.js: Compliance report definitions (US-04, 10, 17, 22, 33, 39, 42, 47) registered with Reports.register.
 * Helpers are repeated in each reports-*.js file on purpose: the files are owned by different chunks and share no globals.
 */
(function () {
  'use strict';

  var el = UI.el;
  var SAMPLE_SIZE = 20;

  // ---------- helpers ----------

  function cents(n) { return Math.round((Number(n) || 0) * 100); }
  function day(iso) { return String(iso || '').slice(0, 10); }

  function inRange(iso, from, to) {
    var d = day(iso);
    if (from && d < from) { return false; }
    if (to && d > to) { return false; }
    return true;
  }

  function byDesc(key) {
    return function (a, b) {
      var x = String(a[key] || '');
      var y = String(b[key] || '');
      return x < y ? 1 : (x > y ? -1 : 0);
    };
  }

  function custLabel(id) {
    var c = id ? Store.find('customers', id) : null;
    return c ? c.accountNo + ' - ' + c.name : (id || '');
  }

  function userName(id) {
    var u = id ? Store.find('users', id) : null;
    return u ? u.name : (id || '');
  }

  // Audit before/after values are objects; shown as key=value pairs.
  function describe(v) {
    if (v === null || v === undefined) { return ''; }
    return Object.keys(v).map(function (k) {
      var x = v[k];
      return k + '=' + (x !== null && typeof x === 'object' ? JSON.stringify(x) : String(x));
    }).join('; ');
  }

  function tbdSetting(key, suffix) {
    var s = Store.settings()[key] || {};
    var v = Services.setting(key, null);
    var text = v === null ? null : (suffix ? v + ' ' + suffix : String(v));
    if (s.tbd) { return UI.tbd(s.label || key, text); }
    return text === null ? 'Not set' : text;
  }

  function simpleTable(columns, rows, empty) {
    var mount = el('div');
    UI.table(mount, { columns: columns, rows: rows, empty: empty });
    return mount;
  }

  // ---------- US-04, US-39, US-47 audit trail ----------

  function auditRows(f) {
    var needle = (f.user || '').toLowerCase();
    return Store.get('audit').filter(function (a) {
      return (!f.customer || a.customerId === f.customer) &&
        (!needle || (String(a.userId || '') + ' ' + String(a.userLabel || '')).toLowerCase().indexOf(needle) >= 0) &&
        (!f.entity || a.entity === f.entity) && (!f.channel || a.channel === f.channel) && inRange(a.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (a) {
      var p = a.entity === 'promise' && a.entityId ? Store.find('promises', String(a.entityId)) : null;
      return {
        id: a.id, at: a.at, userLabel: a.userLabel || '', userId: a.userId || '', channel: a.channel || '', entity: a.entity || '',
        entityId: a.entityId === null || a.entityId === undefined ? '' : String(a.entityId), customer: custLabel(a.customerId),
        action: a.action || '', before: describe(a.before), after: describe(a.after), note: a.note || '',
        promiseStatus: p ? p.status : '',
        promiseRecord: p ? 'Customer ' + p.customerId + '; ' + Fmt.money(p.amount) + ' due ' + Fmt.date(p.dueDate) + '; made ' + Fmt.datetime(p.createdAt) + '; identity check: ' + (p.verificationResult || 'none') : ''
      };
    });
  }

  var PROMISE_EXPORT = [
    { key: 'id', label: 'Promise ID' }, { key: 'reference', label: 'Reference' }, { key: 'customerId', label: 'Customer ID' },
    { key: 'accountNo', label: 'Account number' }, { key: 'verificationResult', label: 'Verification result' },
    { key: 'createdAt', label: 'Created at' }, { key: 'amount', label: 'Amount' }, { key: 'dueDate', label: 'Due date' },
    { key: 'source', label: 'Source' }, { key: 'status', label: 'Status' }, { key: 'supersedes', label: 'Supersedes' },
    { key: 'supersededBy', label: 'Superseded by' }, { key: 'auditEntries', label: 'Audit entries' }, { key: 'auditTrail', label: 'Audit trail' }
  ];

  // Every promise record (any status) joined with its audit entries, for the filtered customer and dates.
  function promiseExportRows(f) {
    var audit = Store.get('audit');
    return Store.get('promises').filter(function (p) {
      return (!f.customer || p.customerId === f.customer) && inRange(p.createdAt, f.from, f.to);
    }).sort(function (a, b) { return String(a.createdAt) < String(b.createdAt) ? -1 : 1; }).map(function (p) {
      var c = Store.find('customers', p.customerId);
      var hits = audit.filter(function (a) { return a.entity === 'promise' && a.entityId === p.id; }).sort(function (a, b) { return String(a.at) < String(b.at) ? -1 : 1; });
      return {
        id: p.id, reference: p.reference || '', customerId: p.customerId, accountNo: c ? c.accountNo : '', verificationResult: p.verificationResult || '',
        createdAt: p.createdAt, amount: p.amount, dueDate: p.dueDate, source: p.source || '', status: p.status, supersedes: p.supersedes || '',
        supersededBy: p.supersededBy || '', auditEntries: hits.length,
        auditTrail: hits.map(function (a) { return a.at + ' ' + (a.userLabel || a.userId) + ' ' + a.action + ' [' + describe(a.before) + ' -> ' + describe(a.after) + ']'; }).join(' | ')
      };
    });
  }

  Reports.register({
    id: 'audit-trail',
    title: 'Audit trail',
    stories: ['US-04', 'US-39', 'US-47'],
    description: 'Every recorded change with who, when and before/after values. Read-only: audit entries are append-only in this prototype.',
    // Entity options come from the entities found in the live audit data.
    get filters() {
      var entities = [];
      Store.get('audit').forEach(function (a) { if (a.entity && entities.indexOf(a.entity) < 0) { entities.push(a.entity); } });
      return [
        { key: 'customer', label: 'Customer', type: 'customer' },
        { key: 'user', label: 'User (name or ID)', type: 'text' },
        { key: 'entity', label: 'Entity', type: 'select', options: entities.sort() },
        { key: 'channel', label: 'Channel', type: 'select', options: ['portal', 'staff', 'system'] },
        { key: 'from', label: 'Date from', type: 'date-from' },
        { key: 'to', label: 'Date to', type: 'date-to' }
      ];
    },
    columns: [
      { key: 'at', label: 'Timestamp', format: function (v) { return Fmt.datetime(v); } },
      { key: 'userLabel', label: 'User' },
      { key: 'userId', label: 'User ID' },
      { key: 'channel', label: 'Channel' },
      { key: 'entity', label: 'Entity' },
      { key: 'entityId', label: 'Record' },
      { key: 'customer', label: 'Customer' },
      { key: 'action', label: 'Action' },
      { key: 'before', label: 'Before' },
      { key: 'after', label: 'After' },
      { key: 'note', label: 'Note' },
      { key: 'promiseStatus', label: 'Promise status', format: function (v) { return v === 'Superseded' ? UI.badge('Superseded', 'warn') : (v || ''); } },
      { key: 'promiseRecord', label: 'Promise evidence' }
    ],
    rows: function (f) { return auditRows(f); },
    summary: function (rows) {
      var users = {};
      rows.forEach(function (r) { users[r.userId] = true; });
      return [
        { label: 'Audit entries', value: rows.length },
        { label: 'Users', value: Object.keys(users).length },
        { label: 'Promise entries', value: rows.filter(function (r) { return r.entity === 'promise'; }).length },
        { label: 'Superseded promises', value: rows.filter(function (r) { return r.promiseStatus === 'Superseded'; }).length }
      ];
    },
    panel: function () {
      return UI.panel('Evidence rules', el('div', { class: 'stack' }, [
        el('div', { class: 'notice notice--info' }, ['This view is read-only. In this prototype audit entries are append-only: there is no edit or delete control and the code refuses changes. A real system would enforce this at database level.']),
        el('p', null, ['Retention period: ', tbdSetting('retentionYears', 'years'), '.']),
        el('p', { class: 'muted' }, ['Use the Promise entity filter to see promises with the verified identity, timestamp, amount and date. A promise that has been replaced shows "Superseded". Use the Portal channel filter to see customer-made changes with previous and new values.'])
      ]), { note: 'The audit store would be an append-only table: the application database role has insert and select rights only, so even administrators cannot change an entry through the application.' });
    },
    actions: [{
      label: 'Export promises with audit trail (CSV)',
      run: function (rows, ctx) {
        var list = promiseExportRows(ctx.filters);
        if (!list.length) { throw new Error('No promises match these filters.'); }
        UI.download('promises-audit-trail-' + Clock.today() + '.csv', UI.toCSV(PROMISE_EXPORT, list), 'text/csv;charset=utf-8');
        return 'Promise export downloaded (' + list.length + ' promises).';
      }
    }]
  });

  // ---------- US-10 log export ----------

  function logRows(f) {
    var audit = Store.get('audit');
    return Store.get('logs').filter(function (l) {
      return (!f.customer || l.customerId === f.customer) && inRange(l.date || l.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (l) {
      // Audit entries are linked by log id (every log is audited when it is written).
      var hits = audit.filter(function (a) { return a.entity === 'log' && a.entityId === l.id; });
      hits = hits.slice().sort(function (a, b) { return String(a.at) < String(b.at) ? -1 : 1; });
      var c = Store.find('customers', l.customerId);
      return {
        id: l.id, customerId: l.customerId, accountNo: c ? c.accountNo : '', kind: l.kind, at: l.at, date: l.date, method: l.method || '',
        outcomeCode: l.outcomeCode || '', amount: l.amount, promiseAmount: l.promiseAmount, promiseDate: l.promiseDate || '',
        nextAction: l.nextAction || '', notes: l.notes || '', repId: l.repId || '', team: l.team || '', channel: l.channel || '',
        reference: l.reference || '', templateId: l.templateId || '', overrideReason: l.overrideReason || '',
        auditUser: hits.length ? (hits[0].userLabel || hits[0].userId) : '', auditAt: hits.length ? hits[0].at : '',
        auditAction: hits.map(function (h) { return h.action; }).join(', '),
        auditChange: hits.map(function (h) { return h.action + ': ' + describe(h.before) + ' -> ' + describe(h.after); }).join(' | '),
        auditEntries: hits.length
      };
    });
  }

  function moneyCell(v) { return Fmt.money(v); }
  function dateCell(v) { return Fmt.date(v); }

  Reports.register({
    id: 'log-export',
    title: 'Interaction log export',
    stories: ['US-10'],
    description: 'Case log entries with every form field and the audit trail for each entry, filtered by customer or date range.',
    filters: [
      { key: 'customer', label: 'Customer', type: 'customer' },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: [
      { key: 'id', label: 'Log ID' },
      { key: 'customerId', label: 'Customer ID' },
      { key: 'accountNo', label: 'Account' },
      { key: 'kind', label: 'Kind' },
      { key: 'at', label: 'Logged at', format: function (v) { return Fmt.datetime(v); } },
      { key: 'date', label: 'Date', format: dateCell },
      { key: 'method', label: 'Contact method' },
      { key: 'outcomeCode', label: 'Outcome code' },
      { key: 'amount', label: 'Amount', format: moneyCell },
      { key: 'promiseAmount', label: 'Promise amount', format: moneyCell },
      { key: 'promiseDate', label: 'Promise date', format: dateCell },
      { key: 'nextAction', label: 'Next action' },
      { key: 'notes', label: 'Notes' },
      { key: 'repId', label: 'Rep ID' },
      { key: 'team', label: 'Team' },
      { key: 'channel', label: 'Channel' },
      { key: 'reference', label: 'Reference' },
      { key: 'templateId', label: 'Template' },
      { key: 'overrideReason', label: 'Override reason' },
      { key: 'auditUser', label: 'Audit: user', format: function (v) { return v || 'No audit entry found'; } },
      { key: 'auditAt', label: 'Audit: timestamp', format: function (v) { return v ? Fmt.datetime(v) : ''; } },
      { key: 'auditAction', label: 'Audit: action' },
      { key: 'auditChange', label: 'Audit: before and after' },
      { key: 'auditEntries', label: 'Audit entries' }
    ],
    rows: function (f) { return logRows(f); },
    summary: function (rows) {
      var customers = {};
      rows.forEach(function (r) { customers[r.customerId] = true; });
      var withAudit = rows.filter(function (r) { return r.auditEntries > 0; }).length;
      return [
        { label: 'Log entries', value: rows.length },
        { label: 'With audit trail', value: withAudit + ' of ' + rows.length, kind: withAudit === rows.length ? 'ok' : 'warn' },
        { label: 'Customers', value: Object.keys(customers).length }
      ];
    },
    panel: function (ctx) {
      var n = logRows(ctx.filters).length;
      return UI.panel('Export targets', el('div', { class: 'stack' }, [
        el('p', null, ['This export holds ' + n + (n === 1 ? ' entry' : ' entries') + '. A standard export of up to ', UI.tbd('Records in a standard export (n)', 'n records'),
          ' completes within ', UI.tbd('Minutes for a standard export (m)', 'm minutes'), '.']),
        el('p', { class: 'muted' }, ['"Export CSV" downloads a file with every column below. "Export PDF" opens a print view stub: use the browser\'s Print > Save as PDF. ' +
          'The audit columns come from the audit entry for the same log record.'])
      ]), { note: 'A live export would run as a background job for large date ranges and notify Compliance when the file is ready, then keep the download in the audit store for the retention period.' });
    }
  });

  // ---------- US-22 verification log ----------

  function verificationRows(f) {
    var acct = (f.account || '').toLowerCase();
    return Store.get('verifications').filter(function (v) {
      return (!f.customer || v.customerId === f.customer) && (!f.method || v.method === f.method) && (!f.outcome || v.outcome === f.outcome) &&
        (!acct || String(v.accountNo || '').toLowerCase().indexOf(acct) >= 0) && inRange(v.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (v) {
      return {
        id: v.id, customerId: v.customerId || '', customer: v.customerId ? custLabel(v.customerId) : 'Unknown account', accountNo: v.accountNo || '',
        at: v.at, method: v.method, outcome: v.outcome,
        by: v.method === 'phone' ? userName(v.actorId) : 'Customer (portal)'
      };
    });
  }

  Reports.register({
    id: 'verification-log',
    title: 'Verification log',
    stories: ['US-22'],
    description: 'Every identity verification attempt with customer ID, time, method and outcome. Secrets are never stored or shown.',
    filters: [
      { key: 'customer', label: 'Customer', type: 'customer' },
      { key: 'account', label: 'Account number entered', type: 'text' },
      { key: 'method', label: 'Method', type: 'select', options: ['portal', 'phone'] },
      { key: 'outcome', label: 'Outcome', type: 'select', options: ['Verified', 'Not verified', 'Locked'] },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: [
      { key: 'id', label: 'Attempt' },
      { key: 'customerId', label: 'Customer ID', format: function (v) { return v || 'Unknown'; } },
      { key: 'customer', label: 'Customer' },
      { key: 'accountNo', label: 'Account number entered' },
      { key: 'at', label: 'Time', format: function (v) { return Fmt.datetime(v); } },
      { key: 'method', label: 'Method' },
      { key: 'outcome', label: 'Outcome', format: function (v) { return UI.badge(v, v === 'Verified' ? 'ok' : (v === 'Locked' ? 'error' : 'warn')); } },
      { key: 'by', label: 'Checked by' }
    ],
    rows: function (f) { return verificationRows(f); },
    summary: function (rows) {
      function n(o) { return rows.filter(function (r) { return r.outcome === o; }).length; }
      return [
        { label: 'Attempts', value: rows.length },
        { label: 'Verified', value: n('Verified') },
        { label: 'Not verified', value: n('Not verified'), kind: n('Not verified') ? 'warn' : null },
        { label: 'Locked', value: n('Locked'), kind: n('Locked') ? 'warn' : null }
      ];
    },
    panel: function () {
      return UI.panel('What is recorded', el('div', { class: 'stack' }, [
        el('div', { class: 'notice notice--info' }, ['Only the outcome is logged. Dates of birth, postcodes and any other answers are never stored, so they cannot appear here.']),
        el('p', null, ['Retention period: ', tbdSetting('retentionYears', 'years'), '.'])
      ]), { note: 'The verification service would return only a pass or fail result to the application and write one log row per attempt, with no answers, to the append-only audit store.' });
    }
  });

  // ---------- US-17 payment audit ----------

  function paymentRows(f) {
    var audit = Store.get('audit');
    return Store.get('payments').filter(function (p) {
      return (!f.customer || p.customerId === f.customer) && (!f.result || p.status === f.result) && inRange(p.at || p.date, f.from, f.to);
    }).sort(byDesc('at')).map(function (p) {
      var hits = audit.filter(function (a) { return a.entity === 'payment' && a.entityId === p.id; });
      return {
        id: p.id, reference: p.reference || '', customer: custLabel(p.customerId), amount: p.amount, at: p.at || p.date, channel: p.channel,
        result: p.status + (p.reasonCategory ? ' (' + p.reasonCategory + ')' : ''), status: p.status,
        token: p.providerToken ? Fmt.mask(p.providerToken, 4) : '', audit: hits.length ? hits.map(function (a) { return a.id; }).join(', ') : 'None found', auditCount: hits.length
      };
    });
  }

  function scanOutput() {
    var matches = Services.scanForCardData();
    var at = Fmt.datetime(Clock.now());
    if (!matches.length) {
      return el('div', { class: 'notice notice--ok' }, [el('strong', null, ['0 matches. ']), 'Card data scan finished at ' + at + '. No card numbers were found in any stored collection.']);
    }
    return el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--error' }, [el('strong', null, [matches.length + ' possible card number' + (matches.length === 1 ? '' : 's') + ' found. ']), 'Scan finished at ' + at + '. Only the last four digits are shown.']),
      simpleTable([
        { key: 'collection', label: 'Collection' }, { key: 'id', label: 'Record' }, { key: 'path', label: 'Field' }, { key: 'sample', label: 'Sample (last 4 digits)' }
      ], matches, 'No matches.')
    ]);
  }

  Reports.register({
    id: 'payment-audit',
    title: 'Payment audit',
    stories: ['US-17'],
    description: 'Each payment transaction with customer, amount, time and result, plus a scan confirming no card data is stored.',
    filters: [
      { key: 'customer', label: 'Customer', type: 'customer' },
      { key: 'result', label: 'Result', type: 'select', options: ['success', 'failed', 'reversed'] },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: [
      { key: 'reference', label: 'Reference' },
      { key: 'id', label: 'Transaction' },
      { key: 'customer', label: 'Customer' },
      { key: 'amount', label: 'Amount', format: moneyCell },
      { key: 'at', label: 'Time', format: function (v) { return Fmt.datetime(v); } },
      { key: 'channel', label: 'Channel' },
      { key: 'result', label: 'Result', format: function (v, row) { return UI.badge(v, row.status === 'success' ? 'ok' : (row.status === 'failed' ? 'error' : 'warn')); } },
      { key: 'token', label: 'Provider token' },
      { key: 'audit', label: 'Audit entry' }
    ],
    rows: function (f) { return paymentRows(f); },
    summary: function (rows) {
      var ok = rows.filter(function (r) { return r.status === 'success'; });
      var covered = rows.filter(function (r) { return r.auditCount > 0; }).length;
      return [
        { label: 'Transactions', value: rows.length },
        { label: 'Successful value', value: Fmt.money(ok.reduce(function (t, r) { return t + (Number(r.amount) || 0); }, 0)), note: ok.length + ' successful' },
        { label: 'Failed', value: rows.filter(function (r) { return r.status === 'failed'; }).length },
        { label: 'With an audit entry', value: covered + ' of ' + rows.length, kind: covered === rows.length ? 'ok' : 'warn' }
      ];
    },
    panel: function () {
      return UI.panel('Card data handling', el('div', { class: 'stack' }, [
        el('p', null, ['Card details are entered only in the payment provider\'s hosted form. This system stores a provider token and the result, nothing else. Use "Scan for card data" to check every stored collection for card-like numbers.'])
      ]), { note: 'A compliance review would combine this scan with the provider\'s PCI DSS certificate and a data-loss-prevention scan of the production databases and logs.' });
    },
    actions: [{ label: 'Scan for card data', run: function () { return scanOutput(); } }]
  });

  // ---------- US-42 display sampling ----------

  var CHECKED_FIELDS = [
    { key: 'balance', label: 'balance', money: true },
    { key: 'dueDate', label: 'due date' },
    { key: 'paymentCount', label: 'payment count' }
  ];

  function sameValue(field, a, b) {
    return field.money ? cents(a) === cents(b) : String(a === undefined ? '' : a) === String(b === undefined ? '' : b);
  }

  function isReported(viewId) {
    return Store.get('alerts').some(function (a) { return a.type === 'display-mismatch' && String(a.detail || '').indexOf(viewId + ' ') >= 0; });
  }

  function viewRows(f) {
    return Store.get('accountViews').filter(function (v) {
      return (!f.customer || v.customerId === f.customer) && inRange(v.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (v) {
      var d = v.displayed || {};
      var s = v.source || {};
      var bad = CHECKED_FIELDS.filter(function (fld) { return !sameValue(fld, d[fld.key], s[fld.key]); });
      return {
        id: v.id, customerId: v.customerId, customer: custLabel(v.customerId), at: v.at,
        displayedBalance: d.balance, sourceBalance: s.balance, displayedDue: d.dueDate, sourceDue: s.dueDate,
        displayedCount: d.paymentCount, sourceCount: s.paymentCount,
        result: bad.length ? 'Mismatch' : 'Match', fields: bad.map(function (x) { return x.label; }).join(', '),
        detail: bad.map(function (x) {
          var show = x.money ? Fmt.money : function (z) { return z === undefined || z === null ? 'none' : String(z); };
          return x.label + ' shown ' + show(d[x.key]) + ', source ' + show(s[x.key]);
        }).join('; '),
        reported: bad.length ? isReported(v.id) : false
      };
    });
  }

  // Report to IT button for a mismatching row; swaps itself for a badge once the alert exists.
  function reportCell(row) {
    if (row.result !== 'Mismatch') { return ''; }
    if (row.reported) { return UI.badge('Reported to IT', 'ok'); }
    var btn = el('button', { type: 'button', class: 'btn btn--small' }, ['Report to IT']);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!isReported(row.id)) {
        Services.reportAlert({
          type: 'display-mismatch', severity: 'medium',
          detail: 'Display mismatch in ' + row.id + ' for ' + row.customer + ': ' + row.detail + '.'
        });
        UI.toast('Reported to IT: an alert was created.', 'ok');
      } else {
        UI.toast('This discrepancy was already reported.', 'warn');
      }
      row.reported = true;
      if (btn.parentNode) { btn.parentNode.replaceChild(UI.badge('Reported to IT', 'ok'), btn); }
    });
    return btn;
  }

  var VIEW_COLUMNS = [
    { key: 'at', label: 'Viewed at', format: function (v) { return Fmt.datetime(v); } },
    { key: 'customer', label: 'Customer' },
    { key: 'displayedBalance', label: 'Balance shown', format: moneyCell },
    { key: 'sourceBalance', label: 'Balance in source', format: moneyCell },
    { key: 'displayedDue', label: 'Due date shown', format: dateCell },
    { key: 'sourceDue', label: 'Due date in source', format: dateCell },
    { key: 'displayedCount', label: 'Payments shown' },
    { key: 'sourceCount', label: 'Payments in source' },
    { key: 'result', label: 'Result', format: function (v, row) { return v === 'Match' ? UI.badge('Match', 'ok') : UI.badge('Mismatch: ' + row.fields, 'error'); } },
    { key: 'reported', label: 'Report to IT', format: function (v, row) { return reportCell(row); }, csv: function (row) { return row.reported ? 'Reported' : ''; } }
  ];

  Reports.register({
    id: 'display-sampling',
    title: 'Display sampling check',
    stories: ['US-42'],
    description: 'Each customer account view is logged. A sample check compares what was displayed with the source record.',
    filters: [
      { key: 'customer', label: 'Customer', type: 'customer' },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: VIEW_COLUMNS,
    rows: function (f) { return viewRows(f); },
    summary: function (rows) {
      var bad = rows.filter(function (r) { return r.result === 'Mismatch'; });
      return [
        { label: 'Views logged', value: rows.length },
        { label: 'Match', value: rows.length - bad.length, kind: 'ok' },
        { label: 'Mismatch', value: bad.length, kind: bad.length ? 'warn' : 'ok' },
        { label: 'Reported to IT', value: bad.filter(function (r) { return r.reported; }).length + ' of ' + bad.length }
      ];
    },
    panel: function () {
      return UI.panel('Sampling rules', el('div', { class: 'stack' }, [
        el('p', null, ['Sample check frequency: ', UI.tbd('Sample check frequency', 'Weekly'), '. Sample size: ', UI.tbd('Sample size', SAMPLE_SIZE + ' most recent views'), '.']),
        el('p', { class: 'muted' }, ['Press "Run sample check" to compare the displayed values with the source record for the sample. A discrepancy has a "Report to IT" button that raises an alert.'])
      ]), { note: 'A scheduled job would pick a random sample of logged views, re-read the database values as they were at view time and compare them with what the portal sent to the browser. Mismatches would open a ticket for IT.' });
    },
    actions: [{
      label: 'Run sample check',
      run: function (rows) {
        var sample = rows.slice(0, SAMPLE_SIZE);
        var bad = sample.filter(function (r) { return r.result === 'Mismatch'; });
        var head = bad.length
          ? el('div', { class: 'notice notice--warn' }, [el('strong', null, [bad.length + ' discrepanc' + (bad.length === 1 ? 'y' : 'ies') + '. ']), 'Sample check run at ' + Fmt.datetime(Clock.now()) + ': ' + sample.length + ' views checked.'])
          : el('div', { class: 'notice notice--ok' }, [el('strong', null, ['No discrepancies. ']), 'Sample check run at ' + Fmt.datetime(Clock.now()) + ': ' + sample.length + ' views checked.']);
        if (!sample.length) { head = el('div', { class: 'notice notice--info' }, ['There are no logged views to sample for these filters.']); }
        return el('div', { class: 'stack' }, [head, bad.length ? simpleTable(VIEW_COLUMNS, bad, '') : null]);
      }
    }]
  });

  // ---------- US-33 follow-up history ----------

  function followupRows(f) {
    var today = Clock.today();
    var contacts = {};
    return Store.get('followups').filter(function (x) {
      return (!f.customer || x.customerId === f.customer) && (!f.status || x.status === f.status) && inRange(x.createdAt || x.dueDate, f.from, f.to);
    }).sort(byDesc('createdAt')).map(function (x) {
      if (!contacts[x.customerId]) {
        var chk = Services.checkContactLimit(x.customerId, today);
        contacts[x.customerId] = chk.count + ' of ' + (chk.limit === null ? 'no limit set' : chk.limit) + ' in the last ' + chk.windowDays + ' days';
      }
      return {
        id: x.id, customer: custLabel(x.customerId), owner: userName(x.ownerId), dueDate: x.dueDate, time: x.time || '', channel: x.channel || '',
        status: x.status, outcomeCode: x.outcomeCode || '', overrideReason: x.overrideReason || '', createdAt: x.createdAt, completedAt: x.completedAt || '',
        pausedUntil: x.pausedUntil || '', reassignedFrom: x.reassignedFrom ? userName(x.reassignedFrom) : '', contacts: contacts[x.customerId]
      };
    });
  }

  Reports.register({
    id: 'followup-history',
    title: 'Follow-up history',
    stories: ['US-33'],
    description: 'Full follow-up history for each customer, including override reasons, with a CSV export.',
    filters: [
      { key: 'customer', label: 'Customer', type: 'customer' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Paused', 'Done'] },
      { key: 'from', label: 'Created from', type: 'date-from' },
      { key: 'to', label: 'Created to', type: 'date-to' }
    ],
    columns: [
      { key: 'id', label: 'Follow-up' },
      { key: 'customer', label: 'Customer' },
      { key: 'owner', label: 'Owner' },
      { key: 'dueDate', label: 'Due date', format: dateCell },
      { key: 'time', label: 'Time' },
      { key: 'channel', label: 'Channel' },
      { key: 'status', label: 'Status', format: function (v) { return UI.badge(v, v === 'Done' ? 'ok' : (v === 'Paused' ? 'warn' : null)); } },
      { key: 'outcomeCode', label: 'Outcome code' },
      { key: 'overrideReason', label: 'Override reason' },
      { key: 'createdAt', label: 'Created', format: function (v) { return Fmt.datetime(v); } },
      { key: 'completedAt', label: 'Completed', format: function (v) { return v ? Fmt.datetime(v) : ''; } },
      { key: 'pausedUntil', label: 'Paused until', format: function (v) { return v ? Fmt.date(v) : ''; } },
      { key: 'reassignedFrom', label: 'Reassigned from' },
      { key: 'contacts', label: 'Contacts now (interactions and reminders)' }
    ],
    rows: function (f) { return followupRows(f); },
    summary: function (rows) {
      return [
        { label: 'Follow-ups', value: rows.length },
        { label: 'With override reason', value: rows.filter(function (r) { return r.overrideReason; }).length },
        { label: 'Done', value: rows.filter(function (r) { return r.status === 'Done'; }).length },
        { label: 'Open or paused', value: rows.filter(function (r) { return r.status !== 'Done'; }).length }
      ];
    },
    panel: function () {
      var st = Store.settings().contactLimit || {};
      return UI.panel('Contact limit and export', el('div', { class: 'stack' }, [
        el('p', null, ['Agreed contact limit: ', tbdSetting('contactLimit', 'contacts per ' + (st.windowDays || 7) + ' days'), '. A rep cannot exceed it without a logged override reason. ',
          el('a', { href: 'compliance-settings.html' }, ['Change the limit'])]),
        el('p', { class: 'muted' }, ['To export one customer\'s full history, choose the customer above, press "Run report", then "Export CSV".'])
      ]), { note: 'The follow-up service would keep every follow-up, reassignment and override as history rows, so the export shows the complete story for a customer and not only the open items.' });
    }
  });
})();
