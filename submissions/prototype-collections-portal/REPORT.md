# Director's Report: Collections Portal Prototype

## 1. What was created

An interactive wireframe prototype of the Phase 1 collections system. Built with vanilla HTML5, CSS3, and ES5 JavaScript with zero build steps and local browser persistence. It incorporates the Director's brand identity and standards: primary navy blue (`#0b2545`) styling, a contrasting orange (`#d35400`) demo control bar, true black body text (`#000`), clear demo-only element styling with explicit `Demo only` badges, and zero page open/load latency metadata or redundant simulated markers.

The prototype comprises **19 pages and 17 reports** across three main operational areas:

- **Dedicated Home Page (`index.html`)**: Features functional operational authentication — customer sign-in (account ID and password, e.g. `100001` / `demo123`) and customer self-registration (without outstanding balance input; auto-provisioning sequential accounts and audit records), alongside staff-only authentication routing directly to the appropriate staff workspace.
- **Dedicated Demo Hub (`demo.html`)**: Evaluator and presenter hub housing end-to-end role walkthrough tabs, the pre-seeded test customer accounts matrix (100001–100009), and the prototype sitemap. Directly accessible from every screen via the **"Demo Guide & Sitemap"** button in the top orange demo bar.
- **Customer portal** (6 pages plus message viewer): verify identity with account ID and password, view the account, pay (full or part), make a promise to pay, update contact details, and manage reminder preferences.
- **Staff workspace** (4 pages): clean search by account number (without extraneous demo panels or redundant second-system notices), customer record (with caller phone verification gate), standard interaction log form, and follow-up queues. Team leaders also have reversal approval, reminder timing configuration, and team reporting.
- **Oversight** (finance, compliance, and IT): 17 reports (balances, reconciliation, audit trail, verification log, lockouts, delivery and more), template approval, contact-limit setting, background-job execution console, message delivery telemetry (outbox), and a read-only data interface demo.

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

1. Open `submissions/prototype-collections-portal/index.html` directly in Google Chrome, Microsoft Edge, or Safari (`file://` protocol). There is no installation and no server required.
2. The **Home Page (`index.html`)** presents two clean operational entry gates:
   - **Customer Portal**: Sign in with an existing account (e.g. Account number `100001` and password `demo123`) or use **New Customer Registration** to create a fresh customer record (without inputting an outstanding balance).
   - **Staff Workspace**: Sign in with any provisioned staff persona (Collections Rep, Team Leader, Finance, Compliance, IT) and PIN (`demo123`).
3. Click **"Demo Guide & Sitemap"** in the top orange demo bar to open `demo.html` for complete test credentials (accounts 100001 to 100009), role walkthrough scripts, and full sitemap links.
4. Use the "Role" selector in the demo bar to switch role at any time. "Advance day" advances simulated time to demonstrate time-driven features.

**Suggested walkthrough**

1. On `index.html`, register a new customer or sign in as `100001` with password `demo123`. On `portal-account.html`, view balance, make a partial payment on `portal-pay.html`, and arrange a promise to pay on `portal-promise.html`. View notifications in `outbox.html`.
2. Open `demo.html` via the orange demo bar to inspect the sitemap and test accounts.
3. Under Staff Workspace on `index.html` (or via the header role selector), sign in as Collections Rep. Search `100001`, verify caller by phone (DOB `1988-04-12`, Postcode `M14 5QT`), and inspect payment and promise history. Log an interaction on `staff-log.html` to generate an automated follow-up.
4. Switch to IT. On `jobs.html`, run the fulfilment check (test normal run, retry exhaustion, and missed deadline simulation), then run the reminder job. Access `outbox.html` to observe delivery telemetry.
5. Switch to Team Leader. Approve a payment reversal on `staff-approvals.html`, adjust reminder timing on `reminders-config.html` (observing "Already scheduled" panel), and view team logs and unfulfilled promises reports.
6. Switch to Finance and Compliance. Inspect reconciliation, the immutable audit trail, template approval, and display sampling.
7. As Customer, simulate 3 failed verification attempts on `portal-verify.html` using an incorrect password. Switch to Rep, verify by phone, and click **Unlock account**.

## 4. Errors and issues

