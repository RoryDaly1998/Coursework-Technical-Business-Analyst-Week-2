/*
 * reports-engine.js: Reports (generic, definition-driven report renderer).
 *
 * Report authors call, in reports-*.js:
 *   Reports.register({
 *     id: 'team-logs',                         // kebab-case reportId, matches PAGES (page id 'report-team-logs')
 *     title, stories, description,
 *     filters: [{key, label, type:'text'|'select'|'date-from'|'date-to'|'customer', options?}],
 *               // select options: strings or {value,label}; an "All" option (value '') is added.
 *               // customer: select of customers; the filter value is the customer id ('' = all).
 *               // Filter values arrive as strings; empty string means "not set".
 *               // Filters can be pre-filled from the URL, e.g. reports.html?r=audit-trail&customer=C-1001
 *     columns: [{key, label, format?(value,row) -> string|Node, csv?(row)}],
 *     rows(filters, ctx) -> array of row objects,
 *     summary?(rows, filters) -> [{label, value, note?, kind?}],
 *     panel?(ctx) -> Node,                     // evidence panel shown above the results
 *     actions?: [{label, run(rows, ctx) -> string|Node|undefined}],   // string = toast, Node = shown under the buttons;
 *                                                                     // the report (panel, summary and table) is re-run afterwards
 *     exports?: ['csv','pdf'],                 // default both
 *     rowLink?(row) -> href,                   // makes rows clickable
 *     runOnLoad?: false,                       // optional: wait for "Run report" (default true)
 *     empty?: 'text'                           // optional empty-state text
 *   });
 *   ctx = { filters, role, user, today, now, def }
 *
 * Reports.render(id, mount), Reports.renderIndex(mount), Reports.has(id), Reports.list().
 * CSV export is a real download of all rows for the current filters (raw values, not display formatting).
 * PDF export is a stub: an in-page print view; use the browser's Print > Save as PDF.
 */
