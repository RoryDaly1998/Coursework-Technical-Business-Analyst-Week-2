/* compliance-settings page script: reminder template versions and approval (US-52), contact-frequency limit (US-33). */
(function () {
  'use strict';

  var el = UI.el;
  var MAX_BODY = 1000;

  function userName(id) {
    var u = id ? Store.find('users', id) : null;
    return u ? u.name : (id || '');
  }

  // Audit before/after values are objects.
  function describe(v) {
    if (v === null || v === undefined) { return ''; }
    return Object.keys(v).map(function (k) { return k + '=' + String(v[k]); }).join('; ');
  }

  Layout.ready(function (main) {
    var templatesMount = el('div');
    var limitMount = el('div');

    // ---------- (a) reminder templates ----------

    function statusBadge(s) {
      return UI.badge(s, s === 'Approved' ? 'ok' : (s === 'Pending' ? 'warn' : null));
    }

    // Creates the next version of a template as Pending, from the wording typed in the dialog.
    function createVersion(source, body) {
      var versions = Store.filter('templates', function (x) { return x.name === source.name; }).map(function (x) { return Number(x.version) || 0; });
      var next = Math.max.apply(null, versions) + 1;
      var row = Store.insert('templates', { name: source.name, version: next, status: 'Pending', body: body, approvedBy: null, approvedAt: null });
      Services.audit({
        entity: 'template', entityId: row.id, action: 'create', before: null,
        after: { name: row.name, version: next, status: 'Pending', basedOn: source.id },
        note: 'Version ' + next + ' created from ' + source.id + '. Awaiting Compliance approval.'
      });
      return row;
    }

    function newVersionDialog(source) {
      var form = el('form', { novalidate: true }, [
        el('p', { class: 'muted' }, ['Based on version ' + source.version + ' (' + source.status + '). The new version stays Pending and is not used by any job until Compliance approves it.']),
        UI.field({
          label: 'Template wording', name: 'body', type: 'textarea', required: true, value: source.body,
          help: 'Placeholders such as {{name}}, {{amount}} and {{dueDate}} are filled in when the message is sent.'
        })
      ]);
      form.addEventListener('submit', function (e) { e.preventDefault(); });
      UI.modal({
        title: 'New version of "' + source.name + '"',
        body: form,
        actions: [
          { label: 'Cancel' },
          {
            label: 'Save as Pending version', kind: 'primary', onClick: function () {
              var body = UI.readForm(form).body;
              var error = null;
              if (!body) { error = 'Enter the template wording.'; }
              else if (body === source.body) { error = 'Change the wording before saving a new version.'; }
              else if (body.length > MAX_BODY) { error = 'Keep the wording under ' + MAX_BODY + ' characters.'; }
              if (error) { UI.showErrors(form, { body: error }); return false; }
              var row = createVersion(source, body);
              UI.toast('Version ' + row.version + ' of "' + row.name + '" saved as Pending.', 'ok');
              renderTemplates();
            }
          }
        ]
      });
    }

    // Approves a Pending version; the previously Approved version of the same template becomes Superseded.
    function approve(t) {
      var fresh = Store.find('templates', t.id);
      if (!fresh || fresh.status !== 'Pending') { UI.toast('This version is no longer Pending.', 'warn'); renderTemplates(); return; }
      var user = Auth.user();
      var by = user ? user.id : 'COM-01';
      Store.filter('templates', function (x) { return x.name === fresh.name && x.status === 'Approved' && x.id !== fresh.id; }).forEach(function (old) {
        Store.update('templates', old.id, { status: 'Superseded' });
        Services.audit({
          entity: 'template', entityId: old.id, action: 'supersede', before: { status: 'Approved' },
          after: { status: 'Superseded', supersededBy: fresh.id }, note: 'Replaced by version ' + fresh.version + '.'
        });
      });
      Store.update('templates', fresh.id, { status: 'Approved', approvedBy: by, approvedAt: Clock.now() });
      Services.audit({
        entity: 'template', entityId: fresh.id, action: 'approve', before: { status: 'Pending' },
        after: { status: 'Approved', approvedBy: by }, note: 'Version ' + fresh.version + ' approved.'
      });
      UI.toast('Version ' + fresh.version + ' of "' + fresh.name + '" approved and now in use.', 'ok');
      renderTemplates();
    }

    function renderTemplates() {
      var list = Store.get('templates').slice().sort(function (a, b) {
        if (a.name !== b.name) { return a.name < b.name ? -1 : 1; }
        return (Number(b.version) || 0) - (Number(a.version) || 0);
      });
      UI.table(templatesMount, {
        columns: [
          { key: 'name', label: 'Template' },
          { key: 'version', label: 'Version', format: function (v) { return 'v' + v; } },
          { key: 'status', label: 'Status', format: function (v) { return statusBadge(v); } },
          { key: 'used', label: 'Used by jobs', format: function (v, row) { return row.status === 'Approved' ? 'Yes' : 'No'; } },
          { key: 'body', label: 'Wording' },
          {
            key: 'approvedBy', label: 'Approved by', format: function (v, row) {
              return row.approvedBy ? userName(row.approvedBy) + ', ' + Fmt.datetime(row.approvedAt) : '\u2014';
            }
          },
          {
            key: 'actions', label: 'Actions', format: function (v, row) {
              var buttons = [el('button', { type: 'button', class: 'btn btn--small', onclick: function () { newVersionDialog(row); } }, ['New version'])];
              if (row.status === 'Pending') {
                buttons.push(el('button', {
                  type: 'button', class: 'btn btn--small btn--primary', onclick: function () {
                    UI.confirm('Approve version ' + row.version + ' of "' + row.name + '"? The currently approved version will be superseded.', { title: 'Approve template', confirmLabel: 'Approve' })
                      .then(function (ok) { if (ok) { approve(row); } });
                  }
                }, ['Approve']));
              }
              return el('div', { class: 'row' }, buttons);
            }
          }
        ],
        rows: list,
        empty: 'There are no reminder templates.'
      });
    }

    // ---------- (b) contact frequency limit ----------

    function renderLimit() {
      var st = Store.settings().contactLimit || {};
      var win = st.windowDays || 7;
      var min = typeof st.min === 'number' ? st.min : 1;
      var max = typeof st.max === 'number' ? st.max : 10;
      var current = Services.setting('contactLimit', null);

      var form = el('form', { novalidate: true, class: 'stack' }, [
        UI.field({
          label: 'Contacts allowed per ' + win + ' days', name: 'limit', type: 'number', required: true, value: current,
          help: 'Whole number from ' + min + ' to ' + max + '. Interactions and reminders both count towards it.', attrs: { min: min, max: max, step: 1 }
        }),
        el('div', { class: 'row' }, [el('button', { type: 'submit', class: 'btn btn--primary' }, ['Save contact limit'])])
      ]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var raw = UI.readForm(form).limit;
        var n = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
        if (isNaN(n) || n < min || n > max) { UI.showErrors(form, { limit: 'Enter a whole number from ' + min + ' to ' + max + '.' }); return; }
        if (n === Number(current)) { UI.showErrors(form, { limit: 'That is already the current limit.' }); return; }
        Services.updateSetting('contactLimit', n, 'Contact limit changed from ' + current + ' to ' + n + ' per ' + win + ' days.');
        UI.toast('Contact limit saved: ' + n + ' per ' + win + ' days.', 'ok');
        renderLimit();
      });

      var history = Store.get('audit').filter(function (a) { return a.entity === 'setting' && a.entityId === 'contactLimit'; })
        .sort(function (a, b) { return String(a.at) < String(b.at) ? 1 : -1; }).slice(0, 5);
      var historyMount = el('div');
      UI.table(historyMount, {
        columns: [
          { key: 'at', label: 'When', format: function (v) { return Fmt.datetime(v); } },
          { key: 'userLabel', label: 'User' },
          { key: 'before', label: 'Before', format: function (v) { return describe(v); } },
          { key: 'after', label: 'After', format: function (v) { return describe(v); } }
        ],
        rows: history,
        empty: 'The limit has not been changed yet.'
      });

      limitMount.textContent = '';
      limitMount.appendChild(el('div', { class: 'stack' }, [
        el('p', null, ['Current limit: ', UI.tbd('Contact limit', current + ' per ' + win + ' days'), '. A rep who would exceed it must enter an override reason, which is logged.']),
        form,
        el('h3', null, ['Recent changes to the limit']),
        historyMount
      ]));
    }

    // ---------- page ----------

    main.appendChild(el('div', { class: 'stack' }, [
      UI.panel('Reminder templates', el('div', { class: 'stack' }, [
        el('div', { class: 'notice notice--info' }, ['Reminder jobs use only Approved templates. A new version is Pending until Compliance approves it, and approving it supersedes the previously approved version. Every change is written to the audit trail.']),
        templatesMount
      ]), { note: 'Templates would be stored with their version history in the messaging service. The send job would look up the Approved version by template name at send time, and an approval would need a second person in a live service.' }),
      UI.panel('Contact frequency limit', limitMount, { note: 'The limit would be a controlled setting in the case-management service. Changing it would be restricted to Compliance and recorded in the audit store, and scheduling would read it on every follow-up and reminder.' }),
      UI.panel('Related reports', el('ul', null, [
        el('li', null, [el('a', { href: 'reports.html?r=followup-history' }, ['Follow-up history']), ' (per-customer export of follow-ups and override reasons)']),
        el('li', null, [el('a', { href: 'reports.html?r=audit-trail' }, ['Audit trail']), ' (all changes)']),
        el('li', null, [el('a', { href: 'reports.html?r=audit-trail&entity=template' }, ['Audit trail: template changes'])]),
        el('li', null, [el('a', { href: 'reports.html?r=audit-trail&entity=setting' }, ['Audit trail: setting changes'])])
      ]))
    ]));

    renderTemplates();
    renderLimit();
  });
})();
