/*
 * reports-staff.js: leader reports registered with Reports.register.
 *   team-logs             US-09  the current leader's team logs, filter by rep, outcome code and date range
 *   unfulfilled-promises  US-26  outstanding Not fulfilled / Partially fulfilled promises for the leader's team
 * Both are scoped to the signed-in leader's team: other teams' data is never returned, even if a filter asks for it.
 * Production: the same filters become query parameters on a read-only reporting endpoint that applies the team scope server-side.
 */
(function () {
  'use strict';

  var el = UI.el;

  // Team of the signed-in leader, or null for any other role.
  function leaderTeam(ctx) {
    return ctx && ctx.role === 'leader' && ctx.user && ctx.user.team ? ctx.user.team : null;
  }

  function currentLeaderTeam() {
    var u = Auth.user();
    return Auth.role() === 'leader' && u && u.team ? u.team : null;
  }

  function userName(id) {
    var u = id ? Store.find('users', id) : null;
    return u ? u.name : null;
  }

  // Team that owns a log: the rep's team, else the log's own team, else the customer's team.
  function teamOfLog(log) {
    var rep = log.repId ? Store.find('users', log.repId) : null;
    if (rep && rep.team) { return rep.team; }
    if (log.team) { return log.team; }
    var c = Store.find('customers', log.customerId);
    return c ? c.team : null;
  }

  function actorLabel(log) {
    var name = userName(log.repId);
    if (name) { return name; }
    return log.channel === 'portal' ? 'Customer (portal)' : 'System';
  }

  function customerLabel(c) { return c ? c.accountNo + ' - ' + c.name : 'Unknown customer'; }

  function accountLink(row) { return row.accountNo ? 'staff-record.html?acct=' + encodeURIComponent(row.accountNo) : null; }

  // ---------- US-09 ----------

  Reports.register({
    id: 'team-logs',
    title: 'Team interaction logs',
    stories: ['US-09'],
    description: 'Every log entry for your own team. Filter by rep, outcome code and date range. Other teams\' logs are never listed.',
    filters: [
      {
        key: 'rep', label: 'Rep', type: 'select',
        get options() {
          var team = currentLeaderTeam();
          return Store.get('users').filter(function (u) { return (u.role === 'rep' || u.role === 'leader') && team && u.team === team; })
            .map(function (u) { return { value: u.id, label: u.name }; });
        }
      },
      {
        key: 'outcome', label: 'Outcome code', type: 'select',
        get options() {
          return (Store.config('outcomeCodes') || []).map(function (o) { return { value: o.code, label: o.code + ' - ' + o.label }; });
        }
      },
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' }
    ],
    columns: [
      { key: 'at', label: 'Date and time', format: function (v) { return Fmt.datetime(v); } },
      { key: 'customer', label: 'Customer' },
      { key: 'kind', label: 'Type' },
      { key: 'rep', label: 'Handled by' },
      { key: 'outcome', label: 'Outcome' },
      { key: 'method', label: 'Method' },
      { key: 'amount', label: 'Amount', format: function (v) { return v === null || v === undefined ? '' : Fmt.money(v); } },
      { key: 'notes', label: 'Notes' }
    ],
    rows: function (f, ctx) {
      var team = leaderTeam(ctx);
      if (!team) { return []; }
      var codes = Store.config('outcomeCodes') || [];
      var out = [];
      Store.get('logs').forEach(function (l) {
        if (teamOfLog(l) !== team) { return; }
        var day = String(l.date || l.at || '').slice(0, 10);
        if (f.rep && l.repId !== f.rep) { return; }
        if (f.outcome && l.outcomeCode !== f.outcome) { return; }
        if (f.from && day < f.from) { return; }
        if (f.to && day > f.to) { return; }
        var c = Store.find('customers', l.customerId);
        var def = l.outcomeCode ? codes.filter(function (o) { return o.code === l.outcomeCode; })[0] : null;
        out.push({
          id: l.id, at: l.at, accountNo: c ? c.accountNo : '', customer: customerLabel(c), kind: l.kind, rep: actorLabel(l),
          outcome: l.outcomeCode ? l.outcomeCode + (def ? ' - ' + def.label : '') : '',
          method: l.method || '', amount: l.amount, notes: l.notes || ''
        });
      });
      out.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
      return out;
    },
    summary: function (rows) {
      var reps = {};
      var interactions = 0;
      rows.forEach(function (r) {
        if (r.kind === 'interaction') { interactions++; }
        reps[r.rep] = true;
      });
      return [
        { label: 'Log entries', value: rows.length },
        { label: 'Interactions', value: interactions },
        { label: 'Handlers shown', value: Object.keys(reps).length }
      ];
    },
    panel: function (ctx) {
      var team = leaderTeam(ctx);
      var body = el('div', { class: 'stack' }, [
        team
          ? el('div', { class: 'notice notice--info' }, ['Showing logs for team ' + team + ' only (signed in as ' + ctx.user.name + '). Logs for other teams are never shown.'])
          : el('div', { class: 'notice notice--warn' }, ['No team is set for the current user, so no logs can be shown.']),
        el('p', null, [
          'Time target: results within ', UI.tbd('n seconds to return results', 5), ' for a date range of up to ',
          UI.tbd('m days in the date range', 90), '.'
        ]),
        UI.howItWorks('The report would query the case-log store with the leader\'s team id taken from their sign-in, never from a filter the user can change.')
      ]);
      return UI.panel('Scope and targets', body);
    },
    rowLink: accountLink,
    empty: 'No logs for your team match these filters.'
  });

  // ---------- US-26 ----------

  Reports.register({
    id: 'unfulfilled-promises',
    title: 'Unfulfilled promises',
    stories: ['US-26'],
    description: 'Promises your team\'s customers did not keep (Not fulfilled or Partially fulfilled) where money is still outstanding.',
    filters: [
      { key: 'acct', label: 'Account number', type: 'text' },
      { key: 'result', label: 'Result', type: 'select', options: ['Not fulfilled', 'Partially fulfilled'] }
    ],
    columns: [
      { key: 'customer', label: 'Customer' },
      { key: 'amount', label: 'Promised amount', format: function (v) { return Fmt.money(v); } },
      { key: 'outstanding', label: 'Still outstanding', format: function (v) { return Fmt.money(v); } },
      { key: 'dueDate', label: 'Due date', format: function (v) { return Fmt.date(v); } },
      { key: 'daysOverdue', label: 'Days overdue' },
      { key: 'result', label: 'Result' }
    ],
    rows: function (f, ctx) {
      var team = leaderTeam(ctx);
      if (!team) { return []; }
      var acct = String(f.acct || '').trim();
      var out = [];
      Store.get('promises').forEach(function (p) {
        if (p.status !== 'Not fulfilled' && p.status !== 'Partially fulfilled') { return; }
        if (f.result && p.status !== f.result) { return; }
        var c = Store.find('customers', p.customerId);
        if (!c || c.team !== team) { return; }
        if (acct && String(c.accountNo).indexOf(acct) < 0) { return; }
        var shortfall = typeof p.shortfall === 'number' ? p.shortfall : Number(p.amount) - (Number(p.received) || 0);
        var outstanding = Math.max(0, Math.round((shortfall - Services.paymentTotalSince(c.id, p.checkedAt || p.dueDate)) * 100) / 100);
        if (outstanding <= 0) { return; }
        out.push({
          accountNo: c.accountNo, customer: customerLabel(c), amount: Number(p.amount), outstanding: outstanding,
          dueDate: p.dueDate, daysOverdue: Math.max(0, Clock.diffDays(p.dueDate, ctx.today) || 0), result: p.status
        });
      });
      out.sort(function (a, b) { return b.daysOverdue - a.daysOverdue; });
      return out;
    },
    summary: function (rows) {
      var total = 0;
      var longest = 0;
      rows.forEach(function (r) {
        total += r.outstanding;
        if (r.daysOverdue > longest) { longest = r.daysOverdue; }
      });
      return [
        { label: 'Unfulfilled promises', value: rows.length },
        { label: 'Still outstanding', value: Fmt.money(total) },
        { label: 'Longest overdue', value: longest + (longest === 1 ? ' day' : ' days') }
      ];
    },
    panel: function (ctx) {
      var team = leaderTeam(ctx);
      return UI.panel('Schedule and scope', el('div', { class: 'stack' }, [
        team
          ? el('div', { class: 'notice notice--info' }, ['Team ' + team + ' customers only. A promise drops off this list when later payments cover the shortfall.'])
          : el('div', { class: 'notice notice--warn' }, ['No team is set for the current user, so nothing can be shown.']),
        el('p', null, [
          'Generated ', UI.tbd('How often the report is generated', 'daily'), ' and available by ', UI.tbd('Time the report is available', '08:00'), '.'
        ]),
        UI.howItWorks('A scheduled job would produce this list at the agreed frequency and publish it before the agreed time; here it is calculated when you press Run report.')
      ]));
    },
    rowLink: accountLink,
    empty: 'No unfulfilled promises for your team. Run the fulfilment check on the jobs page (IT role) to create some.'
  });
})();
