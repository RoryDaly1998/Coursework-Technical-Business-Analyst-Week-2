/*
 * reports-it.js: IT report definitions (US-01, US-02, US-23, US-53) registered with Reports.register.
 * Helpers are repeated in each reports-*.js file on purpose: the files are owned by different chunks and share no globals.
 */
(function () {
  'use strict';

  var el = UI.el;
  var MIGRATION_TYPES = ['Unmigrated', 'Duplicate merged', 'Duplicate flagged', 'Type mismatch'];
  var ALERT_TYPES = ['display-mismatch', 'job-failed', 'lockout', 'reminder-failure-rate'];
  var DELIVERY_STATUSES = ['sent', 'delivered', 'bounced', 'failed'];
  // Simulated test-restore duration in hours, shown only as demo evidence.
  var SIM_RESTORE_HOURS = 2.5;

  // Agreed access per role (PLAN.md section 6). Deliberately separate from PAGES so the access test can fail.
  var EXPECTED_ACCESS = {
    customer: ['index', 'portal-verify', 'portal-account', 'portal-pay', 'portal-promise', 'portal-details', 'portal-preferences', 'outbox'],
    rep: ['index', 'staff-search', 'staff-record', 'staff-log', 'staff-followups', 'outbox'],
    leader: ['index', 'reports', 'staff-search', 'staff-record', 'staff-followups', 'staff-approvals', 'reminders-config', 'outbox', 'report-team-logs', 'report-unfulfilled-promises'],
    finance: ['index', 'reports', 'report-balances-arrears', 'report-outcomes', 'report-reconciliation', 'report-fulfilment-value', 'report-promise-forecast'],
    compliance: ['index', 'reports', 'report-audit-trail', 'report-log-export', 'report-verification-log', 'report-payment-audit', 'report-display-sampling', 'report-followup-history', 'compliance-settings'],
    it: ['index', 'reports', 'report-migration-exceptions', 'report-security-status', 'report-lockouts-alerts', 'report-reminder-delivery', 'jobs', 'api-demo', 'outbox']
  };

  // ---------- helpers ----------

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

  function plain(n) { return Number(n).toLocaleString('en-GB'); }

  function custLabel(id) {
    var c = id ? Store.find('customers', id) : null;
    return c ? c.accountNo + ' - ' + c.name : (id || '');
  }

  function roleLabel(id) {
    var r = Store.find('roles', id);
    return r ? r.label : (id || '');
  }

  function matchLine(reportLabel, reportValue, sourceLabel, sourceValue, fmt) {
    var f = fmt || plain;
    var ok = Math.abs(Number(reportValue) - Number(sourceValue)) < 0.005;
    var text = reportLabel + ' ' + f(reportValue) + (ok ? ' = ' : ' differs from ') + sourceLabel + ' ' + f(sourceValue) + (ok ? '.' : ' (difference ' + f(Number(reportValue) - Number(sourceValue)) + ').');
    return el('div', { class: 'notice ' + (ok ? 'notice--ok' : 'notice--error') }, [el('strong', null, [ok ? 'Match: ' : 'Does not match: ']), text]);
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

  function kv(pairs) {
    var items = [];
    pairs.forEach(function (p) { items.push(el('dt', null, [p[0]]), el('dd', null, [p[1]])); });
    return el('dl', { class: 'kv' }, items);
  }

  // ---------- US-01 migration exceptions ----------

  function migrationInfo() {
    var m = Store.get('migration') || {};
    var ex = Array.isArray(m.exceptions) ? m.exceptions : [];
    return { legacy: Number(m.legacyTotal) || 0, migrated: Number(m.migrated) || 0, exceptions: ex };
  }

  function countType(list, type) { return list.filter(function (x) { return x.type === type; }).length; }

  function schemaOutput() {
    var res = Services.validateSchema();
    var at = Fmt.datetime(Clock.now());
    if (res.ok) {
      return el('div', { class: 'notice notice--ok' }, [el('strong', null, ['0 issues. ']), 'Data type check finished at ' + at + ': ' + res.checked + ' customer records checked and every field has the expected type.']);
    }
    return el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--warn' }, [el('strong', null, [res.issues.length + ' type issue' + (res.issues.length === 1 ? '' : 's') + '. ']), 'Data type check finished at ' + at + ': ' + res.checked + ' customer records checked.']),
      simpleTable([
        { key: 'accountNo', label: 'Account' }, { key: 'customerId', label: 'Customer ID' }, { key: 'field', label: 'Field' },
        { key: 'expected', label: 'Expected type' }, { key: 'actual', label: 'Actual type' }, { key: 'message', label: 'Issue' }
      ], res.issues, 'No issues.')
    ]);
  }

  Reports.register({
    id: 'migration-exceptions',
    title: 'Migration exceptions',
    stories: ['US-01'],
    description: 'Legacy records migrated into the central database, and every exception with how it was handled.',
    filters: [
      { key: 'type', label: 'Exception type', type: 'select', options: MIGRATION_TYPES },
      { key: 'search', label: 'Legacy ID or detail contains', type: 'text' }
    ],
    columns: [
      { key: 'legacyId', label: 'Legacy ID' },
      { key: 'type', label: 'Type', format: function (v) { return UI.badge(v, v === 'Unmigrated' ? 'error' : (v === 'Duplicate flagged' ? 'warn' : null)); } },
      { key: 'detail', label: 'Detail' },
      { key: 'resolution', label: 'Resolution' }
    ],
    rows: function (f) {
      var needle = (f.search || '').toLowerCase();
      return migrationInfo().exceptions.filter(function (x) {
        return (!f.type || x.type === f.type) && (!needle || (String(x.legacyId) + ' ' + String(x.detail || '')).toLowerCase().indexOf(needle) >= 0);
      }).map(function (x) {
        return { legacyId: x.legacyId, type: x.type, detail: x.detail || '', resolution: x.resolution || '' };
      }).sort(function (a, b) {
        var d = MIGRATION_TYPES.indexOf(a.type) - MIGRATION_TYPES.indexOf(b.type);
        return d || (a.legacyId < b.legacyId ? -1 : (a.legacyId > b.legacyId ? 1 : 0));
      });
    },
    summary: function () {
      var m = migrationInfo();
      var cards = [
        { label: 'Legacy records', value: plain(m.legacy) },
        { label: 'Migrated', value: plain(m.migrated), kind: 'ok' },
        { label: 'Exceptions', value: m.exceptions.length, kind: m.exceptions.length ? 'warn' : 'ok' }
      ];
      MIGRATION_TYPES.forEach(function (t) { cards.push({ label: t, value: countType(m.exceptions, t), note: 'All exceptions, ignoring filters' }); });
      return cards;
    },
    panel: function () {
      var m = migrationInfo();
      var unmigrated = countType(m.exceptions, 'Unmigrated');
      var merged = countType(m.exceptions, 'Duplicate merged');
      return UI.panel('Migration reconciliation', el('div', { class: 'stack' }, [
        matchLine('Legacy total', m.legacy, 'migrated (' + plain(m.migrated) + ') + not migrated (' + unmigrated + ') + merged duplicates (' + merged + ') =', m.migrated + unmigrated + merged),
        el('p', { class: 'muted' }, ['Every legacy record is either migrated or listed as an exception. Flagged duplicates and type mismatches are migrated, flagged or converted, so they count as migrated. Use "Run data type check" to confirm data types match across all customer records.'])
      ]), { note: 'The migration tool would load each legacy source, apply the agreed de-duplication rules, and write this exception list. IT would clear the Unmigrated items before cutover and re-run the check.' });
    },
    actions: [{ label: 'Run data type check', run: function () { return schemaOutput(); } }]
  });

  // ---------- US-02 security status ----------

  function attemptRows(f) {
    return Store.get('accessAttempts').filter(function (a) {
      return (!f.role || a.role === f.role) && inRange(a.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (a) {
      var u = a.userId ? Store.find('users', a.userId) : null;
      var c = a.userId && !u ? Store.find('customers', a.userId) : null;
      var page = Auth.page(a.pageId);
      return {
        id: a.id, at: a.at, role: roleLabel(a.role), roleId: a.role,
        user: u ? u.name + ' (' + u.id + ')' : (c ? 'Customer account ' + c.accountNo : 'Not signed in'),
        pageId: a.pageId, page: page ? page.title : a.pageId, result: String(a.result || 'denied').toLowerCase() === 'denied' ? 'Denied' : a.result
      };
    });
  }

  // Compares Auth.can for every role and page with the agreed access lists.
  function accessTestOutput() {
    var roles = Store.get('roles');
    var checks = [];
    roles.forEach(function (r) {
      var expected = EXPECTED_ACCESS[r.id] || [];
      window.PAGES.forEach(function (p) {
        var exp = expected.indexOf(p.id) >= 0;
        var act = Auth.can(p.id, r.id);
        checks.push({ role: r.label, roleId: r.id, page: p.title, pageId: p.id, expected: exp ? 'Allowed' : 'Denied', actual: act ? 'Allowed' : 'Denied', pass: exp === act });
      });
    });
    var failed = checks.filter(function (c) { return !c.pass; });
    var perRole = roles.map(function (r) {
      var mine = checks.filter(function (c) { return c.roleId === r.id; });
      return {
        role: r.label,
        allowed: mine.filter(function (c) { return c.actual === 'Allowed'; }).length,
        denied: mine.filter(function (c) { return c.actual === 'Denied'; }).length,
        passed: mine.filter(function (c) { return c.pass; }).length,
        total: mine.length
      };
    });
    var checkCols = [
      { key: 'role', label: 'Role' }, { key: 'page', label: 'Page' }, { key: 'pageId', label: 'Page ID' },
      { key: 'expected', label: 'Expected' }, { key: 'actual', label: 'Actual' },
      { key: 'pass', label: 'Result', format: function (v) { return v ? UI.badge('Pass', 'ok') : UI.badge('Fail', 'error'); } }
    ];
    var head = failed.length
      ? el('div', { class: 'notice notice--error' }, [el('strong', null, ['Simulated check: ' + failed.length + ' of ' + checks.length + ' access checks failed. ']), 'Run at ' + Fmt.datetime(Clock.now()) + '.'])
      : el('div', { class: 'notice notice--ok' }, [el('strong', null, ['Simulated check: all ' + checks.length + ' access checks passed. ']), roles.length + ' roles x ' + window.PAGES.length + ' pages, run at ' + Fmt.datetime(Clock.now()) + '.']);
    return el('div', { class: 'stack' }, [
      head,
      el('p', { class: 'muted' }, ['This compares the page registry with the agreed access list from the plan. It does not try real sign-ins.']),
      simpleTable([
        { key: 'role', label: 'Role' }, { key: 'allowed', label: 'Pages allowed' }, { key: 'denied', label: 'Pages denied' },
        { key: 'passed', label: 'Checks passed', format: function (v, row) { return v + ' of ' + row.total; } }
      ], perRole, 'No roles.'),
      failed.length ? simpleTable(checkCols, failed, '') : null,
      el('details', null, [el('summary', null, ['Show all ' + checks.length + ' checks']), simpleTable(checkCols, checks, 'No checks.')])
    ]);
  }

  function evidencePanels() {
    var rto = Number(Services.setting('recoveryTimeObjective', 0));
    var restoreOk = rto > 0 && SIM_RESTORE_HOURS <= rto;
    var encryption = UI.panel('Encryption', kv([
      ['At rest', 'AES-256 on the database and backups (simulated)'],
      ['In transit', 'TLS 1.2 or higher on every connection (simulated)'],
      ['Evidence date', Fmt.datetime(Clock.now())]
    ]), { label: 'Simulated evidence', note: 'The hosting platform would encrypt storage and enforce TLS. IT would attach the platform\'s configuration report or certificate as evidence; this panel only shows what that evidence would say.' });
    var backups = UI.panel('Backups and test restore', kv([
      ['Backup frequency', tbdSetting('backupFrequency')],
      ['Last backup', Fmt.datetime(Clock.today() + 'T02:00') + ' (simulated)'],
      ['Recovery time objective', tbdSetting('recoveryTimeObjective', 'hours')],
      ['Last test restore', 'Completed in 2 h 30 min (simulated)'],
      ['Restore within objective', restoreOk ? UI.badge('Yes', 'ok') : UI.badge('No', 'error')]
    ]), { label: 'Simulated evidence', note: 'A scheduled backup job would run at the agreed frequency and a periodic test restore would be timed against the recovery objective. Both results would be pulled from the backup tool\'s logs.' });
    var access = UI.panel('Role-based access', el('div', { class: 'stack' }, [
      el('p', null, ['Press "Run access tests" to run a simulated check of every role against every page. It compares the page registry with the agreed access list from the plan, so a mistake in the registry shows as a failure.']),
      el('p', { class: 'muted' }, ['Denied attempts are logged and listed in the table below the buttons.'])
    ]), { label: 'Simulated check', note: 'In production the same test would call the real access layer with a test account for each role, and run in the release pipeline.' });
    return el('div', { class: 'stack' }, [access, encryption, backups]);
  }

  Reports.register({
    id: 'security-status',
    title: 'Security status',
    stories: ['US-02'],
    description: 'Role access tests, encryption and backup evidence, and the log of unauthorised access attempts.',
    filters: [
      {
        key: 'role', label: 'Role attempting access', type: 'select',
        options: [{ value: 'customer', label: 'Customer' }, { value: 'rep', label: 'Collections rep' }, { value: 'leader', label: 'Team leader' },
          { value: 'finance', label: 'Finance' }, { value: 'compliance', label: 'Compliance' }, { value: 'it', label: 'IT' }]
      },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: [
      { key: 'at', label: 'Time', format: function (v) { return Fmt.datetime(v); } },
      { key: 'role', label: 'Role' },
      { key: 'user', label: 'User' },
      { key: 'page', label: 'Page requested' },
      { key: 'pageId', label: 'Page ID' },
      { key: 'result', label: 'Result', format: function (v) { return UI.badge(v, 'error'); } }
    ],
    empty: 'No unauthorised access attempts have been logged for these filters.',
    rows: function (f) { return attemptRows(f); },
    summary: function (rows) {
      var roles = {};
      var pages = {};
      rows.forEach(function (r) { roles[r.roleId] = true; pages[r.pageId] = true; });
      return [
        { label: 'Unauthorised attempts', value: rows.length, kind: rows.length ? 'warn' : 'ok' },
        { label: 'Roles involved', value: Object.keys(roles).length },
        { label: 'Pages targeted', value: Object.keys(pages).length },
        { label: 'Latest attempt', value: rows.length ? Fmt.datetime(rows[0].at) : 'None' }
      ];
    },
    panel: function () { return evidencePanels(); },
    actions: [{ label: 'Run access tests (simulated check)', run: function () { return accessTestOutput(); } }]
  });

  // ---------- US-23 lockouts and alerts ----------

  function alertRows(f) {
    return Store.get('alerts').filter(function (a) {
      return (!f.type || a.type === f.type) && (!f.severity || a.severity === f.severity) && inRange(a.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (a) {
      return { id: a.id, at: a.at, type: a.type, severity: a.severity, detail: a.detail || '' };
    });
  }

  function lockedRows() {
    return Store.get('customers').filter(function (c) { return c.locked || Number(c.failedAttempts) > 0; }).map(function (c) {
      var last = Store.get('verifications').filter(function (v) { return v.customerId === c.id && v.outcome === 'Locked'; }).sort(byDesc('at'))[0];
      return {
        accountNo: c.accountNo, customer: c.name, state: c.locked ? 'Locked' : 'Failed attempts', failedAttempts: Number(c.failedAttempts) || 0,
        lockedAt: c.locked && last ? last.at : null
      };
    });
  }

  Reports.register({
    id: 'lockouts-alerts',
    title: 'Lockouts and alerts',
    stories: ['US-23'],
    description: 'Accounts locked after failed verification, and the alerts raised for IT.',
    // Alert type options include any type found in the live alerts.
    get filters() {
      var types = ALERT_TYPES.slice();
      Store.get('alerts').forEach(function (a) { if (a.type && types.indexOf(a.type) < 0) { types.push(a.type); } });
      return [
        { key: 'type', label: 'Alert type', type: 'select', options: types.sort() },
        { key: 'severity', label: 'Severity', type: 'select', options: ['high', 'medium', 'low'] },
        { key: 'from', label: 'Date from', type: 'date-from' },
        { key: 'to', label: 'Date to', type: 'date-to' }
      ];
    },
    columns: [
      { key: 'id', label: 'Alert' },
      { key: 'at', label: 'Raised', format: function (v) { return Fmt.datetime(v); } },
      { key: 'type', label: 'Type' },
      { key: 'severity', label: 'Severity', format: function (v) { return UI.badge(v, v === 'high' ? 'error' : (v === 'medium' ? 'warn' : null)); } },
      { key: 'detail', label: 'Detail' }
    ],
    empty: 'No alerts match these filters.',
    rows: function (f) { return alertRows(f); },
    summary: function (rows) {
      var locked = Store.get('customers').filter(function (c) { return c.locked; }).length;
      return [
        { label: 'Alerts shown', value: rows.length },
        { label: 'High severity', value: rows.filter(function (r) { return r.severity === 'high'; }).length },
        { label: 'Locked accounts', value: locked, kind: locked ? 'warn' : 'ok', note: 'All accounts, ignoring filters' }
      ];
    },
    panel: function () {
      var locked = lockedRows();
      return UI.panel('Locked accounts and thresholds', el('div', { class: 'stack' }, [
        kv([
          ['Failed attempts before lockout', tbdSetting('lockoutThreshold', 'attempts')],
          ['Failed attempts that raise an alert', tbdSetting('alertThreshold', 'attempts')],
          ['Alert time window', tbdSetting('alertWindowMinutes', 'minutes')]
        ]),
        simpleTable([
          { key: 'accountNo', label: 'Account' }, { key: 'customer', label: 'Customer' },
          { key: 'state', label: 'State', format: function (v) { return v === 'Locked' ? UI.badge('Locked', 'error') : UI.badge(v, 'warn'); } },
          { key: 'failedAttempts', label: 'Failed attempts' },
          { key: 'lockedAt', label: 'Locked at', format: function (v) { return v ? Fmt.datetime(v) : ''; } }
        ], locked, 'No accounts are locked and none have failed attempts.'),
        el('p', { class: 'muted' }, ['A locked account can only be unlocked by a rep after the caller passes phone verification (Unlock account on the customer record).'])
      ]), { note: 'The identity service would count consecutive failures per account, lock at the limit, and send an alert to the on-call channel when failures across accounts exceed the threshold inside the time window.' });
    }
  });

  // ---------- US-53 reminder delivery ----------

  function reminderRows(f) {
    return Store.get('messages').filter(function (m) {
      return m.kind === 'reminder' && (!f.status || m.status === f.status) && (!f.channel || m.channel === f.channel) && inRange(m.at, f.from, f.to);
    }).sort(byDesc('at')).map(function (m) {
      var c = Store.find('customers', m.customerId);
      var flag = '';
      if (m.status === 'bounced' && m.channel === 'email') {
        flag = c && c.email !== m.to ? 'Address changed since' : (c && c.emailBounced ? 'Flagged on record' : 'Not flagged');
      }
      return { id: m.id, at: m.at, customer: custLabel(m.customerId), to: m.to || '', channel: m.channel, templateId: m.templateId || '', status: m.status, flag: flag };
    });
  }

  function failureRate(rows) {
    var bad = rows.filter(function (r) { return r.status === 'bounced' || r.status === 'failed'; }).length;
    return rows.length ? Math.round(bad * 1000 / rows.length) / 10 : 0;
  }

  function bouncedAddresses() {
    var list = [];
    Store.get('messages').forEach(function (m) {
      if (m.status === 'bounced' && m.channel === 'email') { list.push({ customerId: m.customerId, address: m.to || '', at: m.at }); }
    });
    Store.get('customers').forEach(function (c) {
      if (c.emailBounced && !list.some(function (b) { return b.customerId === c.id && b.address === c.email; })) {
        list.push({ customerId: c.id, address: c.email, at: null });
      }
    });
    return list.sort(byDesc('at')).map(function (b) {
      var c = Store.find('customers', b.customerId);
      var flag = !c ? 'No customer' : (c.email !== b.address ? 'Address changed since' : (c.emailBounced ? 'Flagged on record' : 'Not flagged'));
      return { customer: custLabel(b.customerId), address: b.address, at: b.at, flag: flag };
    });
  }

  Reports.register({
    id: 'reminder-delivery',
    title: 'Reminder delivery',
    stories: ['US-53'],
    description: 'Delivery status of every reminder, the failure rate against the alert threshold, and bounced addresses.',
    filters: [
      { key: 'status', label: 'Status', type: 'select', options: DELIVERY_STATUSES },
      { key: 'channel', label: 'Channel', type: 'select', options: ['email', 'sms'] },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: [
      { key: 'id', label: 'Message' },
      { key: 'at', label: 'Sent', format: function (v) { return Fmt.datetime(v); } },
      { key: 'customer', label: 'Customer' },
      { key: 'to', label: 'Sent to' },
      { key: 'channel', label: 'Channel' },
      { key: 'templateId', label: 'Template' },
      { key: 'status', label: 'Status', format: function (v) { return UI.badge(v, v === 'delivered' ? 'ok' : (v === 'bounced' || v === 'failed' ? 'error' : null)); } },
      { key: 'flag', label: 'Bounced address', format: function (v) { return v ? UI.badge(v, v === 'Flagged on record' ? 'ok' : 'warn') : ''; } }
    ],
    empty: 'No reminders match these filters.',
    rows: function (f) { return reminderRows(f); },
    summary: function (rows) {
      var threshold = Number(Services.setting('failureRateThreshold', 10));
      var rate = failureRate(rows);
      var cards = DELIVERY_STATUSES.map(function (s) {
        return { label: s.charAt(0).toUpperCase() + s.slice(1), value: rows.filter(function (r) { return r.status === s; }).length };
      });
      cards.push({ label: 'Failure rate', value: rate + '%', note: 'Bounced and failed. Threshold ' + threshold + '% (TBD)', kind: rate > threshold ? 'warn' : 'ok' });
      return cards;
    },
    panel: function (ctx) {
      var rows = reminderRows(ctx.filters);
      var threshold = Number(Services.setting('failureRateThreshold', 10));
      var rate = failureRate(rows);
      var over = rows.length > 0 && rate > threshold;
      var counted = DELIVERY_STATUSES.reduce(function (n, s) { return n + rows.filter(function (r) { return r.status === s; }).length; }, 0);
      var raised = Store.get('alerts').filter(function (a) { return a.type === 'reminder-failure-rate'; }).length;
      var indication = over
        ? el('div', { class: 'notice notice--error' }, [el('strong', null, ['Alert indicated: ']), 'failure rate ' + rate + '% is over the threshold of ', UI.tbd('Failure rate threshold', threshold + '%'),
          '. The reminder job raises this alert (' + raised + ' raised so far; see Lockouts and alerts).'])
        : el('div', { class: 'notice notice--ok' }, [el('strong', null, ['Within threshold: ']), rows.length ? 'failure rate ' + rate + '% is not over the threshold of ' : 'no reminders in this range; threshold is ', UI.tbd('Failure rate threshold', threshold + '%'), '.']);
      var flagged = bouncedAddresses();
      return UI.panel('Failure rate and bounced addresses', el('div', { class: 'stack' }, [
        indication,
        matchLine('Reminders counted by status', counted, 'reminders logged', rows.length),
        el('p', { class: 'muted' }, ['Measured over the date range in the filters (the standard period is ', UI.tbd('Failure rate period', '7 days'), '). Failure rate is bounced plus failed, divided by all reminders.']),
        el('h3', null, ['Bounced email addresses (' + flagged.length + ')']),
        simpleTable([
          { key: 'customer', label: 'Customer' }, { key: 'address', label: 'Address' },
          { key: 'at', label: 'Bounced', format: function (v) { return v ? Fmt.datetime(v) : ''; } },
          { key: 'flag', label: 'Flag on customer record', format: function (v) { return UI.badge(v, v === 'Flagged on record' ? 'ok' : 'warn'); } }
        ], flagged, 'No email addresses have bounced.')
      ]), { note: 'The email provider would call a webhook with each delivery result. The service would store the status, flag the customer\'s address when it bounces and alert IT when the failure rate in the period passes the threshold.' });
    }
  });
})();
