/*
 * reports-finance.js: Finance report definitions (US-06, US-11, US-16, US-27, US-38) registered with Reports.register.
 * Each report ties its totals to an independent source in a visible match line (panel).
 * Helpers are repeated in each reports-*.js file on purpose: the files are owned by different chunks and share no globals.
 */
(function () {
  'use strict';

  var el = UI.el;
  var RESULTS = ['Fulfilled', 'Partially fulfilled', 'Not fulfilled'];

  // ---------- helpers ----------

  function cents(n) { return Math.round((Number(n) || 0) * 100); }
  function r2(n) { return cents(n) / 100; }

  // Sums a key (or a function of the item) over a list, rounded to 2dp.
  function total(list, key) {
    return r2(list.reduce(function (t, x) { return t + (Number(typeof key === 'function' ? key(x) : x[key]) || 0); }, 0));
  }

  function day(iso) { return String(iso || '').slice(0, 10); }

  function inRange(iso, from, to) {
    var d = day(iso);
    if (from && d < from) { return false; }
    if (to && d > to) { return false; }
    return true;
  }

  function plain(n) { return String(n); }

  // Independent copy of a collection, so a report works on a read-only snapshot.
  function snapshot(coll) { return JSON.parse(JSON.stringify(Store.get(coll))); }

  function acctLabel(id) {
    var c = id ? Store.find('customers', id) : null;
    return c ? c.accountNo + ' - ' + c.name : (id || '');
  }

  // Visible tie-out line: a report total against the source total it must equal.
  function matchLine(reportLabel, reportValue, sourceLabel, sourceValue, fmt) {
    var f = fmt || Fmt.money;
    var ok = Math.abs(Number(reportValue) - Number(sourceValue)) < 0.005;
    var text = reportLabel + ' ' + f(reportValue) + (ok ? ' = ' : ' differs from ') + sourceLabel + ' ' + f(sourceValue) +
      (ok ? '.' : ' (difference ' + f(Math.round((Number(reportValue) - Number(sourceValue)) * 100) / 100) + ').');
    return el('div', { class: 'notice ' + (ok ? 'notice--ok' : 'notice--error') }, [el('strong', null, [ok ? 'Match: ' : 'Does not match: ']), text]);
  }

  // Same window the fulfilment job uses: from the promise being made to its check, or to the end of its due date if not checked yet.
  function paidInWindow(p) {
    return Services.paymentTotalSince(p.customerId, p.createdAt, p.checkedAt || p.dueDate);
  }

  function statusBadge(status) {
    if (status === 'Cleared' || status === 'Fulfilled' || status === 'Matched') { return UI.badge(status, 'ok'); }
    if (status === 'Not fulfilled' || status === 'Amount differs' || status === 'Payment not successful') { return UI.badge(status, 'error'); }
    if (status === 'Overdue' || status === 'Partially fulfilled' || status === 'Unmatched payment' || status === 'Unmatched settlement') { return UI.badge(status, 'warn'); }
    return UI.badge(status);
  }

  // ---------- US-06 balances and arrears ----------

  // One row per customer from a snapshot; ledger balance is the original balance less successful payments.
  function ledgerRows(f) {
    var customers = snapshot('customers');
    var payments = snapshot('payments');
    var today = Clock.today();
    return customers.map(function (c) {
      var paid = total(payments.filter(function (p) { return p.customerId === c.id && p.status === 'success'; }), 'amount');
      var status = cents(c.balance) <= 0 ? 'Cleared' : (c.dueDate && day(c.dueDate) < today ? 'Overdue' : 'Not yet due');
      return {
        customerId: c.id, accountNo: c.accountNo, name: c.name, team: c.team, dueDate: c.dueDate,
        daysOverdue: status === 'Overdue' ? Clock.diffDays(c.dueDate, today) : 0,
        originalBalance: r2(c.originalBalance), paid: paid, balance: r2(c.balance),
        ledgerBalance: r2(c.originalBalance - paid), variance: r2(c.balance - (c.originalBalance - paid)), status: status
      };
    }).filter(function (r) {
      return (!f.customer || r.customerId === f.customer) && (!f.team || r.team === f.team) && (!f.status || r.status === f.status);
    });
  }

  Reports.register({
    id: 'balances-arrears',
    title: 'Balances and arrears',
    stories: ['US-06'],
    description: 'Customer balances, amounts collected and arrears, run on demand against a read-only copy of the data.',
    filters: [
      { key: 'customer', label: 'Customer', type: 'customer' },
      { key: 'team', label: 'Team', type: 'select', options: ['A', 'B'] },
      { key: 'status', label: 'Balance status', type: 'select', options: ['Cleared', 'Overdue', 'Not yet due'] }
    ],
    columns: [
      { key: 'accountNo', label: 'Account' },
      { key: 'name', label: 'Customer' },
      { key: 'team', label: 'Team' },
      { key: 'dueDate', label: 'Due date', format: function (v) { return Fmt.date(v); } },
      { key: 'status', label: 'Status', format: function (v) { return statusBadge(v); } },
      { key: 'daysOverdue', label: 'Days overdue' },
      { key: 'originalBalance', label: 'Original balance', format: function (v) { return Fmt.money(v); } },
      { key: 'paid', label: 'Collected', format: function (v) { return Fmt.money(v); } },
      { key: 'balance', label: 'Balance', format: function (v) { return Fmt.money(v); } },
      { key: 'ledgerBalance', label: 'Ledger balance', format: function (v) { return Fmt.money(v); } },
      { key: 'variance', label: 'Variance', format: function (v) { return Fmt.money(v); } }
    ],
    rows: function (f) { return ledgerRows(f); },
    summary: function (rows) {
      var overdue = rows.filter(function (r) { return r.status === 'Overdue'; });
      return [
        { label: 'Outstanding balance', value: Fmt.money(total(rows, 'balance')), note: rows.filter(function (r) { return cents(r.balance) > 0; }).length + ' customers with a balance' },
        { label: 'Arrears (overdue)', value: Fmt.money(total(overdue, 'balance')), note: overdue.length + ' overdue accounts', kind: overdue.length ? 'warn' : 'ok' },
        { label: 'Collected to date', value: Fmt.money(total(rows, 'paid')), note: 'Successful payments only' },
        { label: 'Original balances', value: Fmt.money(total(rows, 'originalBalance')) }
      ];
    },
    panel: function (ctx) {
      var rows = ledgerRows(ctx.filters);
      return UI.panel('Run on demand', el('div', { class: 'stack' }, [
        matchLine('Report balance total', total(rows, 'balance'), 'source ledger total (original balance less successful payments)', total(rows, 'ledgerBalance')),
        el('p', { class: 'muted' }, ['Run at ' + Fmt.datetime(ctx.now) + ' on a read-only copy of ' + rows.length + ' customer accounts and their payments. ' +
          'Nothing is written back and rep screens are not affected. Press "Run report" to run it again.'])
      ]), { note: 'Reports would run against a read-only replica or reporting view of the central database, so a month-end run never slows rep screens. The source ledger is the payment ledger, and every run is reconciled to it.' });
    }
  });

  // ---------- US-11 outcomes ----------

  // Interaction logs matching the filters: the "logged cases" the report must reconcile to.
  function loggedCases(f) {
    return Store.get('logs').filter(function (l) {
      return l.kind === 'interaction' && inRange(l.date || l.at, f.from, f.to) && (!f.team || l.team === f.team);
    });
  }

  function outcomeRows(f) {
    var byCode = {};
    var order = [];
    (Store.config('outcomeCodes') || []).forEach(function (c) {
      byCode[c.code] = { code: c.code, label: c.label, count: 0, recorded: 0, customers: {} };
      order.push(c.code);
    });
    loggedCases(f).forEach(function (l) {
      var k = l.outcomeCode || '(none)';
      if (!byCode[k]) {
        byCode[k] = { code: k, label: l.outcomeCode ? 'Unrecognised code' : 'No outcome code recorded', count: 0, recorded: 0, customers: {} };
        order.push(k);
      }
      byCode[k].count += 1;
      byCode[k].recorded += Number(l.amount) || Number(l.promiseAmount) || 0;
      byCode[k].customers[l.customerId] = true;
    });
    var all = order.reduce(function (n, k) { return n + byCode[k].count; }, 0);
    return order.map(function (k) {
      var o = byCode[k];
      var balance = Object.keys(o.customers).reduce(function (t, id) {
        var c = Store.find('customers', id);
        return t + (c ? Number(c.balance) || 0 : 0);
      }, 0);
      return {
        code: o.code, label: o.label, count: o.count, share: all ? Math.round(o.count * 1000 / all) / 10 : 0,
        recorded: r2(o.recorded), accounts: Object.keys(o.customers).length, balance: r2(balance)
      };
    });
  }

  Reports.register({
    id: 'outcomes',
    title: 'Outcome codes',
    stories: ['US-11'],
    description: 'Count and value of logged cases by outcome code. Totals reconcile to the number of logged cases.',
    filters: [
      { key: 'from', label: 'Logged from', type: 'date-from' },
      { key: 'to', label: 'Logged to', type: 'date-to' },
      { key: 'team', label: 'Team', type: 'select', options: ['A', 'B'] }
    ],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'label', label: 'Outcome' },
      { key: 'count', label: 'Cases' },
      { key: 'share', label: 'Share of cases', format: function (v) { return v + '%'; } },
      { key: 'recorded', label: 'Value recorded (paid or promised)', format: function (v) { return Fmt.money(v); } },
      { key: 'accounts', label: 'Accounts' },
      { key: 'balance', label: 'Current balance of those accounts', format: function (v) { return Fmt.money(v); } }
    ],
    rows: function (f) { return outcomeRows(f); },
    summary: function (rows) {
      return [
        { label: 'Total cases', value: rows.reduce(function (n, r) { return n + r.count; }, 0) },
        { label: 'Value recorded', value: Fmt.money(total(rows, 'recorded')), note: 'Payments taken and promises made' },
        { label: 'Outcome codes used', value: rows.filter(function (r) { return r.count > 0; }).length + ' of ' + rows.length }
      ];
    },
    panel: function (ctx) {
      var rows = outcomeRows(ctx.filters);
      var sum = rows.reduce(function (n, r) { return n + r.count; }, 0);
      return UI.panel('Reconciliation to logged cases', el('div', { class: 'stack' }, [
        matchLine('Total cases in this report', sum, 'logged cases (interaction logs)', loggedCases(ctx.filters).length, plain),
        el('p', { class: 'muted' }, ['Outcome codes come from a fixed list and are stored as discrete values, not free text. A case here is one logged interaction.'])
      ]), { note: 'Value recorded is the payment taken or promise made on the log. Which value Finance wants per outcome is to be agreed; the report would read it from the structured outcome fields in the case-management database.' });
    }
  });

  // ---------- US-16 reconciliation ----------

  var RECON_STATES = ['Matched', 'Amount differs', 'Payment not successful', 'Unmatched payment', 'Unmatched settlement'];

  // Lines: one per provider settlement (paired with its payment when linked) plus successful payments with no settlement.
  function reconLines(f) {
    var payments = Store.get('payments');
    var settlements = Store.get('settlements');
    var settledIds = {};
    var lines = [];

    settlements.forEach(function (s) {
      var p = s.matchedPaymentId ? Store.find('payments', s.matchedPaymentId) : null;
      var line = {
        paymentId: p ? p.id : '', reference: p ? p.reference : '', customer: p ? acctLabel(p.customerId) : '',
        paymentDate: p ? p.date : null, paymentAmount: p ? r2(p.amount) : null, channel: p ? p.channel : '',
        settlementId: s.id, providerRef: s.providerRef, settlementDate: s.date, settlementAmount: r2(s.amount), difference: null, status: '', note: ''
      };
      if (p) {
        settledIds[p.id] = true;
        line.difference = r2(s.amount - p.amount);
        if (p.status !== 'success') { line.status = 'Payment not successful'; line.note = 'Provider settled money for a payment recorded as ' + p.status + (p.reasonCategory ? ' (' + p.reasonCategory + ')' : '') + '.'; }
        else if (cents(p.amount) !== cents(s.amount)) { line.status = 'Amount differs'; line.note = 'Settled amount is not the amount posted.'; }
        else { line.status = 'Matched'; }
      } else {
        line.status = 'Unmatched settlement';
        var hint = payments.filter(function (x) {
          return x.status === 'failed' && cents(x.amount) === cents(s.amount) && !settlements.some(function (o) { return o.matchedPaymentId === x.id; });
        }).map(function (x) { return x.id + ' (' + acctLabel(x.customerId) + ', failed: ' + (x.reasonCategory || 'no reason') + ')'; });
        line.note = hint.length ? 'Possible match: ' + hint.join('; ') + '.' : 'No system payment found for this settlement.';
      }
      lines.push(line);
    });

    payments.forEach(function (p) {
      if (p.status !== 'success' || settledIds[p.id]) { return; }
      lines.push({
        paymentId: p.id, reference: p.reference, customer: acctLabel(p.customerId), paymentDate: p.date, paymentAmount: r2(p.amount),
        channel: p.channel, settlementId: '', providerRef: '', settlementDate: null, settlementAmount: null, difference: null,
        status: 'Unmatched payment', note: 'Awaiting provider settlement.'
      });
    });

    return lines.filter(function (l) {
      return (!f.state || l.status === f.state) && inRange(l.paymentDate || l.settlementDate, f.from, f.to);
    }).sort(function (a, b) {
      var x = String(a.paymentDate || a.settlementDate);
      var y = String(b.paymentDate || b.settlementDate);
      return x < y ? 1 : (x > y ? -1 : 0);
    });
  }

  function reconTable(lines, columns, empty) {
    var mount = el('div');
    UI.table(mount, { columns: columns, rows: lines, empty: empty });
    return mount;
  }

  Reports.register({
    id: 'reconciliation',
    title: 'Payment reconciliation',
    stories: ['US-16'],
    description: 'System payments against provider settlements. Unmatched items are listed separately.',
    filters: [
      { key: 'from', label: 'Date from', type: 'date-from' },
      { key: 'to', label: 'Date to', type: 'date-to' },
      { key: 'state', label: 'Match status', type: 'select', options: RECON_STATES }
    ],
    columns: [
      { key: 'status', label: 'Status', format: function (v) { return statusBadge(v); } },
      { key: 'reference', label: 'Payment reference' },
      { key: 'customer', label: 'Customer' },
      { key: 'paymentDate', label: 'Payment date', format: function (v) { return Fmt.date(v); } },
      { key: 'paymentAmount', label: 'System amount', format: function (v) { return Fmt.money(v); } },
      { key: 'channel', label: 'Channel' },
      { key: 'providerRef', label: 'Provider reference' },
      { key: 'settlementDate', label: 'Settlement date', format: function (v) { return Fmt.date(v); } },
      { key: 'settlementAmount', label: 'Settled amount', format: function (v) { return Fmt.money(v); } },
      { key: 'difference', label: 'Difference', format: function (v) { return Fmt.money(v); } },
      { key: 'note', label: 'Note' }
    ],
    rows: function (f) { return reconLines(f); },
    summary: function (rows) {
      var matched = rows.filter(function (r) { return r.status === 'Matched'; });
      var up = rows.filter(function (r) { return r.status === 'Unmatched payment'; });
      var us = rows.filter(function (r) { return r.status === 'Unmatched settlement'; });
      var other = rows.filter(function (r) { return r.status === 'Amount differs' || r.status === 'Payment not successful'; });
      return [
        { label: 'Matched', value: matched.length, note: Fmt.money(total(matched, 'paymentAmount')), kind: 'ok' },
        { label: 'Unmatched system payments', value: up.length, note: Fmt.money(total(up, 'paymentAmount')), kind: up.length ? 'warn' : 'ok' },
        { label: 'Unmatched settlements', value: us.length, note: Fmt.money(total(us, 'settlementAmount')), kind: us.length ? 'warn' : 'ok' },
        { label: 'Amount exceptions', value: other.length, kind: other.length ? 'warn' : 'ok' }
      ];
    },
    panel: function (ctx) {
      var lines = reconLines(ctx.filters);
      var matched = lines.filter(function (l) { return l.status === 'Matched'; });
      var unmatchedPayments = lines.filter(function (l) { return l.status === 'Unmatched payment'; });
      var unmatchedSettlements = lines.filter(function (l) {
        return l.status === 'Unmatched settlement' || l.status === 'Amount differs' || l.status === 'Payment not successful';
      });
      var paymentCols = [
        { key: 'reference', label: 'Payment reference' }, { key: 'customer', label: 'Customer' },
        { key: 'paymentDate', label: 'Date', format: function (v) { return Fmt.date(v); } },
        { key: 'paymentAmount', label: 'Amount', format: function (v) { return Fmt.money(v); } },
        { key: 'channel', label: 'Channel' }, { key: 'note', label: 'Note' }
      ];
      var settlementCols = [
        { key: 'status', label: 'Status', format: function (v) { return statusBadge(v); } },
        { key: 'providerRef', label: 'Provider reference' },
        { key: 'settlementDate', label: 'Date', format: function (v) { return Fmt.date(v); } },
        { key: 'settlementAmount', label: 'Settled amount', format: function (v) { return Fmt.money(v); } },
        { key: 'reference', label: 'Payment reference' }, { key: 'note', label: 'Note' }
      ];
      var body = el('div', { class: 'stack' }, [
        matchLine('Matched system payments', total(matched, 'paymentAmount'), 'their provider settlements', total(matched, 'settlementAmount')),
        el('div', { class: 'notice notice--info' }, ['A new portal payment appears as an unmatched system payment until the provider settlement arrives.']),
        el('p', null, ['Reconciliation frequency: ', UI.tbd('Reconciliation frequency', 'Daily'), '. Report run at ' + Fmt.datetime(ctx.now) + '.']),
        el('h3', null, ['Unmatched system payments (' + unmatchedPayments.length + ')']),
        reconTable(unmatchedPayments, paymentCols, 'Every successful system payment in this range has a provider settlement.'),
        el('h3', null, ['Unmatched or differing provider settlements (' + unmatchedSettlements.length + ')']),
        reconTable(unmatchedSettlements, settlementCols, 'Every provider settlement in this range is matched to a system payment.')
      ]);
      return UI.panel('Unmatched items', body, { note: 'A scheduled job would import the provider\'s settlement file or API feed and match each line to a payment by provider reference. Anything it cannot match is listed here for Finance to chase.' });
    }
  });

  // ---------- US-27 fulfilment value ----------

  // Aggregates checked promises by period and result; the period is chosen by the filter.
  function fulfilmentGroups(f) {
    var groups = {};
    Store.get('promises').filter(function (p) {
      return RESULTS.indexOf(p.status) >= 0 && inRange(p.dueDate, f.from, f.to) && (!f.result || p.status === f.result);
    }).forEach(function (p) {
      var per = periodOf(p.dueDate, f.period);
      var key = per.sort + '|' + p.status;
      if (!groups[key]) { groups[key] = { sort: per.sort, period: per.label, result: p.status, count: 0, promised: 0, received: 0, shortfall: 0, paid: 0 }; }
      var g = groups[key];
      g.count += 1;
      g.promised += Number(p.amount) || 0;
      g.received += Number(p.received) || 0;
      g.shortfall += Number(p.shortfall) || 0;
      g.paid += paidInWindow(p);
    });
    return Object.keys(groups).map(function (k) {
      var g = groups[k];
      return { sort: g.sort, period: g.period, result: g.result, count: g.count, promised: r2(g.promised), received: r2(g.received), shortfall: r2(g.shortfall), paid: r2(g.paid) };
    }).sort(function (a, b) {
      if (a.sort !== b.sort) { return a.sort < b.sort ? 1 : -1; }
      return RESULTS.indexOf(a.result) - RESULTS.indexOf(b.result);
    });
  }

  function periodOf(iso, mode) {
    var d = day(iso);
    if (mode === 'Monthly') { return { sort: d.slice(0, 7), label: Fmt.date(d.slice(0, 7) + '-01').slice(3) }; }
    if (mode === 'Weekly') {
      var p = d.split('-');
      var t = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
      var monday = Clock.addDays(d, -((t.getUTCDay() + 6) % 7));
      return { sort: monday, label: 'Week of ' + Fmt.date(monday) };
    }
    return { sort: '0', label: 'All dates in range' };
  }

  Reports.register({
    id: 'fulfilment-value',
    title: 'Promise fulfilment value',
    stories: ['US-27'],
    description: 'Count and value of promises by fulfilment result and reporting period, reconciled to payments.',
    filters: [
      { key: 'from', label: 'Promise due from', type: 'date-from' },
      { key: 'to', label: 'Promise due to', type: 'date-to' },
      { key: 'period', label: 'Reporting period', type: 'select', options: ['Weekly', 'Monthly'] },
      { key: 'result', label: 'Result', type: 'select', options: RESULTS }
    ],
    columns: [
      { key: 'period', label: 'Period' },
      { key: 'result', label: 'Result', format: function (v) { return statusBadge(v); } },
      { key: 'count', label: 'Promises' },
      { key: 'promised', label: 'Promised', format: function (v) { return Fmt.money(v); } },
      { key: 'received', label: 'Received (per check)', format: function (v) { return Fmt.money(v); } },
      { key: 'shortfall', label: 'Shortfall', format: function (v) { return Fmt.money(v); } },
      { key: 'paid', label: 'Payments in promise windows', format: function (v) { return Fmt.money(v); } }
    ],
    rows: function (f) { return fulfilmentGroups(f); },
    summary: function (rows) {
      var cards = RESULTS.map(function (r) {
        var rs = rows.filter(function (x) { return x.result === r; });
        var n = rs.reduce(function (t, x) { return t + x.count; }, 0);
        return { label: r, value: n, note: Fmt.money(total(rs, 'received')) + ' received of ' + Fmt.money(total(rs, 'promised')) + ' promised', kind: r === 'Not fulfilled' && n ? 'warn' : null };
      });
      cards.push({ label: 'Value recovered', value: Fmt.money(total(rows, 'received')), kind: 'ok' });
      return cards;
    },
    panel: function (ctx) {
      var rows = fulfilmentGroups(ctx.filters);
      var waiting = Store.get('promises').filter(function (p) { return p.status === 'Active' && day(p.dueDate) <= ctx.today; }).length;
      return UI.panel('Reconciliation to payments', el('div', { class: 'stack' }, [
        matchLine('Value received per fulfilment check', total(rows, 'received'), 'successful payments in the promise windows', total(rows, 'paid')),
        el('p', null, ['Default reporting period: ', UI.tbd('Default reporting period', 'whole range'), '. Choose Weekly or Monthly above to group the results.']),
        el('p', { class: 'muted' }, [waiting + (waiting === 1 ? ' promise is' : ' promises are') + ' due but not yet checked. They appear here after the fulfilment check runs.'])
      ]), { note: 'The window for a promise runs from the moment it was made to its fulfilment check (or the end of its due date until it is checked). In production the same rule is applied by the fulfilment-check job and by this report, reading payments from the provider feed.' });
    }
  });

  // ---------- US-38 promise forecast ----------

  function forecastRows(f) {
    var today = Clock.today();
    return Store.get('promises').filter(function (p) {
      return p.status !== 'Superseded' && inRange(p.dueDate, f.from, f.to) && (!f.status || p.status === f.status);
    }).map(function (p) {
      var past = day(p.dueDate) < today;
      var paid = paidInWindow(p);
      var checked = RESULTS.indexOf(p.status) >= 0;
      var received = past || checked ? (checked ? r2(p.received) : paid) : null;
      return {
        reference: p.reference || p.id, customer: acctLabel(p.customerId), createdAt: p.createdAt, dueDate: p.dueDate,
        timing: past ? 'Past' : (day(p.dueDate) === today ? 'Due today' : 'Upcoming'), amount: r2(p.amount), status: p.status,
        received: received, shortfall: received === null ? null : r2(Math.max(0, p.amount - received)), paid: paid, past: past
      };
    }).sort(function (a, b) { return String(a.dueDate) < String(b.dueDate) ? -1 : (String(a.dueDate) > String(b.dueDate) ? 1 : 0); });
  }

  Reports.register({
    id: 'promise-forecast',
    title: 'Promise forecast',
    stories: ['US-38'],
    description: 'Promised amounts by due date for the chosen period, with past promises compared to what was received.',
    filters: [
      { key: 'from', label: 'Due from', type: 'date-from' },
      { key: 'to', label: 'Due to', type: 'date-to' },
      { key: 'status', label: 'Promise status', type: 'select', options: ['Active', 'Fulfilled', 'Partially fulfilled', 'Not fulfilled'] }
    ],
    columns: [
      { key: 'reference', label: 'Promise' },
      { key: 'customer', label: 'Customer' },
      { key: 'dueDate', label: 'Due date', format: function (v) { return Fmt.date(v); } },
      { key: 'timing', label: 'Timing' },
      { key: 'status', label: 'Status', format: function (v) { return v === 'Active' ? UI.badge(v) : statusBadge(v); } },
      { key: 'amount', label: 'Promised', format: function (v) { return Fmt.money(v); } },
      { key: 'received', label: 'Received', format: function (v) { return Fmt.money(v); } },
      { key: 'shortfall', label: 'Shortfall', format: function (v) { return Fmt.money(v); } }
    ],
    rows: function (f) { return forecastRows(f); },
    summary: function (rows) {
      var past = rows.filter(function (r) { return r.past; });
      var upcoming = rows.filter(function (r) { return !r.past; });
      var promisedPast = total(past, 'amount');
      var receivedPast = total(past, 'received');
      return [
        { label: 'Total promised (period)', value: Fmt.money(total(rows, 'amount')), note: rows.length + ' promises' },
        { label: 'Still to come (due today or later)', value: Fmt.money(total(upcoming, 'amount')), note: upcoming.length + ' promises' },
        { label: 'Past promised', value: Fmt.money(promisedPast), note: past.length + ' promises' },
        { label: 'Past received', value: Fmt.money(receivedPast), note: promisedPast ? Math.round(receivedPast * 1000 / promisedPast) / 10 + '% of promised' : 'No past promises' }
      ];
    },
    panel: function (ctx) {
      var rows = forecastRows(ctx.filters).filter(function (r) { return r.past; });
      return UI.panel('Data freshness and reconciliation', el('div', { class: 'stack' }, [
        matchLine('Past received', total(rows, 'received'), 'successful payments in the promise windows', total(rows, 'paid')),
        el('p', { class: 'muted' }, ['Data as of ' + Fmt.datetime(ctx.now) + '. Superseded promises are excluded so nothing is counted twice. Use "Refresh" after payments or checks have run.'])
      ]), { note: 'A forecast like this would read promises and payments from the reporting copy of the database. "Refresh" re-reads it on demand.' });
    },
    actions: [{
      label: 'Refresh',
      run: function () {
        return el('div', { class: 'notice notice--ok' }, ['Forecast refreshed at ' + Fmt.datetime(Clock.now()) + '.']);
      }
    }]
  });
})();
