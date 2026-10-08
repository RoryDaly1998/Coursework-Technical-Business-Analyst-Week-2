/* jobs page script (US-24, 29, 48, 50, 52, 53): run and monitor the fulfilment check and the reminder job. Layout supplies the h1 and the role guard. */
Layout.ready(function (main) {
  'use strict';

  var el = UI.el;
  var historyFilter = '';

  var settingsMount = el('div');
  var pendingMount = el('div');
  var fulfilOut = el('div');
  var remindOut = el('div');
  var historyMount = el('div');
  var alertsMount = el('div');

  function customerOf(id) { return Store.find('customers', id); }

  function label(c) { return c ? c.accountNo + ' - ' + c.name : 'Unknown customer'; }

  function outboxLink(accountNo, text) {
    return el('a', { href: 'outbox.html?acct=' + encodeURIComponent(accountNo) }, [text]);
  }

  function kv(pairs) {
    var dl = el('dl', { class: 'kv' });
    pairs.forEach(function (p) { dl.appendChild(el('dt', null, [p[0]])); dl.appendChild(el('dd', null, [p[1]])); });
    return dl;
  }

  function tbdFor(key) {
    var s = Store.settings()[key] || {};
    return UI.tbd(s.label || key, Services.setting(key));
  }

  function resultBadge(result) {
    return UI.badge(result, result === 'Fulfilled' ? 'ok' : (result === 'Not fulfilled' ? 'err' : 'warn'));
  }

  function statusBadge(status) {
    var kind = status === 'success' || status === 'delivered' ? 'ok' : (status === 'bounced' || status === 'failed' ? 'err' : 'warn');
    return UI.badge(status, kind);
  }

  function numId(id) { return parseInt(String(id).replace(/^.*-/, ''), 10) || 0; }

  // ---------- settings and pending work ----------

  function renderSettings() {
    settingsMount.textContent = '';
    settingsMount.appendChild(UI.panel('Settings the jobs use', kv([
      ['Automatic retries for a failed run', tbdFor('jobRetries')],
      ['Run must succeed by', tbdFor('jobDeadline')],
      ['Reminder lead time (days before due date)', tbdFor('reminderDaysBefore')],
      ['Contact limit per customer', tbdFor('contactLimit')],
      ['Reminder failure rate that raises an alert (%)', tbdFor('failureRateThreshold')]
    ])));
  }

  function renderPending() {
    pendingMount.textContent = '';
    var promises = Jobs.pendingFulfilment();
    var due = Jobs.dueReminders();
    var unsent = Store.filter('reminderSchedule', function (r) { return !r.sent; });
    pendingMount.appendChild(UI.statCards([
      { label: 'Promises due and not yet checked', value: promises.length, note: promises.length ? promises.map(function (p) { var c = customerOf(p.customerId); return c ? c.accountNo : ''; }).join(', ') : 'Nothing waiting' },
      { label: 'Reminders due to send', value: due.length, note: 'of ' + unsent.length + ' scheduled and unsent' }
    ]));
  }

  // ---------- fulfilment check ----------

  function renderFulfilment(res) {
    fulfilOut.textContent = '';
    var parts = [];
    if (res.ok) {
      parts.push(el('div', { class: 'notice notice--ok' }, [
        'Run completed on attempt ' + res.attempts.length + ' of up to ' + res.maxAttempts + '. ' + res.processed +
        (res.processed === 1 ? ' promise' : ' promises') + ' processed.'
      ]));
    } else {
      parts.push(el('div', { class: 'notice notice--error' }, [
        'The run failed on all ' + res.maxAttempts + ' attempts (1 run plus ' + res.retries + ' automatic ' + (res.retries === 1 ? 'retry' : 'retries') + '). No promises were changed.'
      ]));
    }
    if (res.alert) {
      parts.push(el('div', { class: 'notice notice--warn' }, [
        el('strong', null, ['Alert raised (' + res.alert.id + '): ']), res.alert.detail
      ]));
    }

    var attemptsMount = el('div');
    UI.table(attemptsMount, {
      columns: [
        { key: 'attempt', label: 'Attempt' },
        { key: 'startedAt', label: 'Started', format: function (v) { return Fmt.datetime(v); } },
        { key: 'endedAt', label: 'Ended', format: function (v) { return Fmt.datetime(v); } },
        { key: 'processed', label: 'Records processed' },
        { key: 'status', label: 'Status', format: function (v) { return statusBadge(v); } },
        { key: 'note', label: 'Note' }
      ],
      rows: res.attempts,
      empty: 'No attempts recorded.'
    });
    parts.push(UI.panel('Attempts in this run', attemptsMount));

    if (res.ok) {
      var count = function (name) { return res.results.filter(function (r) { return r.result === name; }).length; };
      parts.push(UI.statCards([
        { label: 'Processed', value: res.processed },
        { label: 'Fulfilled', value: count('Fulfilled') },
        { label: 'Partially fulfilled', value: count('Partially fulfilled'), kind: count('Partially fulfilled') ? 'warn' : null },
        { label: 'Not fulfilled', value: count('Not fulfilled'), kind: count('Not fulfilled') ? 'warn' : null }
      ]));
      var resultsMount = el('div');
      UI.table(resultsMount, {
        columns: [
          { key: 'name', label: 'Customer', format: function (v, r) { return r.accountNo + ' - ' + v; } },
          { key: 'amount', label: 'Promised', format: function (v) { return Fmt.money(v); } },
          { key: 'received', label: 'Received', format: function (v) { return Fmt.money(v); } },
          { key: 'shortfall', label: 'Shortfall', format: function (v) { return Fmt.money(v); } },
          { key: 'result', label: 'Result', format: function (v) { return resultBadge(v); } },
          {
            key: 'message', label: 'Customer message', format: function (v, r) {
              if (!v) { return 'None'; }
              return v.id ? el('span', null, ['Missing-payment message ' + v.status + ' ', outboxLink(r.accountNo, '(open outbox)')]) : 'Not sent: ' + v.note;
            }
          },
          {
            key: 'resumed', label: 'Follow-ups', format: function (v, r) {
              var bits = [];
              if (r.resumed) { bits.push('Resumed ' + r.resumed); }
              if (r.closed) { bits.push('Closed ' + r.closed); }
              return bits.length ? bits.join(', ') : 'No change';
            }
          }
        ],
        rows: res.results,
        empty: 'No promises were checked in this run. Promises already checked are never checked again, so running it twice is safe.'
      });
      parts.push(UI.panel('Results by customer', resultsMount, {
        note: 'Each result is also written to the customer\'s case log as a fulfilment entry and shows on the staff record.'
      }));
    }
    fulfilOut.appendChild(el('div', { class: 'stack' }, parts));
  }

  function fulfilmentPanel() {
    var form = el('form', { novalidate: true });
    form.appendChild(UI.field({
      label: 'Simulate failure', name: 'simulate', type: 'select', value: '',
      options: [
        { value: '', label: 'No failure (normal run)' },
        { value: '1', label: 'Fail once, then succeed on the automatic retry' },
        { value: 'all', label: 'Fail every attempt (retries run out and an alert is raised)' }
      ],
      help: 'Demo control for the monitoring story. A failed run is retried automatically up to the retry limit.'
    }));
    form.appendChild(el('div', { class: 'row' }, [el('button', { type: 'submit', class: 'btn btn--primary' }, ['Run fulfilment check'])]));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.readForm(form).simulate;
      var failure = v === 'all' ? true : (v === '1' ? 1 : false);
      try {
        renderFulfilment(Jobs.runFulfilmentCheck({ simulateFailure: failure }));
      } catch (err) {
        fulfilOut.textContent = '';
        fulfilOut.appendChild(el('div', { class: 'notice notice--error' }, ['The fulfilment check could not run: ' + err.message]));
      }
      renderPending();
      renderHistory();
      renderAlerts();
    });
    return UI.panel('Fulfilment check (promises to pay)', el('div', { class: 'stack' }, [
      el('p', null, ['Checks every Active promise due today or earlier that has not been checked: it adds up successful payments since the promise was made and sets Fulfilled, Partially fulfilled or Not fulfilled.']),
      form,
      fulfilOut
    ]), {
      note: 'A scheduler would start this job each morning. If a run fails it is retried automatically, and an alert goes to on-call if it still has not succeeded by the agreed deadline.'
    });
  }

  // ---------- reminders ----------

  function renderReminders(res) {
    remindOut.textContent = '';
    var parts = [];
    parts.push(el('div', { class: 'notice notice--ok' }, [
      'Reminder job finished: ' + res.sent.length + ' sent, ' + res.skipped.length + ' skipped' +
      (res.notDue ? ', ' + res.notDue + ' not yet due' : '') + (res.scheduled ? ', ' + res.scheduled + ' newly scheduled' : '') + '.'
    ]));
    if (res.alert) {
      parts.push(el('div', { class: 'notice notice--warn' }, [
        el('strong', null, ['Alert raised (' + res.alert.id + '): ']), res.alert.detail
      ]));
    }
    parts.push(UI.statCards([
      { label: 'Evaluated', value: res.evaluated },
      { label: 'Sent', value: res.sent.length },
      { label: 'Skipped', value: res.skipped.length, kind: res.skipped.length ? 'warn' : null },
      { label: 'Failure rate', value: res.failureRate + '%', note: 'threshold ' + res.threshold + '%', kind: res.alert ? 'warn' : null }
    ]));

    var sentMount = el('div');
    UI.table(sentMount, {
      columns: [
        { key: 'name', label: 'Customer', format: function (v, r) { return r.accountNo + ' - ' + v; } },
        { key: 'channel', label: 'Channel' },
        { key: 'templateId', label: 'Template', format: function (v, r) { return v + ' (version ' + r.templateVersion + ', Approved)'; } },
        { key: 'amount', label: 'Amount', format: function (v) { return Fmt.money(v); } },
        { key: 'dueDate', label: 'Due date', format: function (v) { return Fmt.date(v); } },
        { key: 'status', label: 'Delivery', format: function (v) { return statusBadge(v); } },
        { key: 'messageId', label: 'Message', format: function (v, r) { return outboxLink(r.accountNo, v + ' (open outbox)'); } }
      ],
      rows: res.sent,
      empty: 'No reminders were sent in this run.'
    });
    parts.push(UI.panel('Sent', sentMount, {
      note: 'Each send adds a reminder entry (date, channel, template) to the customer\'s account history automatically, and the message carries pay, contact and unsubscribe links.'
    }));

    var skippedMount = el('div');
    UI.table(skippedMount, {
      columns: [
        { key: 'name', label: 'Customer', format: function (v, r) { return (r.accountNo ? r.accountNo + ' - ' : '') + v; } },
        { key: 'reason', label: 'Reason skipped' }
      ],
      rows: res.skipped,
      empty: 'No customers were skipped.'
    });
    parts.push(UI.panel('Skipped', skippedMount));
    remindOut.appendChild(el('div', { class: 'stack' }, parts));
  }

  function remindersPanel() {
    var schedule = el('button', {
      type: 'button', class: 'btn', onclick: function () {
        var res = Jobs.scheduleReminders();
        UI.toast(res.created.length
          ? res.created.length + ' reminder(s) scheduled, ' + res.days + ' days before the due date.'
          : 'Nothing new to schedule: every due date already has a reminder.', res.created.length ? 'ok' : 'info');
        renderPending();
      }
    }, ['Schedule reminders']);
    var run = el('button', {
      type: 'button', class: 'btn btn--primary', onclick: function () {
        try {
          renderReminders(Jobs.runReminders());
        } catch (err) {
          remindOut.textContent = '';
          remindOut.appendChild(el('div', { class: 'notice notice--error' }, ['The reminder job could not run: ' + err.message]));
        }
        renderPending();
        renderHistory();
        renderAlerts();
      }
    }, ['Run reminder job']);
    return UI.panel('Reminder job', el('div', { class: 'stack' }, [
      el('p', null, [
        'Sends a reminder to each customer whose due date minus the scheduled lead time has arrived. It skips customers with a zero balance, an opt-out, no valid contact detail or ' +
        'no approved template, and customers who have reached the contact limit (reminders count towards it). Only Approved template versions are used.'
      ]),
      el('div', { class: 'row' }, [schedule, run]),
      remindOut
    ]), {
      note: 'In production the job would hand messages to the email/SMS provider and read delivery statuses back from its webhook; a bounce flags the address on the customer record.'
    });
  }

  // ---------- history and alerts ----------

  function renderHistory() {
    var rows = Store.filter('jobRuns', function (r) { return !historyFilter || r.job === historyFilter; }).sort(function (a, b) {
      var s = String(b.startedAt).localeCompare(String(a.startedAt));
      return s !== 0 ? s : numId(b.id) - numId(a.id);
    });
    var body = el('div');
    UI.table(body, {
      columns: [
        { key: 'id', label: 'Run' },
        { key: 'job', label: 'Job' },
        { key: 'attempt', label: 'Attempt' },
        { key: 'startedAt', label: 'Start', format: function (v) { return Fmt.datetime(v); } },
        { key: 'endedAt', label: 'End', format: function (v) { return Fmt.datetime(v); } },
        { key: 'processed', label: 'Records processed' },
        { key: 'status', label: 'Status', format: function (v) { return statusBadge(v); } },
        { key: 'note', label: 'Note' }
      ],
      rows: rows,
      empty: 'No runs recorded for this job.'
    });
    historyMount.textContent = '';
    historyMount.appendChild(UI.panel('Run history', el('div', { class: 'stack' }, [
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-field__label', for: 'jobs-history-filter' }, ['Show']),
        el('select', {
          class: 'select', id: 'jobs-history-filter', onchange: function (e) { historyFilter = e.target.value; renderHistory(); }
        }, [
          el('option', { value: '', selected: historyFilter === '' }, ['All jobs']),
          el('option', { value: 'fulfilment-check', selected: historyFilter === 'fulfilment-check' }, ['Fulfilment check']),
          el('option', { value: 'reminders', selected: historyFilter === 'reminders' }, ['Reminders'])
        ])
      ]),
      body
    ])));
  }

  function renderAlerts() {
    var rows = Store.filter('alerts', function (a) { return a.type === 'job-failed' || a.type === 'reminder-failure-rate'; }).sort(function (a, b) {
      var s = String(b.at).localeCompare(String(a.at));
      return s !== 0 ? s : numId(b.id) - numId(a.id);
    });
    var body = el('div');
    UI.table(body, {
      columns: [
        { key: 'at', label: 'Raised', format: function (v) { return Fmt.datetime(v); } },
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity' },
        { key: 'detail', label: 'Detail' }
      ],
      rows: rows,
      empty: 'No job alerts.'
    });
    alertsMount.textContent = '';
    alertsMount.appendChild(UI.panel('Job alerts', body));
  }

  renderSettings();
  renderPending();
  renderHistory();
  renderAlerts();

  main.appendChild(el('div', { class: 'stack' }, [
    el('div', { class: 'notice notice--info' }, [
      'Use "Advance day" in the header to move the demo clock forward so more promises fall due and more reminders become due. Reset demo data starts again.'
    ]),
    settingsMount,
    pendingMount,
    fulfilmentPanel(),
    remindersPanel(),
    historyMount,
    alertsMount,
    UI.panel('Related reports', el('div', { class: 'row' }, [
      el('a', { class: 'btn', href: 'reports.html?r=reminder-delivery' }, ['Reminder delivery report']),
      el('a', { class: 'btn', href: 'reports.html?r=lockouts-alerts' }, ['Lockouts and alerts report'])
    ]))
  ]));
});
