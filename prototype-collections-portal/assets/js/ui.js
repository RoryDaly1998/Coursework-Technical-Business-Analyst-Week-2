/*
 * ui.js: plain DOM helpers (UI). No dependencies. All text is inserted as text nodes, never as HTML.
 *
 * Usage:
 *   UI.el('div', {class: 'row'}, [UI.el('span', {text: 'Hi'}), 'plain text'])
 *   UI.el('p', 'text only')                      attrs may be omitted when children are given
 *   attrs: class, text, dataset, onclick (any on<event> function), booleans (true sets, false/null skips)
 *
 * Form conventions:
 *   UI.field() builds label + control + help + error slot. Field names may be dotted ('address.line1').
 *   UI.readForm(form) returns trimmed values; dotted names nest ({address:{line1}}); checkboxes give booleans.
 *   UI.showErrors(form, {fieldName: message}) fills the error slots; unmatched keys appear as a form-level notice.
 */
(function () {
  'use strict';

  var uidCounter = 0;

  function isNode(x) { return !!x && typeof x === 'object' && typeof x.nodeType === 'number'; }

  // Appends strings, numbers, nodes and nested arrays; skips null/undefined/false.
  function append(parent, child) {
    if (child === null || child === undefined || child === false) { return; }
    if (Array.isArray(child)) { child.forEach(function (c) { append(parent, c); }); return; }
    parent.appendChild(isNode(child) ? child : document.createTextNode(String(child)));
  }

  function el(tag, attrs, children) {
    if (attrs !== undefined && attrs !== null && (typeof attrs === 'string' || typeof attrs === 'number' || Array.isArray(attrs) || isNode(attrs))) {
      children = attrs;
      attrs = null;
    }
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) { return; }
        if (k === 'class' || k === 'className') { node.className = v; }
        else if (k === 'text') { node.textContent = v; }
        else if (k === 'dataset') { Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; }); }
        else if (k.indexOf('on') === 0 && typeof v === 'function') { node.addEventListener(k.slice(2).toLowerCase(), v); }
        else if (v === true) { node.setAttribute(k, ''); }
        else { node.setAttribute(k, v); }
      });
    }
    append(node, children);
    return node;
  }

  function qsa(root, selector) { return Array.prototype.slice.call(root.querySelectorAll(selector)); }

  // Plain-text rendering of a cell value when a column has no format function.
  function defaultText(v) {
    if (v === null || v === undefined) { return ''; }
    if (typeof v === 'boolean') { return v ? 'Yes' : 'No'; }
    if (typeof v === 'object' && !isNode(v)) { return JSON.stringify(v); }
    return v;
  }

  function emptyState(msg) {
    return el('div', { class: 'empty-state' }, [msg]);
  }

  function badge(text, kind) {
    var k = kind === 'error' ? 'err' : kind;
    return el('span', { class: 'badge' + (k ? ' badge--' + k : '') }, [text]);
  }

  function howItWorks(text) {
    return el('div', { class: 'how-note' }, [el('strong', null, ['How this would work in production: ']), text]);
  }

  // Section with a title bar. opts: {note} adds a production note; {label} adds a badge such as "Simulated evidence".
  function panel(title, body, opts) {
    var o = opts || {};
    var head = el('h2', { class: 'panel__title' }, [title]);
    if (o.label) { head.appendChild(document.createTextNode(' ')); head.appendChild(badge(o.label)); }
    var bodyEl = el('div', { class: 'panel__body' }, [body]);
    if (o.note) { bodyEl.appendChild(howItWorks(o.note)); }
    return el('section', { class: 'panel' }, [head, bodyEl]);
  }

  // Fills container with a table, or an empty state when there are no rows. Returns the new node.
  function table(container, opts) {
    var cols = opts.columns || [];
    var rows = opts.rows || [];
    container.textContent = '';
    if (!rows.length) {
      var empty = emptyState(opts.empty || 'No records to show.');
      container.appendChild(empty);
      return empty;
    }
    var head = el('thead', null, [el('tr', null, cols.map(function (c) { return el('th', { scope: 'col' }, [c.label]); }))]);
    var body = el('tbody');
    rows.forEach(function (row) {
      var tr = el('tr');
      cols.forEach(function (c) {
        var value = row[c.key];
        tr.appendChild(el('td', null, [c.format ? c.format(value, row) : defaultText(value)]));
      });
      if (opts.onRowClick) {
        tr.className = 'is-clickable';
        tr.tabIndex = 0;
        tr.addEventListener('click', function () { opts.onRowClick(row); });
        tr.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { opts.onRowClick(row); }
        });
      }
      body.appendChild(tr);
    });
    var tableEl = el('table', { class: 'table' }, [head, body]);
    container.appendChild(el('div', { class: 'table-wrap' }, [tableEl]));
    return tableEl;
  }

  // Options may be strings or {value, label}.
  function optionDefs(options) {
    return (options || []).map(function (o) {
      return typeof o === 'object' ? o : { value: o, label: o };
    });
  }

  // def: {label, name, type (text|email|tel|date|number|password|textarea|select|checkbox|radio), required, options, help, value, attrs}
  function field(def) {
    var type = def.type || 'text';
    var id = 'f-' + def.name + '-' + (++uidCounter);
    var helpId = id + '-help';
    var errorId = id + '-error';
    var extra = def.attrs || {};
    var control;
    var wrap = el('div', { class: 'form-field' });
    var labelText = [def.label, def.required ? el('span', { class: 'form-field__req', 'aria-hidden': 'true' }, [' *']) : null];
    // The error slot is always referenced so a screen reader reads the message once it is filled in.
    var describedBy = (def.help ? helpId + ' ' : '') + errorId;

    if (type === 'checkbox') {
      control = el('input', { type: 'checkbox', id: id, name: def.name, checked: !!def.value, 'aria-describedby': describedBy });
      wrap.appendChild(el('label', { class: 'form-field__label form-field__label--inline', for: id }, [control, ' ', labelText]));
    } else if (type === 'radio') {
      var group = el('fieldset', { class: 'form-field__group' }, [el('legend', { class: 'form-field__label' }, [labelText])]);
      var radios = el('div', { class: 'row' });
      optionDefs(def.options).forEach(function (o, i) {
        var rid = id + '-' + i;
        radios.appendChild(el('label', { for: rid, class: 'form-field__radio' }, [
          el('input', { type: 'radio', id: rid, name: def.name, value: o.value, checked: String(def.value) === String(o.value), 'aria-describedby': describedBy }),
          ' ', o.label
        ]));
      });
      group.appendChild(radios);
      wrap.appendChild(group);
      control = group.querySelector('input');
    } else {
      wrap.appendChild(el('label', { class: 'form-field__label', for: id }, [labelText]));
      if (type === 'select') {
        control = el('select', { class: 'select', id: id, name: def.name, 'aria-describedby': describedBy }, optionDefs(def.options).map(function (o) {
          return el('option', { value: o.value }, [o.label]);
        }));
        if (def.value !== undefined && def.value !== null) { control.value = def.value; }
      } else if (type === 'textarea') {
        control = el('textarea', { class: 'input', id: id, name: def.name, rows: '4', 'aria-describedby': describedBy });
        if (def.value !== undefined && def.value !== null) { control.value = def.value; }
      } else {
        control = el('input', { class: 'input', type: type, id: id, name: def.name, value: def.value, 'aria-describedby': describedBy });
      }
      wrap.appendChild(control);
    }

    if (def.required) { qsa(wrap, 'input,select,textarea').forEach(function (c) { c.setAttribute('aria-required', 'true'); }); }
    Object.keys(extra).forEach(function (k) {
      qsa(wrap, 'input,select,textarea').forEach(function (c) {
        if (extra[k] === true) { c.setAttribute(k, ''); } else if (extra[k] !== false && extra[k] !== null && extra[k] !== undefined) { c.setAttribute(k, extra[k]); }
      });
    });
    if (def.help) { wrap.appendChild(el('div', { class: 'form-field__help muted', id: helpId }, [def.help])); }
    wrap.appendChild(el('div', { class: 'form-field__error', id: errorId, 'data-error-for': def.name, 'aria-live': 'polite' }));
    return wrap;
  }

  function setPath(obj, path, value) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) { cur[parts[i]] = {}; }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function getPath(obj, path) {
    var cur = obj;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || typeof cur !== 'object') { return undefined; }
      cur = cur[parts[i]];
    }
    return cur;
  }

  function readForm(formEl) {
    var out = {};
    Array.prototype.forEach.call(formEl.elements, function (c) {
      if (!c.name || c.disabled) { return; }
      var t = (c.type || '').toLowerCase();
      if (t === 'submit' || t === 'button' || t === 'reset' || t === 'file') { return; }
      if (t === 'checkbox') { setPath(out, c.name, c.checked); }
      else if (t === 'radio') {
        if (c.checked) { setPath(out, c.name, c.value); }
        else if (getPath(out, c.name) === undefined) { setPath(out, c.name, ''); }
      }
      else if (t === 'password') { setPath(out, c.name, c.value); }
      else { setPath(out, c.name, String(c.value).trim()); }
    });
    return out;
  }

  function showErrors(formEl, errors) {
    var errs = errors || {};
    qsa(formEl, '.form-field__error').forEach(function (n) { n.textContent = ''; });
    qsa(formEl, '.form-field.has-error').forEach(function (n) { n.classList.remove('has-error'); });
    qsa(formEl, '[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
    var old = formEl.querySelector('[data-form-error]');
    if (old) { old.parentNode.removeChild(old); }

    var slots = qsa(formEl, '.form-field__error');
    var first = null;
    var general = [];
    Object.keys(errs).forEach(function (name) {
      var slot = null;
      slots.forEach(function (s) { if (s.getAttribute('data-error-for') === name) { slot = s; } });
      if (!slot) { general.push(errs[name]); return; }
      slot.textContent = errs[name];
      var wrap = slot.closest('.form-field');
      var controls = wrap ? qsa(wrap, 'input,select,textarea') : [];
      var control = controls[0] || null;
      if (wrap) { wrap.classList.add('has-error'); }
      controls.forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
      if (control && !first) { first = control; }
    });
    if (general.length) {
      formEl.insertBefore(el('div', { class: 'notice notice--error', 'data-form-error': '', role: 'alert' }, [general.join(' ')]), formEl.firstChild);
    }
    if (first) { first.focus(); }
  }

  // Short message at the bottom right; kind: info | ok | warn | error.
  function toast(msg, kind) {
    var region = document.getElementById('toast-region');
    if (!region) {
      region = el('div', { id: 'toast-region', class: 'toast-region', 'aria-live': 'polite' });
      document.body.appendChild(region);
    }
    var t = el('div', { class: 'toast' + (kind ? ' toast--' + kind : ''), role: 'status' }, [msg]);
    region.appendChild(t);
    setTimeout(function () { if (t.parentNode) { t.parentNode.removeChild(t); } }, 4000);
    return t;
  }

  // opts: {title, body, actions:[{label, kind:'primary'|'danger', onClick}], onDismiss}. onClick returning false keeps it open.
  function modal(opts) {
    var o = opts || {};
    var previous = document.activeElement;
    var overlay = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || 'Dialog' });

    // Removes the dialog and returns focus to where it was.
    function close() {
      document.removeEventListener('keydown', onKey);
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      if (previous && previous.focus) { previous.focus(); }
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); if (o.onDismiss) { o.onDismiss(); } }
    }

    var actions = (o.actions && o.actions.length) ? o.actions : [{ label: 'Close' }];
    var buttons = actions.map(function (a) {
      var cls = 'btn' + (a.kind ? ' btn--' + a.kind : '');
      return el('button', {
        type: 'button', class: cls, onclick: function () {
          var r = a.onClick ? a.onClick() : undefined;
          if (r !== false) { close(); }
        }
      }, [a.label]);
    });
    overlay.appendChild(el('div', { class: 'modal__dialog' }, [
      o.title ? el('h2', { class: 'modal__title' }, [o.title]) : null,
      el('div', { class: 'modal__body' }, [o.body]),
      el('div', { class: 'modal__actions row' }, buttons)
    ]));
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    buttons[buttons.length - 1].focus();
    return { close: close, el: overlay };
  }

  // Resolves true when confirmed, false when cancelled or dismissed. opts: {title, confirmLabel, danger}.
  function confirmDialog(msg, opts) {
    var o = opts || {};
    return new Promise(function (resolve) {
      modal({
        title: o.title || 'Please confirm',
        body: el('p', null, [msg]),
        onDismiss: function () { resolve(false); },
        actions: [
          { label: 'Cancel', onClick: function () { resolve(false); } },
          { label: o.confirmLabel || 'Confirm', kind: o.danger ? 'danger' : 'primary', onClick: function () { resolve(true); } }
        ]
      });
    });
  }

  // Visible "TBD (demo: n)" placeholder; label becomes the tooltip.
  function tbd(label, demoValue) {
    var text = demoValue === undefined || demoValue === null ? 'TBD' : 'TBD (demo: ' + demoValue + ')';
    return el('span', { class: 'tbd', title: label || null }, [text]);
  }

  // Story chips, hidden unless the header "Show story tags" toggle is on. Accepts ids or arrays of ids.
  function storyTags() {
    var ids = [];
    Array.prototype.slice.call(arguments).forEach(function (a) { ids = ids.concat(a || []); });
    return el('span', { class: 'story-tags' }, ids.map(function (id) { return el('span', { class: 'story-tag' }, [id]); }));
  }

  // defs: [{id, label, render(container) | content}]. render may fill the container or return a node; it re-runs on each activation.
  function tabs(defs, opts) {
    var wrap = el('div', { class: 'tabs-wrap' });
    var list = el('div', { class: 'tabs', role: 'tablist' });
    var panelEl = el('div', { class: 'tab-panel', role: 'tabpanel' });
    var buttons = {};

    // Activates a tab and renders its content.
    function select(id) {
      var active = null;
      defs.forEach(function (d) {
        var on = d.id === id;
        buttons[d.id].classList.toggle('is-active', on);
        buttons[d.id].setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) { active = d; }
      });
      if (!active) { return; }
      panelEl.textContent = '';
      if (typeof active.render === 'function') {
        var result = active.render(panelEl);
        if (isNode(result)) { panelEl.appendChild(result); }
      } else {
        append(panelEl, active.content);
      }
    }

    defs.forEach(function (d) {
      buttons[d.id] = el('button', { type: 'button', class: 'tab', role: 'tab', onclick: function () { select(d.id); } }, [d.label]);
      list.appendChild(buttons[d.id]);
    });
    wrap.appendChild(list);
    wrap.appendChild(panelEl);
    wrap.select = select;
    if (defs.length) { select((opts && opts.active) || defs[0].id); }
    return wrap;
  }

  // items: [{label, value, note, kind}]
  function statCards(items) {
    return el('div', { class: 'stat-cards' }, (items || []).map(function (it) {
      return el('div', { class: 'stat' + (it.kind ? ' stat--' + it.kind : '') }, [
        el('div', { class: 'stat__value' }, [it.value]),
        el('div', { class: 'stat__label' }, [it.label]),
        it.note ? el('div', { class: 'stat__note muted' }, [it.note]) : null
      ]);
    }));
  }

  // Triggers a real file download from text (a UTF-8 BOM is added for CSV so spreadsheets read it correctly).
  function download(filename, text, mime) {
    var type = mime || 'text/plain;charset=utf-8';
    var body = /csv/.test(type) ? '\ufeff' + text : text;
    var url = URL.createObjectURL(new Blob([body], { type: type }));
    var a = el('a', { href: url, download: filename, class: 'hidden' });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }

  // Escapes one CSV cell; text starting with = + - @ gets a leading apostrophe to block spreadsheet formula injection.
  function csvCell(v) {
    if (v === null || v === undefined) { return ''; }
    var isText = typeof v === 'string';
    var s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (isText && /^[=+\-@\t\r]/.test(s)) { s = "'" + s; }
    if (/[",\r\n]/.test(s)) { s = '"' + s.replace(/"/g, '""') + '"'; }
    return s;
  }

  // columns: [{key, label, csv?(row)}]. Uses raw row values, not display formatting.
  function toCSV(columns, rows) {
    var lines = [columns.map(function (c) { return csvCell(c.label); }).join(',')];
    (rows || []).forEach(function (row) {
      lines.push(columns.map(function (c) { return csvCell(c.csv ? c.csv(row) : row[c.key]); }).join(','));
    });
    return lines.join('\r\n');
  }

  // URL query parameter or null.
  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  window.UI = {
    el: el,
    panel: panel,
    table: table,
    field: field,
    readForm: readForm,
    showErrors: showErrors,
    toast: toast,
    modal: modal,
    confirm: confirmDialog,
    badge: badge,
    howItWorks: howItWorks,
    tbd: tbd,
    storyTags: storyTags,
    emptyState: emptyState,
    tabs: tabs,
    statCards: statCards,
    download: download,
    toCSV: toCSV,
    query: query
  };
})();
