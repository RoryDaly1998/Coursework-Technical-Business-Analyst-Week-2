/* reminders-config page script (US-51): a team leader sets how many days before the due date reminders go out. Layout supplies the h1 and the role guard. */
Layout.ready(function (main) {
  'use strict';

  var el = UI.el;
  var KEY = 'reminderDaysBefore';

  var statusMount = el('div');
  var formMount = el('div');
  var existingMount = el('div');
  var newMount = el('div');
  var historyMount = el('div');
  var demoMount = el('div');

  function setting() { return Store.settings()[KEY] || {}; }
  function minDays() { return isFinite(Number(setting().min)) && setting().min !== null ? Number(setting().min) : 1; }
  function maxDays() { return isFinite(Number(setting().max)) && setting().max !== null ? Number(setting().max) : 14; }
  function currentDays() { return Number(Services.setting(KEY, 3)); }

  function customerOf(id) { return Store.find('customers', id); }

  function label(c) { return c ? c.accountNo + ' - ' + c.name : 'Unknown customer'; }

  // Audit before/after values are objects such as {value: 3}.
  function valueText(v) {
    return v && typeof v === 'object' ? Object.keys(v).map(function (k) { return k + '=' + v[k]; }).join('; ') : '';
  }

  function renderStatus() {
    statusMount.textContent = '';
    statusMount.appendChild(UI.panel('Current timing', el('div', { class: 'stack' }, [
      el('p', null, [
        'Reminders are sent ', el('strong', null, [currentDays() + (currentDays() === 1 ? ' day' : ' days')]), ' before the due date ',
        UI.tbd('Reminder lead time before the due date', currentDays()), '. Allowed range: ' + minDays() + ' to ' + maxDays() + ' days.'
      ]),
      UI.howItWorks('The setting is stored in the configuration service. A change affects only reminders scheduled after it; reminders already in the schedule keep the timing they were created with.')
    ])));
  }

  // Returns an error message for the typed value, or null when it is a whole number within the allowed range.
  function check(raw) {
    if (raw === '') { return 'Enter the number of days.'; }
    if (!/^\d+$/.test(raw)) { return 'Enter a whole number of days, for example 3.'; }
    var n = Number(raw);
    if (n < minDays() || n > maxDays()) { return 'Days before the due date must be between ' + minDays() + ' and ' + maxDays() + '.'; }
    return null;
  }

  function renderForm() {
    formMount.textContent = '';
    var form = el('form', { novalidate: true });
    form.appendChild(UI.field({
      label: 'Days before the due date', name: 'days', type: 'number', required: true, value: currentDays(),
      help: 'Whole number from ' + minDays() + ' to ' + maxDays() + '.', attrs: { min: String(minDays()), max: String(maxDays()), step: '1' }
    }));
    form.appendChild(el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save timing']),
      el('button', { type: 'button', class: 'btn', onclick: function () { runSchedule(); } }, ['Schedule reminders now'])
    ]));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = UI.readForm(form).days;
      var err = check(raw);
      if (err) { UI.showErrors(form, { days: err }); return; }
      UI.showErrors(form, {});
      var next = Number(raw);
      var old = currentDays();
      if (next === old) { UI.toast('The timing is already ' + old + ' days. Nothing changed.', 'warn'); return; }
      var row = Services.updateSetting(KEY, next,
        'Existing scheduled reminders keep their timing; applies to reminders scheduled after this change.');
      UI.toast('Saved: reminders will now be scheduled ' + next + ' days before the due date.', 'ok');
      renderStatus();
      renderForm();
      renderTables();
      renderHistory();
      statusMount.appendChild(el('div', { class: 'notice notice--ok' }, [
        'Change logged by ' + row.userLabel + ' at ' + Fmt.datetime(row.at) + ': ' + old + ' to ' + next + ' days. Reminders already scheduled keep ' + old + ' days.'
      ]));
    });
    formMount.appendChild(UI.panel('Change the timing', form));
  }

  function runSchedule() {
    var res = Jobs.scheduleReminders();
    UI.toast(res.created.length
      ? res.created.length + ' reminder(s) scheduled with ' + res.days + ' days before the due date.'
      : 'Nothing new to schedule: every due date already has a reminder scheduled.', res.created.length ? 'ok' : 'info');
    renderTables();
  }

  // Demo only: existing due dates already have a schedule row, so a new timing can never apply to them until due dates move on.
  function runNextCycle() {
    var moved = Jobs.rollDueDates(30);
    var res = Jobs.scheduleReminders();
    UI.toast(moved.moved.length + ' due date(s) moved forward 30 days; ' + res.created.length + ' reminder(s) scheduled ' + res.days + ' days before the new due date.', 'ok');
    renderTables();
  }

  function renderDemo() {
    demoMount.textContent = '';
    demoMount.appendChild(UI.panel('Demo: next billing cycle', el('div', { class: 'stack' }, [
      el('p', null, [
        'Every customer already has a reminder scheduled for their current due date, so a new timing cannot apply to them. ' +
        'This demo control moves due dates forward and schedules reminders for the new dates with the current timing. The old, unsent reminders stay in the first table with their old timing.'
      ]),
      el('div', { class: 'row' }, [
        el('button', { type: 'button', class: 'btn', onclick: runNextCycle }, ['Demo: start next billing cycle (move due dates forward 30 days)'])
      ])
    ])));
  }

  function renderTables() {
    var days = currentDays();

    var existing = Store.filter('reminderSchedule', function (r) { return !r.sent; }).sort(function (a, b) {
      return String(a.sendDate || a.dueDate).localeCompare(String(b.sendDate || b.dueDate));
    });
    var t1 = el('div');
    UI.table(t1, {
      columns: [
        { key: 'customerId', label: 'Customer', format: function (v) { return label(customerOf(v)); } },
        { key: 'dueDate', label: 'Due date', format: function (v) { return Fmt.date(v); } },
        { key: 'daysBefore', label: 'Days before' },
        { key: 'sendDate', label: 'Send date', format: function (v) { return Fmt.date(v); } },
        {
          key: 'id', label: 'Timing', format: function (v, r) {
            return Number(r.daysBefore) === days ? UI.badge('Matches current setting') : UI.badge('Old timing kept', 'warn');
          }
        }
      ],
      rows: existing,
      empty: 'No reminders are waiting in the schedule.'
    });
    existingMount.textContent = '';
    existingMount.appendChild(UI.panel('Already scheduled (these keep their timing)', t1));

    var preview = Jobs.previewSchedule(days);
    var t2 = el('div');
    UI.table(t2, {
      columns: [
        { key: 'customerId', label: 'Customer', format: function (v) { return label(customerOf(v)); } },
        { key: 'dueDate', label: 'Due date', format: function (v) { return Fmt.date(v); } },
        {
          key: 'existing', label: 'Current schedule', format: function (v) {
            if (!v) { return 'Not scheduled'; }
            return v.daysBefore + ' days before, ' + (v.sent ? 'already sent' : 'sends ' + Fmt.date(v.sendDate));
          }
        },
        { key: 'sendDate', label: 'Send date with new timing', format: function (v) { return Fmt.date(v); } },
        {
          key: 'daysBefore', label: 'Applies', format: function (v, r) {
            return r.existing ? UI.badge('No: already scheduled', 'warn') : UI.badge('Yes: ' + v + ' days before', 'ok');
          }
        }
      ],
      rows: preview,
      empty: 'No customers have a due date.'
    });
    newMount.textContent = '';
    newMount.appendChild(UI.panel('Reminders scheduled after this change (new timing)', el('div', { class: 'stack' }, [
      el('p', { class: 'muted' }, [
        'Preview with ' + days + ' days before the due date. Only customers without a scheduled reminder for their due date, and any scheduled from now on, use this timing. ' +
        'Use "Schedule reminders now" to create them.'
      ]),
      t2
    ])));
  }

  function renderHistory() {
    var rows = Store.filter('audit', function (a) { return a.entity === 'setting' && a.entityId === KEY; }).sort(function (a, b) {
      return String(b.at).localeCompare(String(a.at));
    });
    var body = el('div');
    UI.table(body, {
      columns: [
        { key: 'at', label: 'When', format: function (v) { return Fmt.datetime(v); } },
        { key: 'userLabel', label: 'Changed by' },
        { key: 'before', label: 'Before', format: valueText },
        { key: 'after', label: 'After', format: valueText },
        { key: 'note', label: 'Note' }
      ],
      rows: rows,
      empty: 'No changes have been made yet.'
    });
    historyMount.textContent = '';
    historyMount.appendChild(UI.panel('Change log', body));
  }

  renderStatus();
  renderForm();
  renderDemo();
  renderTables();
  renderHistory();
  main.appendChild(el('div', { class: 'stack' }, [statusMount, formMount, demoMount, existingMount, newMount, historyMount]));
});