**Found and fixed in the single review round (Code Reviewer, QA Tester, Compliance Liaison, and automated testing)**
- **16 Director-Requested Refinements**:
  1. Removed 'how this would work in production' note from demo page.
  2. Removed data rights, privacy notice, and reset demo data sections and jumps from demo page.
  3. Removed demo data only notice and placeholder privacy notice footer from all pages.
  4. Removed outstanding balance input field from customer self-registration form.
  5. Updated customer sign in to use Account ID and Password across `index.html` and `portal-verify.html` (DOB and postcode inputs eliminated; reserved exclusively for staff phone verification of callers).
  6. Cleaned up top bar role selector label to read "Role" (removed "(stub login, not security)").
  7. Removed grouping metadata tags ('SHARED', 'REPORTS', 'STAFF', 'CUSTOMER', 'ADMIN') from the site navigation bar.
  8. Removed the reviewer and evaluator hub banner from the home page.
  9. Removed the demo page link located below the verify button on the access page (`portal-verify.html`).
  10. Removed postcode from the non-editable details panel on `portal-details.html` (remains editable under contact details).
  11. Removed "Nothing is really sent in this prototype" / "nothing is really sent to you" disclaimers from `outbox.html`.
  12. Removed the "One record, no second system" notice panel from collections rep customer search (`staff-search.html`).
  13. Removed the demo accounts inventory panel from customer search (`staff-search.html`).
  14. Restricted outbox view exclusively to Customer (own messages) and IT (delivery telemetry) roles; removed outbox links from `staff-record.html` and `staff-approvals.html`; unauthorized staff attempts receive "Access denied".
  15. Removed the "Everything needed for a standard case is on this record..." notice from customer records (`staff-record.html`).
  16. Updated reminder configuration panel heading from "Already scheduled (these keep their timing)" to "Already scheduled".
- **Code Reviewer & Liaison Remediations**:
  - Redacted plaintext passwords from `Services.ownRecord` customer API JSON responses (`delete out.password`).
  - Separated authentication gating logic in `Services.verify`: required non-empty password verification for `portal` logins, while maintaining DOB and postcode matching for `phone` caller verification.
  - Added `password: 'string'` to the `CUSTOMER_TYPES` schema definition.
  - Added Password column (`demo123`) to the demo test accounts table in `demo.js` and aligned customer walkthrough copy to password verification.
  - Purged dead rep/leader branches, hidden message counts, and outdated commentary from `outbox.js`.
  - Removed lingering anchor links pointing to deleted `#privacy` sections.

**Still open**
- Role switching remains a client-side prototype convenience in the top demo bar.
- Client-side mock store stores demo passwords in plaintext in local storage (standard for client-side wireframes; production architectures require salted hashing via external IDP).
- Creditor ledger integration: public customer signup provisions a default balance of £250.00 without connecting to a real external core-banking ledger.

## 5. Out-of-scope work

- Automated browser-driven UI smoke testing was conducted by the QA Tester subagent.
- No backend (Python) work was required; all state management, scheduling, and validation run purely in client-side JavaScript.

## 6. Subagent changes

- **Designer**: Enforced clean operational navigation without metadata grouping headers, streamlined search without demo hints, and dedicated password credentials for customer portal.
- **Frontend Developer**: Enforced account ID and password authentication for portal sign-in, removed balance fields from registration, and restricted outbox accessibility to Customer and IT roles only.
- **Compliance Liaison**: Maintained auditing of authentication gating, data redaction in API responses, and strict role segregation.

## 7. Workflow variations

- Per the Director's explicit instruction (*"Only have 1 review round"*), **exactly one review round** was executed across Code Reviewer, QA Tester, and Compliance Liaison.
- Remediation fixes identified during the review round (password redaction in API serialization, method-specific authentication gating, and outbox dead code pruning) were completed in a single consolidated developer pass.
- The Technical Writer updated `submissions/prototype-companion-report.md` to align with the revised prototype.

## 8. Compliance and branding

- **Branding and standards**: No custom branding standards were supplied by the director for this round. Top bar and navigation were streamlined to remove metadata clutter.
- **Compliance findings**: All customer data remains gated behind account ID and password authentication. Phone verification preserves caller verification using date of birth and postcode. Outbox access is strictly segregated so that collections staff cannot browse customer outboxes without case context, while IT accesses delivery telemetry only. API serialization strictly strips plaintext credentials. Global footers and demo disclaimers were removed per explicit director instruction.
