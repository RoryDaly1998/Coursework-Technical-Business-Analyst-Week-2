/*
 * layout.js: Layout (header, nav, role guard, footer). Runs on DOMContentLoaded for any page with data-page.
 *
 * ---------------------------------------------------------------------------
 * PAGE SHELL: copy this exactly for every new page (replace <pageId>, which equals the file name without .html).
 * Script order matters. services.js must come before layout.js. Optional scripts go where marked.
 *
 *   <!DOCTYPE html>
 *   <html lang="en-GB">
 *   <head>
 *     <meta charset="utf-8">
 *     <meta name="viewport" content="width=device-width, initial-scale=1">
 *     <title>Collections Portal (demo)</title>
 *     <link rel="stylesheet" href="assets/css/wire.css">
 *   </head>
 *   <body data-page="<pageId>">
 *     <div id="app"></div>
 *     <noscript><p>This prototype needs JavaScript switched on.</p></noscript>
 *     <script src="data/seed-config.js"></script>
 *     <script src="data/seed-customers.js"></script>
 *     <script src="data/seed-activity.js"></script>
 *     <script src="assets/js/pages.js"></script>
 *     <script src="assets/js/core.js"></script>
 *     <script src="assets/js/ui.js"></script>
 *     <script src="assets/js/services.js"></script>
 *     <script src="assets/js/layout.js"></script>
 *     <!-- optional, as needed: assets/js/portal.js | assets/js/staff.js | assets/js/jobs-engine.js -->
 *     <script src="assets/js/pages/<pageId>.js"></script>
 *   </body>
 *   </html>
 *
 * reports.html differs: no data-page, and after layout.js it loads reports-engine.js, reports-staff.js,
 * reports-finance.js, reports-compliance.js, reports-it.js, then assets/js/pages/reports.js.
 *
 * PAGE SCRIPT (assets/js/pages/<pageId>.js):
 *   Layout.ready(function (main) { // build the page into main });
 * The callback runs only if the role guard and the verification gate both pass.
 * Layout already renders the page <h1> (from PAGES) and the story tags: do not add your own <h1>.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var el = UI.el;
  var GROUP_ORDER = ['Customer', 'Staff', 'Reports', 'Admin'];
  var DOC_TITLE = 'Collections Portal (demo)';

  var current = { pageId: null, main: null, titleEl: null, inited: false, allowed: false, queue: [] };

  function roleLabel(id) {
    var r = Store.find('roles', id);
    return r ? r.label : id;
  }

  // Updates the visible page heading and the browser tab title.
  function setTitle(text) {
    if (current.titleEl) { current.titleEl.textContent = text; }
    document.title = text + ' - ' + DOC_TITLE;
  }

  // Header: brand, status, and the demo controls (role, staff user, demo date, reset, story tags).
  function buildHeader() {
    var role = Auth.role();
    var user = Auth.user();
    var verified = Auth.verifiedCustomer();

    var roleSelect = el('select', {
      class: 'select', onchange: function (e) {
        Auth.setRole(e.target.value);
        window.location.href = Auth.homeFor(e.target.value);
      }
    }, Store.get('roles').map(function (r) {
      return el('option', { value: r.id, selected: r.id === role }, [r.label]);
    }));

    var controls = [el('label', { class: 'demo-control' }, [el('span', null, ['Role (stub login, not security)']), roleSelect])];

    var staff = Auth.usersForRole(role);
    if (staff.length > 1) {
      controls.push(el('label', { class: 'demo-control' }, [
        el('span', null, ['Staff user']),
        el('select', {
          class: 'select', onchange: function (e) { Auth.setUser(e.target.value); window.location.reload(); }
        }, staff.map(function (u) {
          return el('option', { value: u.id, selected: user && u.id === user.id }, [u.name + (u.team ? ' (team ' + u.team + ')' : '')]);
        }))
      ]));
    }

    var offset = Clock.offset();
    controls.push(el('span', { class: 'demo-control' }, [
      el('span', null, ['Demo date: ']),
      el('strong', { class: 'demo-date' }, [Fmt.date(Clock.today())]),
      offset ? el('span', { class: 'muted' }, [' (+' + offset + ' d)']) : null
    ]));
    controls.push(el('button', {
      type: 'button', class: 'btn btn--small', onclick: function () { Clock.advance(1); window.location.reload(); }
    }, ['Advance day']));

    var tagToggle = el('input', {
      type: 'checkbox', checked: !!Store.session.get('storyTags'), onchange: function (e) {
        Store.session.set('storyTags', e.target.checked);
        document.body.classList.toggle('show-story-tags', e.target.checked);
      }
    });
    controls.push(el('label', { class: 'demo-control' }, [tagToggle, el('span', null, ['Show story tags'])]));

    controls.push(el('button', {
      type: 'button', class: 'btn btn--small', title: 'Presenter control: also clears the audit log', onclick: function () {
        UI.confirm('Reset all demo data and start again from the landing page? This also clears the audit log.', { title: 'Reset demo data', confirmLabel: 'Reset', danger: true })
          .then(function (ok) { if (ok) { Store.reset(); } });
      }
    }, ['Reset demo data']));

    if (role === 'customer' && verified) {
      controls.push(el('button', {
        type: 'button', class: 'btn btn--small', onclick: function () {
          Auth.setVerified(null);
          window.location.href = 'portal-verify.html';
        }
      }, ['Sign out']));
    }

    var status;
    if (user) { status = 'Signed in as ' + user.name + ' (' + roleLabel(role) + ')'; }
    else if (role === 'customer') { status = verified ? 'Customer session: verified' : 'Customer session: not verified'; }
    else { status = roleLabel(role); }

    return el('header', { class: 'app-header' }, [
      el('div', { class: 'app-header__top' }, [
        el('a', { class: 'app-brand', href: 'index.html' }, ['Collections Portal', el('span', { class: 'app-brand__sub' }, [' wireframe prototype'])]),
        el('span', { class: 'app-status' }, [status])
      ]),
      el('div', { class: 'demo-bar', role: 'group', 'aria-label': 'Demo controls' }, controls)
    ]);
  }

  // Nav for the current role, grouped by PAGES group (headings only when more than one group applies).
  function buildNav(pageId) {
    var role = Auth.role();
    var pages = window.PAGES.filter(function (p) { return !p.hideInNav && p.roles.indexOf(role) >= 0; });
    var groups = GROUP_ORDER.filter(function (g) { return pages.some(function (p) { return p.group === g; }); });
    var nav = el('nav', { class: 'app-nav', 'aria-label': 'Main' });

    nav.appendChild(el('a', { href: 'index.html', class: pageId === 'index' ? 'is-active' : null, 'aria-current': pageId === 'index' ? 'page' : null }, ['Home']));
    groups.forEach(function (g) {
      // Customer-group pages seen by staff (the shared outbox) are labelled "Shared".
      var label = g === 'Customer' && role !== 'customer' ? 'Shared' : g;
      var wrap = el('div', { class: 'app-nav__group' });
      if (groups.length > 1) { wrap.appendChild(el('span', { class: 'app-nav__label' }, [label])); }
      pages.filter(function (p) { return p.group === g; }).forEach(function (p) {
        var active = p.id === pageId;
        wrap.appendChild(el('a', { href: p.file, class: active ? 'is-active' : null, 'aria-current': active ? 'page' : null }, [p.title]));
      });
      nav.appendChild(wrap);
    });
    return nav;
  }

  function buildFooter() {
    var children = [
      el('div', { class: 'notice notice--warn' }, [el('strong', null, ['Demo data only. ']), 'Every person, account and payment here is fictional. Nothing is sent to anyone.']),
      el('p', { class: 'app-footer__privacy' }, [
        el('strong', null, ['Privacy notice (PLACEHOLDER wording): ']),
        'this demo stores fictional data in this browser\'s local storage only and sends nothing to anyone. ',
        el('strong', null, ['Who is responsible: ']), '[PLACEHOLDER: controller to be named]. ',
        el('strong', null, ['Why data is used and lawful basis: ']), '[PLACEHOLDER]. ',
        el('strong', null, ['Shared with: ']), 'payment, email and SMS providers. ',
        el('strong', null, ['Kept for: ']), 'retention period still to be decided (TBD). ',
        el('strong', null, ['Your data rights: ']), 'access, correction, erasure and objection. ',
        el('a', { href: 'index.html#privacy' }, ['Read the full notice'])
      ])
    ];
    if (!Store.persistent()) {
      children.push(el('div', { class: 'notice notice--error' }, ['This browser is blocking storage, so changes will be lost when you move to another page.']));
    }
    return el('footer', { class: 'app-footer' }, children);
  }

  // Builds header, nav, title bar, main and footer into #app. titleText is the visible h1.
  function buildShell(pageId, titleText, stories) {
    var app = document.getElementById('app');
    if (!app) { app = el('div', { id: 'app' }); document.body.appendChild(app); }
    app.textContent = '';
    current.titleEl = el('h1', { class: 'page-title', id: 'page-title' }, [titleText]);
    current.main = el('main', { id: 'main', class: 'app-main', tabindex: '-1' });
    app.appendChild(el('a', { class: 'skip-link', href: '#main' }, ['Skip to main content']));
    app.appendChild(buildHeader());
    app.appendChild(buildNav(pageId));
    app.appendChild(el('div', { class: 'app-titlebar' }, [current.titleEl, UI.storyTags(stories || [])]));
    app.appendChild(current.main);
    app.appendChild(buildFooter());
    document.body.classList.toggle('show-story-tags', !!Store.session.get('storyTags'));
    setTitle(titleText);
  }

  // Access denied screen; renders nothing about the page itself.
  function denied() {
    setTitle('Access denied');
    current.main.appendChild(UI.panel('Access denied', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--error' }, ['Your current role (' + roleLabel(Auth.role()) + ') cannot open this page. This attempt has been logged.']),
      el('div', { class: 'row' }, [
        el('a', { class: 'btn btn--primary', href: Auth.homeFor() }, ['Go to my home page']),
        el('a', { class: 'btn', href: 'index.html' }, ['Choose another role'])
      ])
    ])));
  }

  // Verification gate for customer pages; renders no account data.
  function gate() {
    setTitle('Verification required');
    current.main.appendChild(UI.panel('Verification required', el('div', { class: 'stack' }, [
      el('div', { class: 'notice notice--warn' }, ['Please verify your identity before using this page.']),
      el('p', null, ['No account information is shown until verification succeeds.']),
      el('a', { class: 'btn btn--primary', href: 'portal-verify.html' }, ['Go to identity verification'])
    ])));
  }

  // Runs a page callback; a thrown error is shown on the page instead of leaving it blank.
  function run(cb) {
    try {
      cb(current.main);
    } catch (err) {
      current.main.appendChild(el('div', { class: 'notice notice--error' }, ['This page failed to load: ' + err.message]));
      if (window.console) { console.error(err); }
    }
  }

  // True if the verified customer id still points at a real customer.
  function customerVerified() {
    var id = Auth.verifiedCustomer();
    return !!id && !!Store.find('customers', id);
  }

  // Renders the shell and applies the role guard and verification gate. Returns true if the page may run.
  function init(pageId) {
    Store.init();
    var page = Auth.page(pageId);
    current.pageId = pageId;
    current.inited = true;
    current.allowed = false;

    buildShell(pageId, page ? page.title : 'Page not found', page ? page.stories : []);

    if (!Auth.can(pageId)) {
      Auth.logAccessAttempt(pageId);
      denied();
      current.queue = [];
      return false;
    }
    if (page.needsVerified && Auth.role() === 'customer' && !customerVerified()) {
      gate();
      current.queue = [];
      return false;
    }
    current.allowed = true;
    var queued = current.queue;
    current.queue = [];
    queued.forEach(run);
    return true;
  }

  // Queues the page callback until init has allowed the page (runs at once if init already did).
  function ready(cb) {
    if (!current.inited) { current.queue.push(cb); }
    else if (current.allowed) { run(cb); }
  }

  window.Layout = { init: init, ready: ready, setTitle: setTitle, gate: gate, denied: denied };

  // Pages with data-page start automatically; reports.html calls Layout.init itself.
  function autoStart() {
    var id = document.body.getAttribute('data-page');
    if (id) { init(id); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', autoStart); } else { autoStart(); }
})();
