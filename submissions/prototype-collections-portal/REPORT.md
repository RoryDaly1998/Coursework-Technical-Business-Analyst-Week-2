# Director's Report: Collections Portal Prototype

## 1. What was created

An interactive wireframe prototype of the Phase 1 collections system. Built with vanilla HTML5, CSS3, and ES5 JavaScript with zero build steps and local browser persistence. It incorporates the Director's brand identity and standards: primary navy blue (`#0b2545`) styling, a contrasting orange (`#d35400`) demo control bar, true black body text (`#000`), clear demo-only element styling with explicit `Demo only` badges, and zero page open/load latency metadata or redundant simulated markers.

The prototype comprises **19 pages and 17 reports** across three main operational areas:

- **Dedicated Home Page (`index.html`)**: Features functional operational authentication — customer sign-in (account number, DOB, postcode) and customer self-registration (auto-incrementing account numbers, schema validation, and audit recording), alongside staff-only authentication routing directly to the appropriate staff workspace.
- **Dedicated Demo Hub (`demo.html`)**: Evaluator and presenter hub housing end-to-end role walkthrough tabs, the pre-seeded test customer accounts matrix (100001–100009), the prototype sitemap, privacy details, and global demo data reset controls. Directly accessible from every screen via the **"Demo Guide & Sitemap"** button in the top orange demo bar.
- **Customer portal** (6 pages plus message viewer): verify identity, view the account, pay (full or part), make a promise to pay, update contact details, and manage reminder preferences.
- **Staff workspace** (4 pages): search by account number, customer record (with phone verification gate), standard interaction log form, and follow-up queues. Team leaders also have reversal approval, reminder timing configuration, and team reporting.
- **Oversight** (finance, compliance, and IT): 17 reports (balances, reconciliation, audit trail, verification log, lockouts, delivery and more), template approval, contact-limit setting, background-job execution console, and a read-only data interface demo.

One header control switches between six roles: Customer, Collections Representative, Team Leader, Financial Partner, Compliance Liaison, and IT Team Member. Each role sees only its own authorised navigation and pages.

## 2. Why: coverage of the 10 epics and 53 stories

| Epic | Stories | Where it is shown | Gaps |
|---|---|---|---|
| 1 Central storage | US-01 to 07 | Single customer record, audit trail, migration report, security status, finance balances | None. Demarcated as demo evidence panels; all artificial open/load timing metadata removed. |
| 2 Record logging | US-08 to 11 | Standard log form, team logs, log export, outcomes report | None. |
| 3 Self-service payments | US-12 to 18 | Portal pay with approve, decline, timeout and safe retry; reconciliation; reversal approval | None. Provider simulated via payment gateway form. |
| 4 Identity verification | US-19 to 23 | Portal verify, lockout, rep phone verification and unlock, verification log | None. |
| 5 Fulfilment check | US-24 to 29 | Jobs page, flag on the record, unfulfilled report, finance report | None. US-29 deadline alert fully evaluated with explicit missed-deadline simulation (07:00 cutoff). |
| 6 Follow-up scheduling | US-30 to 34 | Log form creates follow-ups automatically, rep list, leader reassign, contact limit | None. |
| 7 Promise to pay | US-35 to 39 | Portal promise, confirmation, follow-ups pause, forecast report | None. |
| 8 Account information | US-40 to 42 | Portal account, read-only data interface demo, display sampling | None. Mismatch detected in display sampling. |
| 9 Updating details | US-43 to 47 | Portal details with validation, notice to previous contact, "customer-made change" on the record | None. |
| 10 Reminders | US-48 to 53 | Reminder job, outbox, preferences, timing config, template approval, delivery report | None. Opt-in strictly gated by service verification; re-runs report opted-out accounts as skipped. |

All "n seconds" and "TBD" values in the stories appear as visibly labelled placeholders (for example "TBD (demo: 3)"). Artificial page load and execution timing metadata has been removed in accordance with director requirements.

## 3. How to use it

1. Open `prototype-collections-portal/index.html` by opening it directly in Google Chrome, Microsoft Edge, or Safari (`file://` protocol). There is no installation and no server required.
2. The **Home Page (`index.html`)** presents two operational entry gates:
   - **Customer Portal**: Sign in with an existing account (e.g. `100001`, `1988-04-12`, `M14 5QT`) or use **New Customer Registration** to create a fresh customer record with starting arrears and GDPR consent.
   - **Staff Workspace**: Sign in with any provisioned staff persona (Collections Rep, Team Leader, Finance, Compliance, IT) and PIN (`demo123`).
3. Click **"Demo Guide & Sitemap"** in the top orange demo bar to open `demo.html` for complete test credentials (accounts 100001 to 100009), role walkthrough scripts, and full sitemap links.
4. Use the "Role" selector in the demo bar to switch role at any time. "Advance day" advances simulated time to demonstrate time-driven features. "Reset demo data" restores starting state.

**Suggested walkthrough**

