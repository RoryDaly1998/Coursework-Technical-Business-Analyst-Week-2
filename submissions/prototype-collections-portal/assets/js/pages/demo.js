/* demo.html page script: demo guide, walkthroughs, test accounts, site map, privacy notice and reset. */
(function () {
  'use strict';

  var el = UI.el;

  var ROLE_BLURB = {
    customer: 'Verify your identity, then pay, promise to pay, update your details and read your messages.',
    rep: 'Find a customer, verify the caller, log contacts and work your follow-ups.',
    leader: 'Review team activity, approve reversals, reassign overdue follow-ups and set reminder timing.',
    finance: 'Run balance, outcome, reconciliation, fulfilment and forecast reports.',
    compliance: 'Audit trails, log exports, verification and payment audits, template approval and contact limits.',
    it: 'Run scheduled jobs, check migration, security, alerts, delivery and the read-only data interface.'
  };

  var PURPOSES = {
    '100001': 'Happy path: pay, promise, update details, reminders',
    '100002': 'Promise due today, fully paid (Fulfilled)',
    '100003': 'Promise due today, part-paid (Partially fulfilled)',
    '100004': 'Promise due today, nothing paid (Not fulfilled)',
    '100005': 'Bounced email address',
    '100006': 'Pre-locked account (rep unlock demo)',
    '100007': 'Zero balance (no reminder sent)',
    '100008': 'Opted out of reminders, at contact limit (skipped)',
    '100009': 'Team B, prefers SMS 09:00-12:00'
  };

  // Each step: [pageId or null, text, stories]. Pages are opened by the role the step belongs to.
  var WALKTHROUGH = {
    customer: [
      ['portal-verify', 'Open Verify identity. First enter a wrong date of birth for account 100001: the message is generic, offers the rep contact route and never says which detail was wrong. An unknown or locked account gets the same message.', 'US-19, US-20'],
      ['portal-verify', 'Verify as account 100001 using the date of birth and postcode from the demo logins table below.', 'US-19'],
      ['portal-account', 'On My account check the balance, due date and payments. Use "Raise a query" to report a missing payment.', 'US-28, US-41'],
      ['portal-pay', 'Make a payment: try an amount above the balance (blocked), then pay part of it. Use the demo provider-result control to simulate Decline and retry, then Timeout-but-charged and retry: no duplicate payment appears.', 'US-12, US-13, US-14'],
      ['portal-promise', 'Promise to pay: choose a permitted plan and a date inside the window. A second promise replaces the first.', 'US-35, US-36'],
      ['portal-details', 'Update details: an invalid email or postcode shows a field error; a valid change saves immediately.', 'US-43, US-44'],
      ['outbox', 'Open the Outbox for the payment, promise and change messages (the change notice goes to the previous contact details).', 'US-13, US-36, US-45'],
      ['portal-preferences', 'Open a reminder message in the Outbox and follow its preferences link to opt out without logging in. Turning reminders back on needs you to sign in first.', 'US-49'],
      ['portal-verify', 'Lockout: enter three wrong attempts for another account (demo threshold 3). The message stays the same and the contact route stays available, because the lock shows to staff only (the rep record shows the Locked badge). Account 100006 starts locked. Use Reset demo data afterwards.', 'US-20, US-23']
    ],
    rep: [
      ['staff-search', 'Search for account 100001 (any of 100001 to 100009). Use the staff user selector in the header to switch between reps.', 'US-03'],
      ['staff-record', 'The record stays locked until the caller verification panel returns Verified (date of birth and postcode from the demo logins) or you choose "Internal review (no caller)". Both are logged.', 'US-21'],
      ['staff-record', 'Browse the Summary, History and Follow-ups tabs and the Preferences panel. Fields your role may not see are shown as "Restricted for your role".', 'US-03, US-05, US-34'],
      ['staff-log', 'Log an interaction: save it empty to see the field errors, choose outcome PTP to make the promise fields required, then save and review the follow-up panel (changing its date needs a reason).', 'US-08, US-30'],
      ['staff-log', 'Log another contact for account 100008 to see the contact-limit warning and the override reason.', 'US-33'],
      ['staff-followups', 'Open Follow-ups, work a due item through its record and mark it complete.', 'US-31'],
      ['staff-record', 'Account 100006 is locked: after a Verified phone check use "Unlock account".', 'US-23'],
      ['staff-record', 'Account 100004 shows a Not fulfilled banner once the IT user has run the fulfilment check (see the IT walkthrough).', 'US-25'],
      ['staff-record', 'Open account 100009, which prefers SMS 09:00-12:00. Any rep can open any account in this demo.', 'US-34']
    ],
    leader: [
      ['staff-search', 'Open a customer record as a leader. The History tab shows event-type and date filters, and fields hidden from reps (date of birth, internal notes, ledger reference) are visible.', 'US-05'],
      ['staff-followups', 'Follow-ups shows the team\'s overdue items. Reassign one to another rep; a follow-up entry is logged.', 'US-32'],
      ['staff-approvals', 'Approvals: pick a payment, choose the required reason code and approve. The balance is corrected, a reversal is logged and the customer message appears in the Outbox once the customer record is unlocked for you.', 'US-18'],
      ['reminders-config', 'Reminder timing: change days-before within the allowed range. Existing scheduled reminders keep their timing; new ones use the new value.', 'US-51'],
      ['report-team-logs', 'Team interaction logs: filter by rep, outcome code and date. Only your team\'s logs are listed.', 'US-09'],
      ['report-unfulfilled-promises', 'Unfulfilled promises: run the IT fulfilment check first so there is data to show.', 'US-26'],
      [null, 'Switch to the Collections rep role and try to open Approvals from the site map: you will see Access denied and the attempt is logged.', 'US-02, US-18']
    ],
    finance: [
      ['report-balances-arrears', 'Balances and arrears: run the report on demand and compare the totals with the source ledger total.', 'US-06'],
      ['report-outcomes', 'Outcome codes: count and value by outcome, reconciled to the number of logged cases.', 'US-11'],
      ['report-reconciliation', 'Reconciliation: make a portal payment as a customer first, then compare system payments with the provider settlement and review unmatched items.', 'US-16'],
      ['report-fulfilment-value', 'Promise fulfilment value: run the IT fulfilment check first, then view value by result and period.', 'US-27'],
      ['report-promise-forecast', 'Promise forecast: choose a period and compare promised with received.', 'US-38'],
      [null, 'Switch to the Collections rep role and open the balances report from the site map: Access denied.', 'US-06']
    ],
    compliance: [
      ['report-audit-trail', 'Audit trail: filter by customer, user, date and channel. Rows are read-only and show before and after values.', 'US-04, US-39, US-47'],
      ['report-log-export', 'Interaction log export: filter, then Export CSV (a real file) and Export PDF (print view stub).', 'US-10'],
      ['report-verification-log', 'Verification log: outcomes only, never any answers.', 'US-22'],
      ['report-payment-audit', 'Payment audit: run "Scan for card data" and confirm 0 matches.', 'US-17'],
      ['report-display-sampling', 'Display sampling: run the sample check; report a discrepancy to IT.', 'US-42'],
      ['report-followup-history', 'Follow-up history: filter by customer and export.', 'US-33'],
      ['compliance-settings', 'Compliance settings: approve a pending template version and edit the contact-frequency limit.', 'US-33, US-52']
    ],
    it: [
      ['jobs', 'Jobs: run the fulfilment check, then the reminder job. Try "Simulate failure" to see retries and the deadline alert. Use Advance day in the header to show time passing.', 'US-24, US-29, US-48'],
      ['outbox', 'Outbox: see delivery status, kind and template of the missing-payment and reminder messages produced by the jobs. IT sees masked addresses and no message text.', 'US-28, US-48'],
      ['report-reminder-delivery', 'Reminder delivery: sent, delivered, bounced and failed, with the failure-rate alert (account 100005 has a bounced address).', 'US-53'],
      ['report-migration-exceptions', 'Migration exceptions: review the totals and run the data type check.', 'US-01'],
      ['report-security-status', 'Security status: run the access tests, read the encryption and backup evidence and review the unauthorised-access log.', 'US-02'],
      ['report-lockouts-alerts', 'Lockouts and alerts: locked accounts and raised alerts.', 'US-23'],
      ['api-demo', 'Read-only data interface: read your own record (200), another customer\'s (403) and attempt a write (405).', 'US-40']
    ]
  };

  // Built on demand so the retention value is read after the store is ready. Placeholder headings are marked for review.
  function privacyRows() {
    return [
      ['What this is', 'This is a prototype. It uses made-up people and accounts only. This demo stores fictional data in your browser\'s local storage and sends nothing to anyone. Reset demo data clears it.'],
      ['Who is responsible (controller) [PLACEHOLDER]', 'PLACEHOLDER: the organisation that decides why and how personal data is used would be named here, with the contact details of its data protection lead.'],
      ['Why data is used and lawful basis [PLACEHOLDER]', 'PLACEHOLDER: the purposes (running the account, collecting repayments fairly, meeting legal and regulatory duties, keeping a record that can be checked later) and the lawful basis for each, to be confirmed by the organisation\'s data protection lead.'],
      ['What a live service would collect', 'Only what is needed to manage a customer\'s account and repayments: identity and contact details, balance and payment history, and a record of contacts and agreements.'],
      ['Who it is shared with', 'The payment provider (card payments; only a token is kept here), the email provider and the SMS provider (sending messages and reporting delivery). PLACEHOLDER: the final list of providers and any other recipients.'],
      ['Who could see it', 'Only people whose role needs it. Every page checks the role, and refused attempts are logged.'],
      ['Card details', 'The portal never stores card numbers. In production card details would be entered on the payment provider\'s own form, and only a token would be kept.'],
      ['How long it is kept', ['Only as long as needed. The retention period is still to be decided: ', UI.tbd('Audit and log retention', Services.setting('retentionYears')), ' years. [PLACEHOLDER]']],
      ['Automated decisions', 'None in this prototype. No decision about a customer is made only by automated means. Account lockout and reminder timing follow fixed settings, and a rep reviews any query a customer raises.'],
      ['Wording', 'This is placeholder wording for the prototype. A live service would use a notice approved by the organisation\'s data protection lead.']
    ];
  }

  function buildRights() {
    return UI.panel('Your data rights', el('div', { class: 'stack' }, [
      el('ul', null, [
        el('li', null, [el('strong', null, ['Access: ']), 'ask to see the personal data held about you.']),
        el('li', null, [el('strong', null, ['Correction: ']), 'ask for wrong data to be corrected (you can change your phone, email and address in the portal).']),
        el('li', null, [el('strong', null, ['Erasure: ']), 'ask for your data to be erased where the law allows.']),
        el('li', null, [el('strong', null, ['Objection: ']), 'object to how your data is used.'])
      ]),
      el('p', null, [el('strong', null, ['How to ask [PLACEHOLDER]: ']), 'PLACEHOLDER: the data protection contact (email and postal address) will be added here. Until then, speak to a collections rep on ' + Services.REP_CONTACT_PHONE + ' (demo number).']),
      el('p', { class: 'muted' }, ['You can also complain to the data protection regulator.'])
    ]));
  }

  // Builds a titled panel with an anchor id.
  function section(id, title, body, opts) {
    var p = UI.panel(title, body, opts);
    p.id = id;
    return p;
  }

  // Link to a page by PAGES id, or plain text if the id is unknown.
  function pageLink(pageId) {
    var page = Auth.page(pageId);
    return page ? el('a', { href: page.file }, [page.title]) : null;
  }

  // Sets the role and goes to its home page.
  function startAs(roleId) {
    Auth.setRole(roleId);
    window.location.href = Auth.homeFor(roleId);
  }

  function buildRoleCards() {
    var current = Auth.role();
    var cards = Store.get('roles').map(function (r) {
      return el('button', {
        type: 'button', class: 'index-role-card' + (r.id === current ? ' is-active' : ''), onclick: function () { startAs(r.id); }
      }, [
        el('span', { class: 'index-role-card__title' }, [r.label]),
        el('span', null, [ROLE_BLURB[r.id] || '']),
        el('span', { class: 'index-role-card__hint' }, [r.id === current ? 'Current role. Open its home page' : 'Start as this role'])
      ]);
    });
    return el('div', { class: 'grid grid--3' }, cards);
  }

  function buildWalkthrough() {
    var defs = Store.get('roles').map(function (r) {
      return {
        id: r.id,
        label: r.label,
        render: function (container) {
          container.appendChild(el('p', null, ['Suggested route for the ' + r.label + ' role. Choose the role first so the links open for it.']));
          container.appendChild(el('p', null, [el('button', { type: 'button', class: 'btn btn--primary', onclick: function () { startAs(r.id); } }, ['Start as ' + r.label])]));
          var ol = el('ol', { class: 'index-steps' });
          (WALKTHROUGH[r.id] || []).forEach(function (s) {
            var link = s[0] ? pageLink(s[0]) : null;
            ol.appendChild(el('li', null, [s[1], link ? [' Open: ', link, '.'] : null, ' ', el('span', { class: 'muted' }, ['(' + s[2] + ')'])]));
          });
          container.appendChild(ol);
        }
      };
    });
    return UI.tabs(defs);
  }

  function buildLogins() {
    var mount = el('div');
    var customers = Store.get('customers').slice().sort(function (a, b) { return String(a.accountNo).localeCompare(String(b.accountNo)); });
    UI.table(mount, {
      columns: [
        { key: 'accountNo', label: 'Account number', format: function (v) { return el('span', { class: 'mono' }, [v]); } },
        { key: 'name', label: 'Name' },
        { key: 'dob', label: 'Date of birth', format: function (v) { return Fmt.date(v) + ' (' + v + ')'; } },
        { key: 'postcode', label: 'Postcode', format: function (v) { return el('span', { class: 'mono' }, [v]); } },
        { key: 'purpose', label: 'Purpose' }
      ],
      rows: customers.map(function (c) {
        return { accountNo: c.accountNo, name: c.name, dob: c.dob, postcode: c.postcode, purpose: PURPOSES[c.accountNo] || '' };
      }),
      empty: 'No customers found. The seed data files have not loaded.'
    });
    return el('div', { class: 'demo-only stack' }, [
      el('div', { class: 'notice notice--warn' }, [
        el('span', { class: 'badge badge--demo' }, ['Demo only']),
        'A real portal would never show these credentials. They are provided here solely so reviewers and testers can verify accounts.'
      ]),
      el('p', null, ['Customer verification uses account number, date of birth and postcode. A rep\'s phone verification of a caller uses the same three details.']),
      mount
    ]);
  }

  function buildSiteMap() {
    var mount = el('div');
    var roles = Store.get('roles');
    UI.table(mount, {
      columns: [
        { key: 'title', label: 'Page', format: function (v, row) { return el('a', { href: row.file }, [v]); } },
        { key: 'group', label: 'Group' },
        {
          key: 'roles', label: 'Roles', format: function (v) {
            return el('span', { class: 'index-sitemap-roles' }, v.map(function (id) {
              var r = roles.filter(function (x) { return x.id === id; })[0];
              return UI.badge(r ? r.label : id);
            }));
          }
        },
        { key: 'stories', label: 'Stories', format: function (v) { return v.join(', '); } }
      ],
      rows: window.PAGES.filter(function (p) { return !p.hideInNav; })
    });
    return el('div', { class: 'stack' }, [
      el('p', null, ['Every page in the prototype. A page opens only for the roles listed; other roles see Access denied.']),
      mount
    ]);
  }

  function buildPrivacy() {
    var dl = el('dl', { class: 'kv' }, privacyRows().reduce(function (acc, row) {
      return acc.concat([el('dt', null, [row[0]]), el('dd', null, [row[1]])]);
    }, []));
    return el('div', { class: 'stack' }, [dl, buildRights()]);
  }

  function buildBrowserNotes() {
    return el('div', { class: 'stack' }, [
      el('p', null, ['This prototype runs by opening the files directly from disk (a file:// address). There is no server and no install.']),
      el('ul', null, [
        el('li', null, ['Use Chrome, Edge or Safari. These keep demo data between pages.']),
        el('li', null, ['Firefox may treat each file as a separate site and lose the saved demo data and role between pages. If you must use Firefox, open the folder through any simple local web server instead.']),
        el('li', null, ['If a banner says storage is blocked, allow site data for local files or use another browser.'])
      ])
    ]);
  }

  function buildReset() {
    return el('div', { class: 'demo-only stack' }, [
      el('p', null, [
        el('span', { class: 'badge badge--demo' }, ['Demo only']),
        'Return all demo data, the demo date and the signed-in role to their starting values.'
      ]),
      el('div', null, [el('button', {
        type: 'button', class: 'btn btn--danger', onclick: function () {
          UI.confirm('Reset all demo data and start again?', { title: 'Reset demo data', confirmLabel: 'Reset', danger: true })
            .then(function (ok) { if (ok) { Store.reset(); } });
        }
      }, ['Reset demo data'])])
    ]);
  }

  Layout.ready(function (main) {
    var jumps = [
      ['roles', 'Choose a role'],
      ['walkthrough', 'Demo walkthrough'],
      ['logins', 'Demo logins'],
      ['sitemap', 'Site map'],
      ['privacy', 'Privacy notice'],
      ['browser', 'Browser notes'],
      ['reset', 'Reset']
    ];

    main.appendChild(el('div', { class: 'stack' }, [
      el('p', null, ['A wireframe prototype of the Phase 1 collections portal. Choose a role to start, review suggested test journeys, inspect test accounts, or reset data. All data is fictional.']),
      el('ul', { class: 'index-jump' }, jumps.map(function (j) { return el('li', null, [el('a', { class: 'btn btn--small', href: '#' + j[0] }, [j[1]])]); })),
      section('roles', 'Choose a role', buildRoleCards(), { note: 'A real service would sign people in with their own credentials. Here the role switcher stands in for login.' }),
      section('walkthrough', 'Suggested demo walkthrough', buildWalkthrough()),
      section('logins', 'Demo test accounts & credentials', buildLogins()),
      section('sitemap', 'Prototype site map', buildSiteMap()),
      section('privacy', 'Privacy and data protection notice', buildPrivacy()),
      section('browser', 'Browser persistence notes', buildBrowserNotes()),
      section('reset', 'Reset demo data', buildReset())
    ]));

    // Content is built after load, so jump to any #anchor manually.
    if (window.location.hash) {
      var target = document.getElementById(window.location.hash.slice(1));
      if (target) { target.scrollIntoView(); }
    }
  });
})();
