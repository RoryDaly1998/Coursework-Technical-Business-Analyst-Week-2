// Follow-ups: rep's due and overdue list (US-31); leader's team overdue list with reassign (US-32).
Layout.ready(function (main) {
  'use strict';
  var el = UI.el;

  var user = Auth.user();
  var isLeader = Auth.role() === 'leader';
  var today = Clock.today();

  if (!user) {
    main.appendChild(el('div', { class: 'notice notice--error' }, ['No staff user is selected, so follow-ups cannot be listed.']));
    return;
  }
  if (isLeader && !user.team) {
    main.appendChild(el('div', { class: 'notice notice--error' }, ['This team leader has no team, so no team follow-ups can be listed.']));
    return;
  }

  var host = el('div', { class: 'stack' });
  main.appendChild(host);
  draw();

  function byDue(a, b) {
    var ka = String(a.dueDate) + ' ' + String(a.time || '');
    var kb = String(b.dueDate) + ' ' + String(b.time || '');
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  }

  function outcomeLabel(code) {
    var d = (Store.config('outcomeCodes') || []).filter(function (o) { return o.code === code; })[0];
    return d ? d.label : (code || '');
  }

  function daysOverdue(f) { return Math.max(0, Clock.diffDays(f.dueDate, today) || 0); }

  function customerCell(f) {
    var c = Store.find('customers', f.customerId);
    if (!c) { return 'Unknown customer'; }
    return el('a', { href: Staff.recordHref(c.accountNo) }, [c.name + ' (' + c.accountNo + ')']);
  }

  function dueText(f) { return Fmt.date(f.dueDate) + (f.time ? ' ' + f.time : ''); }

  function overdueBadge(f) {
    var d = daysOverdue(f);
    return d > 0 ? UI.badge(d + (d === 1 ? ' day overdue' : ' days overdue'), 'err') : UI.badge('Due today', 'warn');
  }

  function pausedTable(container, rows) {
    UI.table(container, {
      columns: [
        { key: 'customerId', label: 'Customer', format: function (v, r) { return customerCell(r); } },
        { key: 'dueDate', label: 'Original due', format: function (v, r) { return dueText(r); } },
        { key: 'pausedUntil', label: 'Status', format: function (v) { return UI.badge('Paused until ' + Fmt.date(v), 'warn'); } },
        { key: 'ownerId', label: 'Rep', format: function (v) { return Staff.userName(v); } },
        { key: 'outcomeCode', label: 'Outcome', format: function (v) { return outcomeLabel(v); } }
      ],
      rows: rows,
      empty: 'No paused follow-ups.'
    });
  }

  function draw() {
    host.textContent = '';
    if (isLeader) { drawLeader(); } else { drawRep(); }
  }

  // ---------- rep ----------

  function drawRep() {
    var mine = Store.filter('followups', function (f) { return f.ownerId === user.id; });
    var due = mine.filter(function (f) { return f.status === 'Open' && f.dueDate <= today; }).sort(byDue);
    var paused = mine.filter(function (f) { return f.status === 'Paused'; }).sort(byDue);
    var overdueCount = due.filter(function (f) { return f.dueDate < today; }).length;

    var dueHost = el('div');
    UI.table(dueHost, {
      columns: [
        { key: 'dueDate', label: 'Due', format: function (v, r) { return dueText(r); } },
        { key: 'status', label: 'Status', format: function (v, r) { return overdueBadge(r); } },
        { key: 'customerId', label: 'Customer', format: function (v, r) { return customerCell(r); } },
        { key: 'channel', label: 'Channel' },
        { key: 'outcomeCode', label: 'Outcome', format: function (v) { return outcomeLabel(v); } },
        {
          key: 'id', label: 'Action', format: function (v, r) {
            return el('button', {
              type: 'button', class: 'btn btn--small', onclick: function () {
                var res = Services.completeFollowup(r.id);
                UI.toast(res.ok ? 'Follow-up completed and removed from the list.' : res.error, res.ok ? 'ok' : 'error');
                draw();
              }
            }, ['Complete']);
          }
        }
      ],
      rows: due,
      empty: 'Nothing is due today and nothing is overdue.'
    });

    var pausedHost = el('div');
    pausedTable(pausedHost, paused);

    host.appendChild(UI.statCards([
      { label: 'Due or overdue', value: String(due.length) },
      { label: 'Overdue', value: String(overdueCount), kind: overdueCount ? 'warn' : null },
      { label: 'Paused', value: String(paused.length) }
    ]));
    host.appendChild(UI.panel('Due today and overdue', el('div', { class: 'stack' }, [
      el('p', { class: 'muted' }, ['Your follow-ups, earliest due date first. Open a customer to work the case, then mark the follow-up complete.']),
      dueHost
    ])));
    host.appendChild(UI.panel('Paused', el('div', { class: 'stack' }, [
      el('p', { class: 'muted' }, ['Paused by a promise to pay. These resume if the promise is not fulfilled.']),
      pausedHost
    ])));
    host.appendChild(UI.howItWorks('The list is a query on the follow-up store for the signed-in rep: status Open, due on or before today, ordered by due date.'));
  }

  // ---------- leader ----------

  function drawLeader() {
    var team = user.team;
    var teamIds = Store.get('users').filter(function (u) { return u.team === team; }).map(function (u) { return u.id; });
    var reps = Staff.teamReps(team);
    var teamFus = Store.filter('followups', function (f) { return teamIds.indexOf(f.ownerId) >= 0; });
    var overdue = teamFus.filter(function (f) { return f.status === 'Open' && f.dueDate < today; }).sort(byDue);
    var paused = teamFus.filter(function (f) { return f.status === 'Paused'; }).sort(byDue);

    var overdueHost = el('div');
    UI.table(overdueHost, {
      columns: [
        {
          key: 'ownerId', label: 'Rep', format: function (v, r) {
            return Staff.userName(v) + (r.reassignedFrom ? ' (reassigned from ' + Staff.userName(r.reassignedFrom) + ')' : '');
          }
        },
        { key: 'customerId', label: 'Customer', format: function (v, r) { return customerCell(r); } },
        { key: 'dueDate', label: 'Due', format: function (v, r) { return dueText(r); } },
        { key: 'status', label: 'Days overdue', format: function (v, r) { return overdueBadge(r); } },
        { key: 'outcomeCode', label: 'Outcome', format: function (v) { return outcomeLabel(v); } },
        { key: 'id', label: 'Reassign to another rep', format: function (v, r) { return reassignControl(r, reps); } }
      ],
      rows: overdue,
      empty: 'No overdue follow-ups in your team.'
    });

    var pausedHost = el('div');
    pausedTable(pausedHost, paused);

    host.appendChild(UI.statCards([
      { label: 'Overdue in team ' + team, value: String(overdue.length), kind: overdue.length ? 'warn' : null },
      { label: 'Reps in team', value: String(reps.length) },
      { label: 'Paused', value: String(paused.length) }
    ]));
    host.appendChild(UI.panel('Overdue follow-ups, team ' + team, el('div', { class: 'stack' }, [
      el('p', { class: 'muted' }, ['Most overdue first. Reassigning moves the follow-up to another rep and writes an entry to the customer\'s history and the audit trail.']),
      overdueHost
    ])));
    host.appendChild(UI.panel('Paused, team ' + team, pausedHost));
    host.appendChild(UI.howItWorks('Reassignment calls POST /followups/{id}/reassign, which only a team leader may use. It records who moved the work, from whom and when.'));
  }

  // Dropdown and button for one overdue row.
  function reassignControl(f, reps) {
    var others = reps.filter(function (u) { return u.id !== f.ownerId; });
    if (!others.length) { return el('span', { class: 'muted' }, ['No other rep in this team']); }
    var err = el('div', { class: 'form-field__error', role: 'alert' });
    var select = el('select', { class: 'select', 'aria-label': 'Reassign follow-up to another rep' },
      [el('option', { value: '' }, ['Choose a rep'])].concat(others.map(function (u) { return el('option', { value: u.id }, [u.name]); })));
    var btn = el('button', {
      type: 'button', class: 'btn btn--small', onclick: function () {
        err.textContent = '';
        if (!select.value) { err.textContent = 'Choose a rep first.'; return; }
        var res = Services.reassignFollowup(f.id, select.value);
        if (!res.ok) { err.textContent = res.error; return; }
        UI.toast('Follow-up reassigned to ' + Staff.userName(select.value) + '.', 'ok');
        draw();
      }
    }, ['Reassign']);
    return el('div', null, [el('div', { class: 'row' }, [select, btn]), err]);
  }
});