1. On `index.html`, register a new customer or sign in as `100001`. On `portal-account.html`, view balance, make a partial payment on `portal-pay.html`, and arrange a promise to pay on `portal-promise.html`. View notifications in `outbox.html`.
2. Open `demo.html` via the orange demo bar to inspect the sitemap and test accounts.
3. Under Staff Workspace on `index.html` (or via the header role selector), sign in as Collections Rep. Search `100001`, verify caller by phone, and inspect payment and promise history. Log an interaction on `staff-log.html` to generate an automated follow-up.
4. Switch to IT. On `jobs.html`, run the fulfilment check (test normal run, retry exhaustion, and missed deadline simulation), then run the reminder job.
5. Switch to Team Leader. Approve a payment reversal on `staff-approvals.html`, adjust reminder timing on `reminders-config.html`, and view team logs and unfulfilled promises reports.
6. Switch to Finance and Compliance. Inspect reconciliation, the immutable audit trail, template approval, and display sampling.
7. As Customer, simulate 3 failed verification attempts on `portal-verify.html`. Switch to Rep, verify by phone, and click **Unlock account**.

## 4. Errors and issues

**Found and fixed in the review round (Code Reviewer, QA Tester, Compliance Liaison, and terminal smoke tests)**
- **Dedicated Home Page & Demo Hub**: Created dedicated `index.html` with Customer Sign In, Customer Registration, and Staff-only login. Moved evaluator walkthroughs, sitemap, and seed credentials to `demo.html` linked permanently from the demo bar.
- **Corporate Styling & Director Rules**: Replaced dark grey with Navy Blue (`#0b2545`) for headers, primary buttons, active tabs, and table headers. Implemented contrasting orange (`#d35400`) demo control bar. Set body text to true black (`#000`).
- **Demo-Only Element Signage**: Created `.demo-only` containers and `badge--demo` badges clearly labelling demo tools and test forms.
- **Removed Timing Metadata & Simulated Markers**: Eliminated "Opened in X s" and "Loaded in X ms" labels. Removed all "(simulated message)" and "(simulated)" markers across outbox, reports, and job logs.
- **Contract & Schema Fixes in Home Page**: Aligned customer sign-in to `Services.verify` API shape and structured customer registration objects to conform strictly to `CUSTOMER_TYPES` schema in `services.js`.
- **US-29 Missed Deadline Alert**: Implemented explicit option on `jobs.html` to simulate passing the 07:00 cutoff, successfully dispatching high-severity alert `job-deadline-missed` to IT on-call.
- **Reminder Re-Run Skip Logic**: Added scan over sent schedule rows during `runReminders()` so customers who opt out after initial dispatch are explicitly reported under Skipped as "Opted out of reminders".
- **Service-Level Reminder Opt-In Guard**: Updated `Services.setReminderPrefs` / `updateReminderPrefs` to block unauthenticated callers from turning reminders back on, enforcing verification at the service layer.
- **Accessibility Enhancements**: Upgraded `UI.tabs` with full WAI-ARIA tablist arrow key navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`) and roving `tabindex`. Upgraded `UI.modal` with `Escape` key dismissal and Tab focus trapping.
- **Compliance & Privacy Upgrades**: Added GDPR data processing explanation and consent checkbox to the customer registration form. Wrapped unauthenticated recipient picker on `portal-preferences.html` in `.demo-only` with `badge--demo`. Updated privacy links across the prototype to point to `demo.html#privacy`.

**Still open**
- Role switching remains a client-side prototype convenience labelled "stub login, not security".
- Automated access tests compare registered roles against planned permissions client-side rather than testing a remote OAuth/SAML token authority.
- Fictional personal data in audit trail rows and compliance exports is unmasked (using standard reserved `@example.com` domains and non-geographic telephone numbers).

## 5. Out-of-scope work

- Terminal smoke testing and automated integrity checks were run directly by the QA Tester subagent.
- No backend (Python) work was required; all state management, scheduling, and validation run purely in client-side JavaScript.

## 6. Subagent changes

- **Designer**: Added rules enforcing director branding (navy blue `#0b2545`, orange `#d35400` demo bar, black text), demo-only styling rules, removal of open-time metadata and simulated markers, and the requirement for a dedicated operational home page paired with a demo hub.
- **Frontend Developer**: Added strict styling rules for navy blue `#0b2545`, orange demo bar, black text, `.demo-only` containers, prohibition of page open metadata, and service-level verification enforcement.
- **Compliance Liaison**: Added explicit checklist items auditing director styling rules (colours, text contrast, demo badges, no timing metadata, no simulated markers, dedicated home page).

## 7. Workflow variations

- Per the Director's explicit instruction (*"Just do the one review round and then do revisions, then output"*), **exactly one comprehensive review round** was executed comprising Code Reviewer, QA Tester, and Compliance Liaison.
- All defects identified during the review round (broken verify API call, schema alignment, privacy consent on registration, demo-only styling on recipient picker, and text contrast) were fully remediated by developers in a single revision pass.
- The Technical Writer updated `submissions/prototype-companion-report.md` to document the new architecture, styling, and story traceability.

## 8. Compliance and branding

- **Branding and standards**: Fully compliant with Director rules. Primary brand colour is Navy Blue (`#0b2545`); demo bar is contrasting Orange (`#d35400`); body text is true black (`#000`); demo-only elements are visibly highlighted and badged; no page load latency metadata or simulated message tags are displayed.
- **Compliance findings**: All customer data is gated behind authentication/verification. Customer self-registration includes explicit GDPR data protection notice and consent confirmation. Unauthenticated opt-out is supported via opaque tokens, while re-enabling reminders requires authenticated session verification. Spreadsheet exports sanitize formula injection. Fictional data uses reserved domains and prefixes throughout.