(function () {
  'use strict';

  var el = UI.el;
  var defs = {};

  function has(id) { return Object.prototype.hasOwnProperty.call(defs, id); }

  // Adds or replaces a report definition.
  function register(def) {
    if (!def || !def.id) { throw new Error('Reports.register needs an id'); }
    defs[def.id] = def;
    return def;
  }

  function list() { return Object.keys(defs).map(function (k) { return defs[k]; }); }

  function roleLabel() {
    var r = Store.find('roles', Auth.role());
    return r ? r.label : Auth.role();
  }

  // Report index for the current role, built from PAGES.
  function renderIndex(mount) {
    var role = Auth.role();
    var pages = window.PAGES.filter(function (p) { return p.reportId && p.roles.indexOf(role) >= 0; });
    mount.textContent = '';
    if (!pages.length) {
      mount.appendChild(UI.emptyState('There are no reports for the ' + roleLabel() + ' role.'));
      return;
    }
    var cards = pages.map(function (p) {
      var def = has(p.reportId) ? defs[p.reportId] : null;
      return UI.panel(el('a', { href: p.file }, [p.title]), el('div', { class: 'stack' }, [
        el('p', null, [def && def.description ? def.description : 'Open this report to view and export it.']),
        UI.storyTags(p.stories),
        el('div', null, [el('a', { class: 'btn btn--small', href: p.file }, ['Open report'])])
      ]));
    });
    mount.appendChild(el('div', { class: 'reports-index grid grid--2' }, cards));
  }

  // Turns a filter definition into a UI.field definition.
  function filterField(f) {
    var initial = UI.query(f.key);
    var base = { label: f.label, name: f.key, value: initial === null ? undefined : initial };
    if (f.type === 'select') {
      base.type = 'select';
      var opts = (f.options || []).map(function (o) { return typeof o === 'object' ? o : { value: o, label: o }; });
      base.options = [{ value: '', label: 'All' }].concat(opts);
    } else if (f.type === 'customer') {
      base.type = 'select';
      base.options = [{ value: '', label: 'All customers' }].concat(Store.get('customers').map(function (c) {
        return { value: c.id, label: c.accountNo + ' - ' + c.name };
      }));
    } else if (f.type === 'date-from' || f.type === 'date-to') {
      base.type = 'date';
    } else {
      base.type = 'text';
    }
    return UI.field(base);
  }

  // Returns an error for the "to" date when it is before the "from" date.
  function dateRangeErrors(def, filters) {
    var from = null;
    var to = null;
    (def.filters || []).forEach(function (f) {
      if (f.type === 'date-from' && !from) { from = f; }
      if (f.type === 'date-to' && !to) { to = f; }
    });
    var errors = {};
    if (from && to && filters[from.key] && filters[to.key] && filters[to.key] < filters[from.key]) {
      errors[to.key] = 'The end date must be on or after the start date.';
    }
    return errors;
  }

  // Prototype PDF stub: a full-page print view over the app (Print > Save as PDF).
  function openPrintView(def, rows, filters, summary) {
    var old = document.querySelector('.print-view');
    if (old) { old.parentNode.removeChild(old); }
    var view = el('div', { class: 'print-view' });

    // Removes the print view and restores the page.
    function close() {
      if (view.parentNode) { view.parentNode.removeChild(view); }
      document.body.classList.remove('has-print-view');
    }

    var applied = Object.keys(filters).filter(function (k) { return filters[k] !== '' && filters[k] !== undefined; }).map(function (k) {
      return k + ': ' + filters[k];
    });
    var meta = el('dl', { class: 'kv' }, [
      el('dt', null, ['Generated']), el('dd', null, [Fmt.datetime(Clock.now())]),
      el('dt', null, ['Role']), el('dd', null, [roleLabel()]),
      el('dt', null, ['Filters']), el('dd', null, [applied.length ? applied.join('; ') : 'None']),
      el('dt', null, ['Rows']), el('dd', null, [String(rows.length)])
    ]);
    var tableMount = el('div');
    UI.table(tableMount, { columns: def.columns, rows: rows, empty: 'No rows.' });

    view.appendChild(el('div', { class: 'print-view__bar no-print row' }, [
      el('button', { type: 'button', class: 'btn btn--primary', onclick: function () { window.print(); } }, ['Print / Save as PDF']),
      el('button', { type: 'button', class: 'btn', onclick: close }, ['Close print view']),
      el('span', { class: 'muted' }, ['Prototype stub: a live service would generate the PDF on the server.'])
    ]));
    view.appendChild(el('h1', null, [def.title]));
    view.appendChild(meta);
    if (summary && summary.length) { view.appendChild(UI.statCards(summary)); }
    view.appendChild(tableMount);
    document.body.appendChild(view);
    document.body.classList.add('has-print-view');
  }

  // Renders a report into mount. Returns false if the id is unknown.
  function render(id, mount) {
    mount.textContent = '';
    if (!has(id)) {
      mount.appendChild(el('div', { class: 'notice notice--error' }, ['Unknown report: ' + id]));
      return false;
    }
    var def = defs[id];
    var lastRows = [];
    var lastSummary = [];
    var lastCtx = null;

    var form = el('form', {
      class: 'reports-filters', novalidate: true, onsubmit: function (e) { e.preventDefault(); run(true); }
    });
    var grid = el('div', { class: 'grid grid--3' }, (def.filters || []).map(filterField));
    form.appendChild(grid);
    form.appendChild(el('div', { class: 'row' }, [
      el('button', { type: 'submit', class: 'btn btn--primary' }, ['Run report']),
      el('button', {
        type: 'button', class: 'btn', onclick: function () {
          Array.prototype.forEach.call(form.elements, function (c) {
            if (c.tagName === 'SELECT') { c.selectedIndex = 0; } else if (c.tagName === 'INPUT') { c.value = ''; }
          });
          UI.showErrors(form, {});
          run(true);
        }
      }, ['Clear filters'])
    ]));

    var panelMount = el('div');
    var actionsBar = el('div', { class: 'reports-actions row' });
    var actionResult = el('div', { class: 'reports-action-result' });
    var summaryMount = el('div');
    var tableMount = el('div');
    var footnote = el('p', { class: 'muted reports-footnote' });

    // Builds the evidence panel, if the report has one.
    function renderPanel(ctx) {
      panelMount.textContent = '';
      if (!def.panel) { return; }
      try { panelMount.appendChild(def.panel(ctx)); } catch (err) {
        panelMount.appendChild(el('div', { class: 'notice notice--error' }, ['The report panel could not be shown: ' + err.message]));
      }
    }

    // Runs rows() and draws summary, table and footnote.
    function renderResults(ctx) {
      var rows;
      try {
        rows = def.rows(ctx.filters, ctx) || [];
      } catch (err) {
        lastRows = [];
        lastSummary = [];
        summaryMount.textContent = '';
        footnote.textContent = '';
        tableMount.textContent = '';
        tableMount.appendChild(el('div', { class: 'notice notice--error' }, ['This report could not be run: ' + err.message]));
        return;
      }
      lastRows = rows;
      lastSummary = def.summary ? (def.summary(rows, ctx.filters) || []) : [];
      summaryMount.textContent = '';
      if (lastSummary.length) { summaryMount.appendChild(UI.statCards(lastSummary)); }
      UI.table(tableMount, {
        columns: def.columns,
        rows: rows,
        empty: def.empty || 'No records match these filters.',
        onRowClick: def.rowLink ? function (row) {
          var href = def.rowLink(row);
          if (href) { window.location.href = href; }
        } : null
      });
      footnote.textContent = rows.length + (rows.length === 1 ? ' row' : ' rows') + (def.rowLink ? '. Select a row to open the record.' : '.');
    }

    // Reads filters, validates, and runs; withPanel also rebuilds the evidence panel.
    function run(withPanel) {
      var filters = UI.readForm(form);
      var errors = dateRangeErrors(def, filters);
      UI.showErrors(form, errors);
      if (Object.keys(errors).length) { return; }
      lastCtx = { filters: filters, role: Auth.role(), user: Auth.user(), today: Clock.today(), now: Clock.now(), def: def };
      if (withPanel) { renderPanel(lastCtx); }
      renderResults(lastCtx);
    }

    var exportsList = def.exports || ['csv', 'pdf'];
    if (exportsList.indexOf('csv') >= 0) {
      actionsBar.appendChild(el('button', {
        type: 'button', class: 'btn btn--small', onclick: function () {
          if (!lastRows.length) { UI.toast('Nothing to export for these filters.', 'warn'); return; }
          UI.download(def.id + '-' + Clock.today() + '.csv', UI.toCSV(def.columns, lastRows), 'text/csv;charset=utf-8');
          UI.toast('CSV downloaded (' + lastRows.length + ' rows).', 'ok');
        }
      }, ['Export CSV']));
    }
    if (exportsList.indexOf('pdf') >= 0) {
      actionsBar.appendChild(el('button', {
        type: 'button', class: 'btn btn--small', onclick: function () {
          if (!lastCtx) { UI.toast('Run the report first.', 'warn'); return; }
          openPrintView(def, lastRows, lastCtx.filters, lastSummary);
        }
      }, ['Export PDF']));
    }
    (def.actions || []).forEach(function (a) {
      actionsBar.appendChild(el('button', {
        type: 'button', class: 'btn btn--small', onclick: function () {
          if (!lastCtx) { UI.toast('Run the report first.', 'warn'); return; }
          try {
            var result = a.run(lastRows, lastCtx);
            actionResult.textContent = '';
            if (typeof result === 'string') { UI.toast(result, 'ok'); } else if (result && typeof result === 'object') { actionResult.appendChild(result); }
            run(true);
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        }
      }, [a.label]));
    });

    if (def.description) { mount.appendChild(el('p', { class: 'reports-description' }, [def.description])); }
    mount.appendChild(UI.panel('Filters', form));
    mount.appendChild(panelMount);
    mount.appendChild(actionsBar);
    mount.appendChild(actionResult);
    mount.appendChild(summaryMount);
    mount.appendChild(tableMount);
    mount.appendChild(footnote);

    if (def.runOnLoad === false) {
      renderPanel({ filters: UI.readForm(form), role: Auth.role(), user: Auth.user(), today: Clock.today(), now: Clock.now(), def: def });
      tableMount.appendChild(UI.emptyState('Choose filters if needed, then press "Run report".'));
    } else {
      run(true);
    }
    return true;
  }

  window.Reports = { register: register, render: render, renderIndex: renderIndex, has: has, list: list };
})();
