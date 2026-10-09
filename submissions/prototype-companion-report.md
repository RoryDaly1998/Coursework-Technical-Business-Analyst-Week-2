# Collections Portal Prototype: Companion Guide & User Story Mapping

## 1. Overview & How to Run the Prototype

This companion document serves as the Technical Business Analyst (TBA) reference guide for the **Smart-Recovery Collections Portal Wireframe Prototype**, located in `submissions/prototype-collections-portal/`. It details how the interactive prototype demonstrates every user story from `docs/user-stories-report.md` (all 53 stories across 10 Epics) and catalogues all exception and unhappy paths implemented in the system.

### Prototype Architecture & Operating Principles
- **Zero-Build & Zero-Install**: Built entirely with vanilla HTML5, CSS3, and ES5 JavaScript. Runs locally directly in modern browsers (Google Chrome, Microsoft Edge, Safari) by opening `index.html`. No Node.js runtime, build tools, or web servers are required.
- **Dedicated Operational Home vs Demo Hub**:
  - **Dedicated Home Page (`index.html`)**: Features functional operational authentication — Customer Sign In (Account ID and Password [demo: `demo123`]) and New Customer Registration (auto-provisioning sequential accounts and audit records, excluding the field for existing outstanding balance and defaulting to a standard initial balance of £250.00), alongside Staff Sign In (centralized identity selection and PIN authentication routing directly to the appropriate staff workspace). The home page contains no reviewer or evaluator hub banner, maintaining a clean operational landing page.
  - **Dedicated Demo Hub (`demo.html`)**: Dedicated evaluator and presenter hub housing end-to-end role walkthrough tabs, the pre-seeded test customer accounts matrix (100001–100009) with verification credentials, the interactive prototype sitemap, and browser persistence guidance. Directly accessible from any screen via the **"Demo Guide & Sitemap"** button in the top demo bar. To ensure focus on wireframe evaluation, `demo.html` excludes the "how this would work in production" note, the privacy notice and data rights sections, and the reset demo data panel (which is globally accessible via the header demo bar).
- **Corporate Branding & Standards**:
  - **Navy Blue Primary Palette (`#0b2545`)**: Applied to headers, primary action buttons, active navigation items, active tab indicators, and table headers.
  - **Contrasting Orange Demo Bar (`#d35400`)**: Prominently highlights presenter controls. The role selector label is simply **"Role"** (with "(stub login, not security)" removed), alongside the staff user selector, simulated clock, story tags toggle, reset demo data button, and demo hub link.
  - **Clean Direct Site Navigation**: Site navigation displays clean direct links without grouping metadata labels ("SHARED", "REPORTS", "STAFF", "CUSTOMER", "ADMIN"), providing an uncluttered, intuitive menu for each authenticated persona.
  - **Clean Footers Across All 19 Pages**: Footers across all 19 prototype pages have no "Demo data only" warning or placeholder privacy notice, rendering cleanly and only surfacing a technical notification if browser storage is blocked.
  - **True Black Body Text (`#000000`)**: Guarantees maximum legibility across all forms, tables, notices, and documentation.
  - **Demo-Only Element Signage**: Any demo-specific control or temporary presentation helper is distinctly styled with a dashed container (`.demo-only`) and badged with `<span class="badge badge--demo">Demo only</span>`.
  - **Removal of Latency & Simulated Markers**: Artificial load-time metadata (e.g. "Opened in X s") and redundant markers like "(simulated message)" have been completely eliminated.
- **WAI-ARIA Accessibility**: Tab components implement arrow key navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`) with roving `tabindex` and `aria-selected` state management; modal dialogs implement `Escape` key dismissal, focus trapping, and focus restoration to trigger elements.
- **Local State Persistence**: All data operations run against an in-memory and `localStorage`-backed store (`Store` in `assets/js/core.js`), pre-seeded with 9 realistic customer personas and historical activity (`data/seed-customers.js`, `data/seed-activity.js`, `data/seed-config.js`).
- **Simulated Clock**: An advanceable demo clock (`Clock`) enables immediate demonstration of time-based features (e.g. reminder lead times, overdue follow-ups, and fulfilment check windows) without waiting days.
- **Role-Based Access Control (RBAC)**: A global header switcher simulates six distinct stakeholder personas, enforcing strict page and data segregation:
  1. **Customer**: Self-service portal (verification via Account ID and Password, account review, card payments, promises to pay, contact detail updates, reminder preferences, and message outbox for own messages).
  2. **Collections Representative (Rep)**: Staff workspace (customer search, single customer record with caller phone verification gate using DOB and postcode, standard interaction log, follow-up queues). *Note: Reps do not have access to Outbox or links to it; case communications are reviewed directly on the customer record.*
  3. **Collections Team Leader**: Operational management (overdue follow-up reassignment, payment reversal approvals, reminder timing configuration, team interaction logs, unfulfilled promises report). *Note: Team Leaders do not have access to Outbox or links to it.*
  4. **Financial Partner**: Financial governance and reporting (balances and arrears, outcome code value breakdown, provider payment reconciliation, promise fulfilment value, promise cash flow forecast).
  5. **Compliance Liaison**: Regulatory compliance and audit trails (immutable audit trail, case log exports, verification logs, payment audit, display sampling checks, follow-up history, template approvals, contact frequency limits).
  6. **IT Team Member**: Platform health and security (data migration exceptions, security and backup status, lockout and spike alerts, reminder delivery monitoring, scheduled job execution console, read-only API console, and outbox delivery telemetry [masked recipient addresses and delivery status without message text]).
- **Strict Outbox Role Restriction**: Outbox (`outbox.html`) is strictly restricted to Customer (viewing own sent messages) and IT (inspecting delivery telemetry and message status) roles. Collections Rep and Team Leader roles do not have access to Outbox or links to it. Furthermore, on `outbox.html`, the informational banner cleanly states "These are the messages we have sent to you." (or delivery telemetry note for IT), and no longer states "Nothing is really sent in this prototype" or "nothing is really sent to you".

### Quick-Start Instructions
1. Navigate to `submissions/prototype-collections-portal/` and open `index.html` in your browser.
2. Observe the dedicated Home Page: sign in as an existing customer (using Account ID and password `demo123`), register a new customer (auto-provisioned with standard £250.00 initial balance), or sign in as a staff member.
3. Access the demo hub anytime: click **"Demo Guide & Sitemap"** in the orange demo bar at the top of any page to open `demo.html`.
4. Observe the global header at the top of every screen:
   - **Demo Guide & Sitemap Button**: Quick access to walkthroughs, sitemap, and seed account credentials.
   - **Role Selector**: Simply labeled **"Role"**; switch dynamically between Customer, Collections Rep, Team Leader, Finance, Compliance, and IT.
   - **Staff User Selector**: When in staff roles, switch between specific users and teams (e.g. Sam Patel [Team A], Jo Okafor [Team A], Lee Chen [Team B], Priya Nair [Team Leader]).
   - **Demo Date**: Shows current simulated date; click **"Advance day"** to simulate passing time.
   - **Story Tags Toggle**: Check the **"Story tags"** box to highlight visual badges (e.g. `US-12`, `US-19`) over corresponding UI elements.
   - **Reset Demo Data**: Reverts all mutations back to original seed data.

---

## 2. Seed Accounts & Test Personas Matrix

The prototype includes 9 seed customer accounts (`100001` through `100009`), each pre-configured to demonstrate specific happy and exception paths.

> **Authentication Dual-Gate Specification**:
> - **Customer Self-Service Portal Sign In & Verification (`index.html`, `portal-verify.html`)**: Requires **Account Number** and **Password** (default demo password for all accounts: `demo123`).
> - **Staff Phone Caller Verification (`staff-record.html`)**: When a customer calls in, the Collections Representative verifies the caller using **Date of Birth (DOB)** and **Postcode** before customer account details unlock.

| Account | Customer Name | Balance | Status / Test Focus | Customer Portal Login (Password) | Rep Phone Verification (DOB / Postcode) |
|---|---|---|---|---|---|
| `100001` | Alex Hartley | £420.00 | **Happy Path Baseline**: Reliable payer, £130 promise fulfilled, eligible for payments, promises, detail edits. | `demo123` | `1988-04-12` / `M14 5QT` |
| `100002` | Maya Thompson | £350.00 | **Promise Paid**: Active promise £150 due today; paid £150 3 days ago. Scheduled check marks Fulfilled. | `demo123` | `1979-09-23` / `B15 2TT` |
| `100003` | Daniel Okoye | £560.00 | **Partially Fulfilled**: Active promise £200 due today; paid £80. Fulfilment check marks Partially fulfilled (£120 shortfall). Has display discrepancy in sampling check. | `demo123` | `1992-01-30` / `LS6 1AB` |
| `100004` | Chloe Bennett | £390.00 | **Not Fulfilled**: Active promise £120 due today; £0 paid. Fulfilment check marks Not fulfilled (£120 shortfall), triggers missing payment notice. | `demo123` | `1985-11-05` / `BS8 3NP` |
| `100005` | Jamie Carter | £240.00 | **Delinquency Hold & Bounced Email**: Email bounced; card timeout charge query open; collection activity on hold. | `demo123` | `1990-07-19` / `NE4 6XY` |
| `100006` | Fatima Rahman | £700.00 | **Locked Account**: Locked after 3 failed portal verification attempts; requires Rep phone verification to unlock. | `demo123` | `1975-02-08` / `G12 8QQ` |
| `100007` | Oliver Grant | £0.00 | **Reversal & Customer Edit**: Paid in full; earlier duplicate payment reversed by Team Leader; customer updated phone in portal. | `demo123` | `1969-12-17` / `CF10 2EP` |
| `100008` | Sophie Walker | £450.00 | **Contact Limit & Unfulfilled Flag**: Prior promise failed (£90 shortfall flag); 3 contacts in last 7 days (triggers contact limit override prompt). Opted out of reminders. | `demo123` | `1983-06-26` / `SE15 4RT` |
| `100009` | Callum Murray | £400.00 | **Team B & Channel Preferences**: Assigned to Team B (Lee Chen); prefers SMS between 09:00 and 12:00. Part-paid earlier promise. | `demo123` | `1994-10-03` / `EH6 5JD` |

---

## 3. Comprehensive User Story Demonstration Guide

Each of the 53 user stories from `docs/user-stories-report.md` is mapped below, describing where it is located, how to demonstrate it, and how each acceptance criterion (AC) is verified.

```
========================================================================================
EPIC 1: CENTRALISED CUSTOMER DETAIL STORAGE (US-01 to US-07)
========================================================================================
```

### US-01: Migrate legacy customer data
- **Stakeholder**: IT Team Member | **Priority**: Very High
- **Screen Location**: `reports.html?r=migration-exceptions` (IT role -> Reports -> Migration exceptions)
- **How to Demo**:
  1. Switch role to **IT**.
  2. Navigate to **Reports -> Migration exceptions**.
  3. View the migration summary: 10,000 legacy records, 9,850 migrated successfully, 150 exception records.
  4. Review the breakdown: Unmigrated records (missing required core fields), Duplicates merged, Duplicates flagged for manual review, and Type mismatches.
  5. Scroll to the **Data type consistency** panel where `Services.validateSchema()` checks all active records against the database schema.
- **Acceptance Criteria Verification**:
  - *All legacy customer records migrated or in exception report*: Demonstrated via summary stats and exception table.
  - *Duplicate customer records merged or flagged*: Explicitly categorised in the report tabs.
  - *Data types match across all records*: Real-time schema validation report validates 100% of customer fields with zero type errors.

### US-02: Secure and back up the central database
- **Stakeholder**: IT Team Member | **Priority**: Very High
- **Screen Location**: `reports.html?r=security-status` (IT role -> Reports -> Security status)
- **How to Demo**:
  1. In **IT** role, open **Security status**.
  2. Review the **Role access tests (RBAC)** matrix testing 6 roles across 18 pages.
  3. View the simulated **Encryption at rest** (AES-256) and **Encryption in transit** (TLS 1.3) certification badges.
  4. View the **Automated backup evidence**: Daily frequency, automated backup logs, and successful test restore completed in 2.5 hours (meeting the 4-hour Recovery Time Objective).
  5. Review the **Unauthorised access attempts log** showing blocked attempts (e.g. rep accessing leader approvals).
- **Acceptance Criteria Verification**:
  - *Role-based access verified by tests*: Matrix displays passing access checks for all roles.
  - *Data encrypted at rest and in transit*: Status panel displays verified encryption standards.
  - *Backup frequency and test restore within RTO*: Daily schedule and 2.5 hr restore recorded against 4.0 hr RTO.
  - *Unauthorised access attempts logged*: Append-only log lists denied requests with user, role, page, and timestamp.

### US-03: View a single customer record
- **Stakeholder**: Collections Representative | **Priority**: Very High
- **Screen Location**: `staff-search.html` and `staff-record.html?acct=100001` (Rep role)
- **How to Demo**:
  1. Switch role to **Collections rep**.
  2. On `staff-search.html`, observe the clean, focused search interface (the former "One record, no second system" notice and demo accounts list have been removed).
  3. Enter account `100001` and submit.
  4. The record opens in one step (open time tracked and displayed against target).
  5. On `staff-record.html`, observe that the redundant notice ("Everything needed for a standard case is on this record...") has been removed, providing a streamlined operational workspace.
  6. Perform phone verification of the caller (DOB: `1988-04-12`, Postcode: `M14 5QT`) to unlock account details.
  7. View contact details, balance (£420.00), case history, and open follow-ups on one unified screen.
- **Acceptance Criteria Verification**:
  - *Opens within target time by account number*: Instant single-step transition; displays measured open time.
  - *Shows contact details, balance, history, and open follow-ups*: All present on the single record layout.
  - *Role-based field restrictions*: Reps see "Restricted for your role" for internal notes and ledger references (visible only to Team Leaders).
  - *No second system needed*: Payments, interactions, promises, and contact details all managed on this page.

### US-04: Audit trail of record changes
- **Stakeholder**: Compliance Liaison | **Priority**: High
- **Screen Location**: `reports.html?r=audit-trail` (Compliance role -> Reports -> Audit trail)
- **How to Demo**:
  1. Switch role to **Compliance**.
  2. Navigate to **Reports -> Audit trail**.
  3. Filter by Customer (`100001`), User, Entity, Channel, or Date Range.
  4. Examine entries: each row records timestamp, user/actor, channel, entity type, entity ID, action, and JSON before/after snapshots.
  5. Confirm there are no edit or delete controls (immutable log).
- **Acceptance Criteria Verification**:
  - *Logs create, update, delete with who, what, when, before/after*: Evidenced across every record mutation.
  - *Audit entries cannot be edited/deleted*: Table is strictly read-only with no modification interfaces.
  - *Searchable/filterable by customer, user, date range*: Complete filter bar provided.
  - *Retained for required period*: Retention setting displayed (7 years).

### US-05: Review account history for complex cases
- **Stakeholder**: Collections Team Leader | **Priority**: Medium
- **Screen Location**: `staff-record.html?acct=100001` -> **History** tab (Team Leader role)
- **How to Demo**:
  1. Switch role to **Team leader**.
  2. Open account `100001` and verify caller or unlock.
  3. Click the **History** tab.
  4. View chronological event history spanning payments, phone interactions, promises, reminders, and reversals.
  5. Filter history by event type (e.g. "Payment", "Contact", "Reminder") or date range.
- **Acceptance Criteria Verification**:
  - *All events in date order*: Listed newest to oldest with timestamps.
  - *Loads within target time*: Instant render from local snapshot.
  - *Filterable by event type and date range*: Dropdown filters update the event list dynamically.

### US-06: Query data for financial reporting
- **Stakeholder**: Financial Partner | **Priority**: High
- **Screen Location**: `reports.html?r=balances-arrears` (Finance role)
- **How to Demo**:
  1. Switch role to **Finance**.
  2. Open **Balances and arrears** report.
  3. Review balances, collected totals, and overdue arrears across all accounts.
  4. Observe the live **Match line**: "Report balance total £X = source ledger total £X."
  5. Confirm report runs independently without impacting operational staff pages.
- **Acceptance Criteria Verification**:
  - *Standard reports run on demand*: Generated instantly upon opening or changing filters.
  - *Totals match source ledger*: Explicit match line proves mathematical parity with the ledger.
  - *Does not affect rep system performance*: Operates on read-only data snapshots.
  - *Restricted to Financial Partner*: Blocked for Customer and Rep roles.

### US-07: Provide details only once
- **Stakeholder**: Customer | **Priority**: Low
- **Screen Location**: `portal-details.html` (Customer) -> `staff-record.html` (Rep)
- **How to Demo**:
  1. In **Customer** role (verified as `100001`), navigate to **Update my details** (`portal-details.html`).
  2. Update phone number to `07700900999` and submit.
  3. Switch role to **Collections rep** and open account `100001`.
  4. Observe the banner: "Customer-made change: phone number updated" with the new number visible immediately to any rep without re-asking.
- **Acceptance Criteria Verification**:
  - *Any rep sees details at start of contact*: Instantly rendered on customer record.
  - *Reps not required to re-ask*: Updated details immediately reflected across staff views.
  - *Corrections visible immediately*: Zero synchronization delay.

```
========================================================================================
EPIC 2: STANDARDISED DIGITAL RECORD LOGGING (US-08 to US-11)
========================================================================================
```

### US-08: Log case interactions with a standard form
- **Stakeholder**: Collections Representative | **Priority**: Very High
- **Screen Location**: `staff-log.html?acct=100001` (Rep role)
- **How to Demo**:
  1. In **Rep** role, open account `100001` and click **Log an interaction**.
  2. Observe standard fields: Contact date, Contact method (Phone, Email, SMS, Letter), Outcome code (PTP, NA, CB, DISP, PAID, REFUSED, WRONG, HARD), Next action, and Notes.
  3. Try submitting empty form: mandatory field validation blocks submission.
  4. Select outcome `CB` (Call back requested), select Next action `Call back`, and submit.
  5. The log saves instantly, creates an audit record, and links directly to the customer's history.
- **Acceptance Criteria Verification**:
  - *Captures standard fields*: Date, method, outcome code, promise details (if PTP), and next action.
  - *Mandatory field enforcement*: Inline validation flags missing inputs.
  - *Fixed outcome code list*: Dropdown populated from pre-configured outcome list.
  - *Saves within target and links to customer*: Timed submission immediately reflected in customer history.

### US-09: Review team logs
- **Stakeholder**: Collections Team Leader | **Priority**: Medium
- **Screen Location**: `reports.html?r=team-logs` (Team Leader role)
- **How to Demo**:
  1. Switch role to **Team leader** (Priya Nair, Team A).
  2. Navigate to **Reports -> Team interaction logs**.
  3. View logs for Team A reps (Sam Patel, Jo Okafor). Team B logs (Lee Chen) are excluded.
  4. Filter by Rep, Outcome Code, and Date Range.
- **Acceptance Criteria Verification**:
  - *Filtered by rep, outcome, date range*: Complete filter set provided.
  - *Results return within target time*: Instant execution on team dataset.
  - *Team leaders see only their own team*: Team scoping strictly isolates Team A data from Team B.

### US-10: Export logs for audits
- **Stakeholder**: Compliance Liaison | **Priority**: High
- **Screen Location**: `reports.html?r=log-export` (Compliance role)
- **How to Demo**:
  1. In **Compliance** role, open **Interaction log export**.
  2. Filter by Customer (`100001`) or date range.
  3. Click **"Export CSV"** to download a sanitised CSV containing all form fields and audit trail references.
  4. Click **"Printable report"** for auditor review view.
- **Acceptance Criteria Verification**:
  - *Exports to CSV/printable format filtered by customer/date*: Dual export buttons provided.
  - *Includes all form fields and audit trail join*: Joins log record with corresponding audit entry.
  - *Export completes within target time*: Browser-generated export completes in under 1 second.

### US-11: Report on contact outcomes
- **Stakeholder**: Financial Partner | **Priority**: Medium
- **Screen Location**: `reports.html?r=outcomes` (Finance role)
- **How to Demo**:
  1. In **Finance** role, open **Outcome codes** report.
  2. View aggregated table listing discrete outcome codes (PTP, CB, NA, etc.).
  3. Observe columns: Outcome code, Description, Case count, Percentage of cases, Total debt value, and Collected amount.
  4. Match line reconciles outcome case counts to the total logged interactions.
- **Acceptance Criteria Verification**:
  - *Outcome codes stored as discrete values*: Aggregates on fixed code dictionary.
  - *Shows count and value by outcome code*: Displayed with percentages and currency totals.
  - *Totals reconcile to logged cases*: Live match line verifies reconciliation.

```
========================================================================================
EPIC 3: SELF-SERVICE PAYMENTS (US-12 to US-18)
========================================================================================
```

### US-12: Pay an outstanding balance online
- **Stakeholder**: Customer | **Priority**: Very High
- **Screen Location**: `portal-pay.html` (Customer role, verified as `100001`)
- **How to Demo**:
  1. In **Customer** role, verify as `100001` and navigate to **Make a payment**.
  2. Choose "Pay the full balance (£420.00)" or "Pay a different amount" (e.g. £50.00).
  3. Card entry panel is displayed (simulated provider hosted form).
  4. Submit payment with simulation set to "Approve".
  5. Balance drops immediately to £370.00; payment logged on account. No card details stored.
- **Acceptance Criteria Verification**:
  - *Pay full or partial amount*: Radio selector allows full or custom partial amount.
  - *Amount cannot exceed outstanding balance*: Validated client- and server-side.
  - *Successful payment updates balance immediately*: Instant balance reduction.
  - *Card details never stored*: Scrubbed via regex; DLP scanner verifies zero card numbers saved.

### US-13: Receive payment confirmation
- **Stakeholder**: Customer | **Priority**: Medium
- **Screen Location**: `portal-pay.html` (Confirmation view) & `outbox.html` (Customer and IT roles only)
- **How to Demo**:
  1. Complete successful payment on `portal-pay.html`.
  2. On-screen confirmation panel appears displaying amount, date, reference (`PR-100014`), and updated balance.
  3. Click "See it in My messages" to open `outbox.html` (accessible only to Customer and IT roles; Rep and Team Leader roles have no access).
  4. On `outbox.html`, observe that the notice cleanly states "These are the messages we have sent to you." (the notice no longer contains disclaimer wording such as "Nothing is really sent in this prototype" or "nothing is really sent to you").
  5. Review email notification (`TPL-3`: Payment confirmation) matching payment reference and amount.
- **Acceptance Criteria Verification**:
  - *Confirmation page shows amount, date, reference*: Rendered in primary status panel.
  - *Confirmation email sent immediately*: Dispatched to simulated outbox in real time.
  - *Matches amount recorded on account*: Verified against payment ledger entry.
  - *Strict role segregation*: Outbox access is strictly limited to Customer and IT roles.

### US-14: Recover from a failed payment
- **Stakeholder**: Customer | **Priority**: Very High
- **Screen Location**: `portal-pay.html` (Customer role)
- **How to Demo**:
  1. On `portal-pay.html`, set "Demo: simulate provider result" to **Decline** or **Timeout (not charged)**.
  2. Submit payment.
  3. Screen displays clear failure banner stating reason category (e.g. "Card declined" or "Provider timeout").
  4. Notice explains safe retry reuses the identical `idempotencyKey` preventing double charges.
  5. Failed attempt is recorded in account history. Rep contact route (`0800 000 000`) is displayed.
  6. Change simulation to "Approve" and click **Retry payment**: payment succeeds without creating a duplicate record.
- **Acceptance Criteria Verification**:
  - *States reason category*: Explicitly categorised (Decline vs Timeout).
  - *Retry does not create duplicate charge*: Idempotent token guarantees single ledger charge.
  - *Failed attempt recorded on account*: Preserved in payments table and audit trail.
  - *Shown rep contact route*: Direct contact telephone and link displayed.

### US-15: Log portal payments automatically
- **Stakeholder**: Collections Representative | **Priority**: High
- **Screen Location**: `staff-record.html?acct=100001` -> **History** tab (Rep role)
- **How to Demo**:
  1. Make a portal payment as Customer `100001`.
  2. Switch role to **Collections rep** and open account `100001`.
  3. Open the **History** tab: the portal payment appears immediately with amount, reference, channel `portal`, and timestamp.
  4. Rep made zero manual entries.
- **Acceptance Criteria Verification**:
  - *Appears in case log immediately*: Instant update.
  - *Includes amount, date, reference, channel*: All metadata present in table.
  - *No manual entry needed*: Wholly automated via service event bus.

### US-16: Reconcile portal payments
- **Stakeholder**: Financial Partner | **Priority**: High
- **Screen Location**: `reports.html?r=reconciliation` (Finance role)
- **How to Demo**:
  1. Switch role to **Finance** and open **Payment reconciliation**.
  2. Table compares internal system payments against provider settlement files (`SET-1` to `SET-11`).
  3. Observe categorized statuses: "Matched", "Unmatched settlement" (provider settlement without internal record), and "Unmatched payment".
  4. Filter report to isolate unmatched items.
- **Acceptance Criteria Verification**:
  - *Lists system payments vs provider settlements*: Side-by-side reconciliation table.
  - *Unmatched items listed separately*: Filterable status flags unmatched transactions.

### US-17: Secure and log payment transactions
- **Stakeholder**: Compliance Liaison | **Priority**: High
- **Screen Location**: `reports.html?r=payment-audit` (Compliance role)
- **How to Demo**:
  1. Switch role to **Compliance** and open **Payment audit**.
  2. View all card transactions across portal and staff channels.
  3. Each record displays customer, amount, timestamp, result, channel, provider token, and idempotency key.
  4. Scroll to **Data protection scan (PCI DSS)** panel: runs automated DLP scan verifying no PAN or CVV exists in database.
- **Acceptance Criteria Verification**:
  - *Card data handled only by provider*: System stores only opaque provider token.
  - *Audit entry with customer, amount, time, result*: Every transaction logged in immutable audit store.
  - *Compliance scan confirms zero card data stored*: Real-time scan displays 0 card runs found.

### US-18: Reverse an erroneous payment
- **Stakeholder**: Collections Team Leader | **Priority**: Medium
- **Screen Location**: `staff-approvals.html` (Team Leader role)
- **How to Demo**:
  1. Switch role to **Team leader** (Priya Nair).
  2. Open **Reversal approvals** (`staff-approvals.html`).
  3. Search for a successful payment (e.g. Account `100007` or `100001`) and click **Select**.
  4. Select a mandatory reason code (`DUPLICATE`, `ERROR`, `CHARGEBACK`, `REFUND`).
  5. Click **Approve reversal**: customer balance is restored, payment status changes to `reversed`, reversal audit entry created, and automated reversal notice (`TPL-8`) dispatched to customer outbox.
- **Acceptance Criteria Verification**:
  - *Only team leaders can approve reversals*: Role-guarded; reps denied access.
  - *Requires reason code and logged on account*: Mandatory dropdown; logged to customer history.
  - *Balance corrected immediately*: Balance increased by reversed amount in real time.
  - *Customer notified of reversal*: Outbox message dispatched to customer.

```
========================================================================================
EPIC 4: AUTOMATED IDENTITY VERIFICATION (US-19 to US-23)
========================================================================================
```

### US-19: Verify identity to access the portal
- **Stakeholder**: Customer | **Priority**: Very High
- **Screen Location**: `portal-verify.html` (Customer role)
- **How to Demo**:
  1. In **Customer** role (unverified), try navigating directly to `portal-account.html` or `portal-pay.html`.
  2. System enforces verification gate and redirects to `portal-verify.html`.
  3. Enter Account `100001` and Password `demo123`.
  4. Observe that the access page (`portal-verify.html`) contains no link to `demo.html` under the "Verify and continue" button, maintaining a realistic authentication form.
  5. Submit form: instantly verified and redirected to `portal-account.html`.
- **Acceptance Criteria Verification**:
  - *Account actions require verification*: Role guard blocks access until verified.
  - *Verification completes quickly*: Instant evaluation on submit.
  - *Unverified users cannot view/change account data*: Gated at layout and service layers.
  - *Dedicated credentials*: Uses account number and password (while date of birth and postcode remain reserved for staff phone verification of callers).

### US-20: Use an alternative route when verification fails
- **Stakeholder**: Customer | **Priority**: Very High
- **Screen Location**: `portal-verify.html` (Customer role)
- **How to Demo**:
  1. On `portal-verify.html`, enter Account `100001` with an incorrect password (e.g. `wrongpass`).
  2. System displays generic error: "We could not verify you with the details entered."
  3. Does not reveal whether password or account number was incorrect, nor whether the account exists or is locked.
  4. Rep contact panel is displayed immediately below with telephone `0800 000 000` and opening hours.
- **Acceptance Criteria Verification**:
  - *Failed verification shows rep contact route*: Direct phone support prominently offered.
  - *Failure message does not reveal incorrect field*: Single generic message used.
  - *Customer not locked out of rep contact*: Rep channel always available.

### US-21: Verify customers over the phone
- **Stakeholder**: Collections Representative | **Priority**: Very High
- **Screen Location**: `staff-record.html?acct=100001` (Rep role)
- **How to Demo**:
  1. Switch role to **Collections rep** and open account `100001`.
  2. Notice the customer record is locked behind an amber gate: "Account details are locked. Verify the caller below before discussing this account."
  3. Rep enters caller's DOB (`1988-04-12`) and Postcode (`M14 5QT`) in the phone verification panel.
  4. Click **Verify caller**: system returns "Verified" immediately, unlocks the tabs, and logs the attempt.
  5. If wrong details entered, returns "Not verified" without leaking which detail was wrong.
- **Acceptance Criteria Verification**:
  - *Rep enters details from record screen*: Dedicated verification form on record header.
  - *Returns Verified / Not verified immediately*: Instant on-screen badge.
  - *Account details hidden until Verified*: Summary, history, and balances masked until passed.
  - *Does not reveal incorrect field*: Generic result only.
  - *Logged with rep ID, customer, time, outcome*: Recorded in `verifications` table and audit trail.

### US-22: Record every verification attempt
- **Stakeholder**: Compliance Liaison | **Priority**: High
- **Screen Location**: `reports.html?r=verification-log` (Compliance role)
- **How to Demo**:
  1. In **Compliance** role, open **Verification log**.
  2. Table lists all verification attempts across both portal and phone channels.
  3. Each entry shows: Timestamp, Account number, Customer ID, Method (portal/phone), Actor ID (Rep ID or portal), and Outcome (Verified, Not verified, Locked).
  4. Raw verification secrets (customer portal passwords, caller DOB and Postcode) are excluded from the log.
- **Acceptance Criteria Verification**:
  - *Logs customer, time, method, outcome*: All metadata fields captured.
  - *Contains no full verification secrets*: Answers and passwords scrubbed before logging.
  - *Searchable by customer and date*: Complete filter bar provided.

### US-23: Lock out repeated failed attempts
- **Stakeholder**: IT Team Member | **Priority**: High
- **Screen Location**: `portal-verify.html`, `staff-record.html`, and `reports.html?r=lockouts-alerts`
- **How to Demo**:
  1. On `portal-verify.html`, enter Account `100001` and submit wrong password 3 consecutive times.
  2. On 3rd attempt, account locks (`locked: true`). Portal continues showing generic error (no lock reveal).
  3. Switch to **IT** role -> **Lockouts and alerts**: view new alert (`ALT-3`) indicating account locked.
  4. Switch to **Rep** role and open account `100001`: red banner indicates "Account locked".
  5. Rep verifies caller by phone with correct credentials (DOB and Postcode), then clicks **Unlock account**.
- **Acceptance Criteria Verification**:
  - *Locked after N consecutive failed attempts*: Enforced at threshold of 3 attempts.
  - *Only rep/leader can unlock after manual verification*: Unlock button disabled until phone verification passes.
  - *Alert raised on unusual activity / lockouts*: Alerts generated and displayed in IT dashboard.

```
========================================================================================
EPIC 5: AUTOMATED PAYMENT FULFILLMENT CHECK (US-24 to US-29)
========================================================================================
```

### US-24: Check promised payments automatically
- **Stakeholder**: Collections Representative | **Priority**: High
- **Screen Location**: `jobs.html` (IT role)
- **How to Demo**:
  1. Switch role to **IT** and navigate to **Scheduled jobs** (`jobs.html`).
  2. Observe pending promises due today: Account `100002` (£150 paid), `100003` (£80 paid of £200), `100004` (£0 paid of £120).
  3. Click **Run fulfilment check now**.
  4. Check completes in batch:
     - `100002`: Fulfilled (£150 received).
     - `100003`: Partially fulfilled (£80 received, £120 shortfall).
     - `100004`: Not fulfilled (£0 received, £120 shortfall).
  5. Fulfilment logs and audit records are written automatically.
- **Acceptance Criteria Verification**:
  - *Checks promised payments on due date*: Evaluates active promises where due date <= today.
  - *Sets Fulfilled, Partially fulfilled, Not fulfilled*: Accurately categorises all 3 outcomes.
  - *Written to case log automatically*: System-channel log entries generated.
  - *Completes for all due promises*: Batch process covers all pending promises.

### US-25: Flag unfulfilled promises on the account
- **Stakeholder**: Collections Representative | **Priority**: High
- **Screen Location**: `staff-record.html?acct=100004` (Rep role)
- **How to Demo**:
  1. After running the fulfilment check, switch to **Rep** role and open account `100004`.
  2. A prominent red banner appears at top of record: "Unfulfilled promise to pay: Promised £120.00 due today. Outstanding shortfall £120.00."
  3. Make a payment of £120.00 as customer or staff: banner clears automatically (`flagClearedAt`).
- **Acceptance Criteria Verification**:
  - *Not fulfilled result flags account*: High-visibility banner on record.
  - *Shows promised amount, due date, shortfall*: All 3 metrics displayed in banner.
  - *Flag clears automatically once payment received*: Dynamic recalculation clears banner upon payment.

### US-26: Report of unfulfilled promises
- **Stakeholder**: Collections Team Leader | **Priority**: Medium
- **Screen Location**: `reports.html?r=unfulfilled-promises` (Team Leader role)
- **How to Demo**:
  1. Switch role to **Team leader** (Priya Nair).
  2. Open **Unfulfilled promises** report.
  3. Table lists all unfulfilled and partially fulfilled promises for Team A accounts.
  4. Displays Customer, Account, Due date, Promised amount, Received amount, Shortfall, and Days overdue.
- **Acceptance Criteria Verification**:
  - *Regular list available to team leaders*: On-demand reporting dashboard.
  - *Lists customer, amount, due date, days overdue*: Comprehensive breakdown table.

### US-27: Report on failed payment value
- **Stakeholder**: Financial Partner | **Priority**: Very Low
- **Screen Location**: `reports.html?r=fulfilment-value` (Finance role)
- **How to Demo**:
  1. In **Finance** role, open **Promise fulfilment value** report.
  2. Review breakdown cards: Total promised value, Fulfilled value (recovered revenue), Partially fulfilled value, and Not fulfilled shortfall.
  3. Reconciles totals to underlying promises.
- **Acceptance Criteria Verification**:
  - *Shows count and value per fulfilment result*: Matrix of count, promised value, and received value.
  - *Reconciles to underlying payments*: Mathematical parity confirmed.

### US-28: Be told about a missing payment
- **Stakeholder**: Customer | **Priority**: Medium
- **Screen Location**: `outbox.html` and `portal-account.html` (Customer role, Account `100004`)
- **How to Demo**:
  1. After fulfilment check marks `100004` Not fulfilled, switch to **Customer** role (verified as `100004`).
  2. Open `outbox.html`: view email notification (`TPL-4`: Missing payment) stating expected amount (£120.00), due date, and rep contact.
  3. Open `portal-account.html`: notice the panel "Is a payment missing? Raise a query".
  4. Submit a query: places a delinquency hold on the account, pausing collection activity while staff review.
- **Acceptance Criteria Verification**:
  - *Notification sent upon Not fulfilled result*: Automated outbox dispatch.
  - *States expected amount, date, rep contact*: Template populates all placeholders.
  - *Customer can raise query suspending delinquency*: On-page query form sets `delinquencyHold`.

### US-29: Monitor and retry the check
- **Stakeholder**: IT Team Member | **Priority**: Low
- **Screen Location**: `jobs.html` (IT role)
- **How to Demo**:
  1. In **IT** role on `jobs.html`, locate the **Fulfilment check (promises to pay)** panel.
  2. To demo automatic retry on failure: select "Fail once, then succeed on the automatic retry" and click **Run fulfilment check**. Observe Attempt 1 logs status `retried` (Data source timeout) and Attempt 2 succeeds.
  3. To demo retries running out: select "Fail every attempt" and click **Run fulfilment check**. Observe the run fails after all retries and raises an IT alert.
  4. To demo deadline breach monitoring: select **"Simulate past deadline (07:00, triggers missed-deadline alert)"** and click **Run fulfilment check**.
  5. Observe the high-severity alert (`job-deadline-missed`) generated immediately in the Job alerts panel, notifying on-call IT that the run exceeded the 07:00 cutoff.
- **Acceptance Criteria Verification**:
  - *Logs start, end, records processed*: Detailed attempt-level audit table.
  - *Automatic retries up to N times*: Retries up to configured retry limit (2 retries).
  - *Alert sent if job fails by deadline*: High-severity alert generated on exhausted retries or when run passes the 07:00 deadline cutoff.

```
========================================================================================
EPIC 6: AUTOMATED FOLLOW UP SCHEDULING (US-30 to US-34)
========================================================================================
```

### US-30: Schedule follow-ups automatically
- **Stakeholder**: Collections Representative | **Priority**: High
- **Screen Location**: `staff-log.html?acct=100001` (Rep role)
- **How to Demo**:
  1. In **Rep** role, log an interaction on account `100001`.
  2. Select Outcome code `CB` (Call back requested).
  3. Notice follow-up preview updates automatically: Default interval is +1 day; Owner defaults to current Rep.
  4. Change date to +5 days: system displays mandatory field: "Override reason (follow-up date)".
  5. Enter reason and save: follow-up is created and linked to log.
- **Acceptance Criteria Verification**:
  - *Saving log creates follow-up with date and owner*: Automatically populated.
  - *Default intervals set per outcome code*: Code dictionary defines specific lead times.
  - *Rep can override date with reason logged*: Conditional override reason enforced.

### US-31: See today's follow-ups
- **Stakeholder**: Collections Representative | **Priority**: High
- **Screen Location**: `staff-followups.html` (Rep role, Sam Patel)
- **How to Demo**:
  1. In **Rep** role, open **Follow-ups** (`staff-followups.html`).
  2. Review "Due today and overdue" table, ordered chronologically.
  3. Each row links to customer record and displays customer, due date/time, channel, and outcome.
  4. Click **Complete** on any item: follow-up status changes to `Done` and disappears from active list.
- **Acceptance Criteria Verification**:
  - *Shows follow-ups due today and overdue*: Chronologically sorted work queue.
  - *Each item links to customer record*: Direct navigation links provided.
  - *Completing removes item from list*: Real-time removal and audit logging.

### US-32: Monitor overdue follow-ups
- **Stakeholder**: Collections Team Leader | **Priority**: Low
- **Screen Location**: `staff-followups.html` (Team Leader role, Priya Nair)
- **How to Demo**:
  1. Switch role to **Team leader**.
  2. Open **Follow-ups** (`staff-followups.html`).
  3. View team overview: lists all overdue follow-ups across Team A reps.
  4. Click **Reassign** on any follow-up, select a new rep (e.g. Jo Okafor), and confirm.
  5. Follow-up ownership transfers immediately, and reassignment is logged in case history.
- **Acceptance Criteria Verification**:
  - *Lists rep, customer, days overdue*: Comprehensive team table.
  - *Team leader can reassign follow-up*: Interactive modal reassigns owner.
  - *Reassignment is logged*: Log entry and audit record generated.

### US-33: Limit and evidence contact frequency
- **Stakeholder**: Compliance Liaison | **Priority**: Medium
- **Screen Location**: `staff-log.html`, `compliance-settings.html`, and `reports.html?r=followup-history`
- **How to Demo**:
  1. Switch role to **Collections rep** and open account `100008` (Sophie Walker).
  2. Click **Log an interaction**: notice yellow warning box: "Contact limit reached. This customer has had 3 contacts in the last 7 days (limit 3)."
  3. An "Override reason (contact limit)" textarea appears and is mandatory. Form cannot save without it.
  4. Switch to **Compliance** role -> **Follow-up history**: export full customer contact timeline.
- **Acceptance Criteria Verification**:
  - *Warns when scheduling exceeds limit*: Evaluates 7-day rolling window in real time.
  - *Cannot exceed without logged override reason*: Mandatory validation blocks submission.
  - *Full history exportable per customer*: Dedicated compliance export view.

### US-34: Be contacted at a preferred time
- **Stakeholder**: Customer | **Priority**: Low
- **Screen Location**: `staff-record.html?acct=100009` (Preferences tab) & `staff-log.html`
- **How to Demo**:
  1. In **Rep** role, open account `100009` and inspect **Preferences** tab: Customer prefers SMS between 09:00 and 12:00.
  2. Click **Log an interaction**: follow-up time defaults to `09:00` and channel to `SMS`.
  3. If rep changes time to `16:00` (outside window), system enforces mandatory override reason.
- **Acceptance Criteria Verification**:
  - *Preferred time/channel recorded on record*: Displayed in preferences tab.
  - *Follow-ups default to recorded preference*: Pre-populates form controls.
  - *Outside preferred window requires logged override*: Field-level validation check.

```
========================================================================================
EPIC 7: SELF-SERVICE PROMISE TO PAY (US-35 to US-39)
========================================================================================
```

### US-35: Submit a promise to pay
- **Stakeholder**: Customer | **Priority**: High
- **Screen Location**: `portal-promise.html` (Customer role, Account `100001`)
- **How to Demo**:
  1. In **Customer** role, verify as `100001` and navigate to **Promise to pay**.
  2. Permitted plans are presented: Full balance (£420.00), 50% (£210.00), 25% (£105.00).
  3. Date picker restricts dates strictly within allowable window (1 to 14 days from today).
  4. Submit promise: saves to account, superseding any prior promise (maximum 1 active promise).
- **Acceptance Criteria Verification**:
  - *Select amount and date within permitted window*: Standard plan radio buttons and bound date picker.
  - *Dates outside window cannot be selected*: Constrained by `min`/`max` and validated on server.
  - *Saved to account on submission*: Real-time persistence.
  - *Max 1 active promise per account*: Automatically supersedes existing active promise.

### US-36: Confirm the promise
- **Stakeholder**: Customer | **Priority**: Medium
- **Screen Location**: `portal-promise.html` (Confirmation view) & `outbox.html`
- **How to Demo**:
  1. Submit promise on `portal-promise.html`.
  2. Confirmation panel appears showing amount, pay-by date, and reference (`PRMREF-...`).
  3. Open `outbox.html` to view promise confirmation message (`TPL-9`).
  4. Open `portal-account.html` to confirm active promise is clearly displayed.
- **Acceptance Criteria Verification**:
  - *Confirmation page shows amount, date, reference*: Clear status panel.
  - *Confirmation email sent immediately*: Dispatched to simulated outbox.
  - *View active promise in portal*: Highlighted in dedicated card on account summary.

### US-37: Record promises automatically
- **Stakeholder**: Collections Representative | **Priority**: High
- **Screen Location**: `staff-record.html?acct=100001` (Rep role)
- **How to Demo**:
  1. Make a promise as Customer `100001` due in 10 days.
  2. Switch to **Rep** role and open account `100001`.
  3. History tab shows new promise log entry.
  4. Open **Follow-ups** tab: any open follow-ups are now flagged **"Paused until [promise date]"**.
  5. Follow-ups automatically resume if promise check evaluates to Not fulfilled.
- **Acceptance Criteria Verification**:
  - *Promise appears in case log immediately*: Instant log creation.
  - *Scheduled follow-ups paused until promise due date*: Status updated to `Paused`.
  - *Follow-ups resume if unfulfilled*: Automated resumption during fulfilment job.

### US-38: Forecast cash from promises
- **Stakeholder**: Financial Partner | **Priority**: Very Low
- **Screen Location**: `reports.html?r=promise-forecast` (Finance role)
- **How to Demo**:
  1. Switch role to **Finance** and open **Promise forecast**.
  2. Filter by date range (e.g. Next 14 days, Next 30 days).
  3. View expected cash inflows broken down by due date.
  4. Review comparison table contrasting past promises made vs actual cash collected.
- **Acceptance Criteria Verification**:
  - *Total promised amount over chosen period*: Interactive date range filter.
  - *Compares promised vs received*: Variance and fulfilment rate metrics.
  - *Refreshed on demand*: Live calculations on current dataset.

### US-39: Evidence promises for audit
- **Stakeholder**: Compliance Liaison | **Priority**: High
- **Screen Location**: `reports.html?r=audit-trail` -> Promise Export (Compliance role)
- **How to Demo**:
  1. In **Compliance** role, open **Audit trail** and filter by entity `promise`.
  2. Review entries: each row records customer ID, verified identity result, timestamp, amount, and due date.
  3. Confirm promises cannot be edited (only superseded).
  4. Click **Export promises CSV** to export complete history with linked audit trails.
- **Acceptance Criteria Verification**:
  - *Stores customer, verification result, timestamp, amount, date*: Full audit row.
  - *Cannot be edited, only superseded*: Enforced in business logic.
  - *Exportable with audit trail*: Complete CSV export available.

```
========================================================================================
EPIC 8: SELF-SERVICE ACCOUNT INFORMATION (US-40 to US-42)
========================================================================================
```

### US-40: Provide a read-only data interface for the portal
- **Stakeholder**: IT Team Member | **Priority**: Medium
- **Screen Location**: `api-demo.html` (IT role -> Admin -> Read-only data interface)
- **How to Demo**:
  1. Switch role to **IT** and open `api-demo.html`.
  2. Select Customer session `100001` and click **GET own record** (`/api/me/account`): Returns `200 OK` with customer data.
  3. Click **GET another customer's record** (`/api/customers/C-1002`): Returns `403 Forbidden` and writes an access denial event to audit trail.
  4. Select write method `PUT` and click **Send write attempt**: Returns `405 Method Not Allowed`.
- **Acceptance Criteria Verification**:
  - *Exposes read-only access to customer's own data*: `GET` endpoints return own data.
  - *Requests for another customer rejected and logged*: `403 Forbidden` and audited.
  - *Write operations return error*: `405 Method Not Allowed` returned.

### US-41: View account information
- **Stakeholder**: Customer | **Priority**: Medium
- **Screen Location**: `portal-account.html` (Customer role, Account `100001`)
- **How to Demo**:
  1. Verify identity as Customer `100001` and open `portal-account.html`.
  2. Page displays: Current balance (£420.00), Due date (+3 days), Payment history table with status/references, and Active promise panel.
  3. Fast load time confirmed. Data matches central customer database exactly.
- **Acceptance Criteria Verification**:
  - *Shows balance, due date, payments, active promise*: All modules rendered.
  - *Matches central record*: Reads directly via customer service layer.
  - *Loads quickly*: Instant client-side render.
  - *Only verified customer can view*: Gated behind `portal-verify.html`.

### US-42: Verify displayed information and log access
- **Stakeholder**: Compliance Liaison | **Priority**: Very Low
- **Screen Location**: `reports.html?r=display-sampling` (Compliance role)
- **How to Demo**:
  1. Switch role to **Compliance** and open **Display sampling check**.
  2. Table lists logged customer account views (`accountViews`), recording what was rendered vs what was in source database.
  3. Discrepancy detection: Account `100003` has a seeded display mismatch (shows £640.00 displayed vs £560.00 database source).
  4. System flags the discrepancy in amber, providing audit proof for investigations.
- **Acceptance Criteria Verification**:
  - *Logs customer ID and time on each view*: Append-only view logging.
  - *Sample check confirms displayed matches database*: Automated diff comparison.
  - *Discrepancies reported for correction*: Visual mismatch warning flags discrepancy.

```
========================================================================================
EPIC 9: SELF-SERVICE UPDATING DETAILS (US-43 to US-47)
========================================================================================
```

### US-43: Validate customer detail inputs
- **Stakeholder**: IT Team Member | **Priority**: Low
- **Screen Location**: `portal-details.html` (Customer) & `staff-record.html` (Rep)
- **How to Demo**:
  1. On `portal-details.html`, enter an invalid email (`alex.invalid`), invalid phone (`1234`), or invalid postcode (`INVALID`).
  2. Submit form: shared validation engine (`Validate.contact`) rejects inputs with field-level inline error messages.
  3. Identical validation rules apply when Rep edits contact details.
- **Acceptance Criteria Verification**:
  - *Email, phone, postcode formats validated*: Strict regex pattern matching.
  - *Invalid inputs rejected with field-level message*: Targeted error indicators.
  - *Applied to both portal and rep entry*: Single shared validation utility.

### US-44: Update my contact details
- **Stakeholder**: Customer | **Priority**: Low
- **Screen Location**: `portal-details.html` (Customer role, Account `100001`)
- **How to Demo**:
  1. Verify as Customer `100001` on `portal-details.html`.
  2. Editable fields are active in the contact form: Phone, Email, Address line 1, Town/city, and Postcode.
  3. Observe that postcode has been removed from "Details you cannot change here" because it is an editable address field in the form above; non-editable fields locked in the read-only panel are strictly Name, Account number, and Date of birth.
  4. Edit email to `alex.new@example.com` or update address/postcode and submit.
  5. Green confirmation panel confirms update saved at current timestamp.
- **Acceptance Criteria Verification**:
  - *Edit phone, email, address*: Form inputs provided for permitted fields (including postcode within the address form).
  - *Changes save to central record immediately*: Instant local persistence.
  - *Confirmation of saved change*: Prominent success banner.
  - *Can edit only allowed fields*: Core identifiers locked (Name, Account number, DOB).

### US-45: Be alerted to changes in my details
- **Stakeholder**: Customer | **Priority**: Low
- **Screen Location**: `portal-details.html` & `outbox.html` (Customer and IT roles only)
- **How to Demo**:
  1. Update email address as Customer `100001`.
  2. Green banner notes that a security notice was sent to the *previous* email address (`alex.hartley@example.com`).
  3. Open `outbox.html` (accessible only to Customer and IT roles): inspect security message (`TPL-6`: Details changed).
  4. Notice says: "The email address on your account was changed. If you did not make this change, call 0800 000 000 immediately." New value is not disclosed.
- **Acceptance Criteria Verification**:
  - *Notification sent to previous contact immediately*: Dispatched to prior address.
  - *Includes how to report unauthorised change*: Rep fraud telephone provided.
  - *Role access*: Strictly restricted to Customer and IT.

### US-46: See updated details without re-entry
- **Stakeholder**: Collections Representative | **Priority**: Low
- **Screen Location**: `staff-record.html?acct=100001` (Rep role)
- **How to Demo**:
  1. After Customer `100001` changes their email, switch to **Rep** role and open account `100001`.
  2. New email is shown immediately in the Summary tab.
  3. Summary header displays a "Customer-made change" badge with exact timestamp.
  4. No manual re-entry required by rep.
- **Acceptance Criteria Verification**:
  - *Portal changes appear on record immediately*: Instant visibility.
  - *Marks change as customer-made with timestamp*: Dedicated UI badge.
  - *No manual re-entry required*: Automatic synchronization.

### US-47: Audit customer-made changes
- **Stakeholder**: Compliance Liaison | **Priority**: Low
- **Screen Location**: `reports.html?r=audit-trail` (Compliance role)
- **How to Demo**:
  1. Switch to **Compliance** role -> **Audit trail**.
  2. Filter by Action `update-contact` and Channel `portal`.
  3. View audit row: shows previous value (`alex.hartley@example.com`), new value (`alex.new@example.com`), timestamp, and Customer ID.
- **Acceptance Criteria Verification**:
  - *Logs previous, new value, time, channel*: Full before/after snapshot.
  - *Searchable by customer and date*: Integrated compliance filters.

```
========================================================================================
EPIC 10: AUTOMATED PAYMENT REMINDERS (US-48 to US-53)
========================================================================================
```

### US-48: Receive a reminder before payment is due
- **Stakeholder**: Customer | **Priority**: Medium
- **Screen Location**: `jobs.html` (IT role) & `outbox.html` (Customer role, or IT delivery telemetry)
- **How to Demo**:
  1. In **IT** role, open `jobs.html`.
  2. Click **Run reminder job**.
  3. Reminders are dispatched for accounts whose payment is due in 3 days (e.g. Account `100001`).
  4. Accounts with £0 balance (e.g. Account `100007`) or opted out (Account `100008`) are skipped with clear reasons.
  5. Re-run demonstration: If a customer opts out after their reminder was initially sent, re-running the job evaluates their current preference and explicitly displays them in the **Skipped** table with reason `"Opted out of reminders"`.
  6. Switch to **Customer** role (`100001`) -> `outbox.html` (or inspect delivery telemetry in IT role): view reminder message containing balance due, due date, pay link, and unsubscribe link. (Note: Collections Rep and Team Leader roles have no access to Outbox).
- **Acceptance Criteria Verification**:
  - *Sent N days before due date*: Dispatched based on configured lead time (default: 3 days).
  - *Includes amount, due date, pay link, rep contact*: Template populates all links.
  - *Customers with zero balance do not receive*: Skipped with recorded reason.
  - *Opted-out customers excluded and audited*: Explicitly captured on initial runs and subsequent re-runs.
  - *Sent to correct customer*: Verified recipient mapping.

### US-49: Manage reminder preferences
- **Stakeholder**: Customer | **Priority**: Medium
- **Screen Location**: `portal-preferences.html` & `outbox.html`
- **How to Demo**:
  1. In `outbox.html`, open a reminder message and click the tokenised preferences link (`portal-preferences.html?t=...`).
  2. Page opens without requiring sign-in (identifying customer via secure token).
  3. Customer checks "Stop sending me payment reminder messages" and saves.
  4. Opt-out takes immediate effect (`optedOut: true`).
  5. Verification enforcement on opt-in: If an unauthenticated user unchecks the opt-out box and attempts to turn reminders back on, the service-layer guard (`Services.setReminderPrefs`) blocks the request with an authentication error: *"Identity verification is required to enable reminders."*
  6. Customer record in staff view displays "Reminders opted out" badge.
- **Acceptance Criteria Verification**:
  - *Every reminder has unsubscribe/preferences link*: Tokenised link included in message footer.
  - *Opt-out takes effect immediately*: Saved instantly to customer record.
  - *Re-enabling reminders gated by authentication*: Service-layer check stops unverified callers re-enabling notifications.
  - *Preference shown on customer record*: Displayed in staff record header.

### US-50: Log reminders automatically
- **Stakeholder**: Collections Representative | **Priority**: Low
- **Screen Location**: `staff-record.html?acct=100001` -> **History** tab (Rep role)
- **How to Demo**:
  1. After running reminder job, switch to **Rep** role and open account `100001`.
  2. Open **History** tab and filter by "Reminder".
  3. System reminder log entry is displayed with date, channel, template reference (`TPL-1`), and message preview.
  4. Rep made zero manual entries.
- **Acceptance Criteria Verification**:
  - *Sent reminder creates log entry with date, channel, template*: All fields present.
  - *Reminders show on account history*: Rendered in main history feed.
  - *No manual logging required*: Wholly automated by scheduler.

### US-51: Configure reminder timing
- **Stakeholder**: Collections Team Leader | **Priority**: Very Low
- **Screen Location**: `reminders-config.html` (Team Leader role -> Admin -> Reminder timing)
- **How to Demo**:
  1. Switch role to **Team leader** and open **Reminder timing** (`reminders-config.html`).
  2. Current timing is displayed: 3 days before due date (allowed: 1 to 14 days).
  3. Change value to `5` and click **Save timing**.
  4. System saves setting, writes an audit record with before/after values, and confirms that newly scheduled reminders will use 5 days while existing scheduled reminders retain 3 days.
  5. Inspect the table panel headed **"Already scheduled"** (without "(these keep their timing)"), which explicitly lists pre-existing reminders retaining their original schedule.
- **Acceptance Criteria Verification**:
  - *Set days before due date within allowed range*: Number field validated between 1 and 14.
  - *Changes apply to reminders scheduled after change*: Preserves existing schedule timing.
  - *Changes logged with user and time*: Full audit trail record created.

### US-52: Use approved reminder templates
- **Stakeholder**: Compliance Liaison | **Priority**: Medium
- **Screen Location**: `compliance-settings.html` (Compliance role -> Admin -> Compliance settings)
- **How to Demo**:
  1. Switch role to **Compliance** and open **Compliance settings**.
  2. View **Reminder message templates** table: Version 1 is "Approved"; Version 2 is "Pending".
  3. Scheduled reminder jobs use only the highest "Approved" version; "Pending" versions are ignored.
  4. Click **Approve** on Version 2: Version 1 becomes "Superseded", Version 2 becomes "Approved", and audit log is written.
  5. Subsequent reminder dispatches immediately use the new wording.
- **Acceptance Criteria Verification**:
  - *Only approved templates can be sent*: Scheduler queries only `status === 'Approved'`.
  - *Template changes require compliance approval and versioning*: Incremental versions start as Pending until approved.
  - *Reminders count towards contact frequency limit*: Evaluated before dispatch.

### US-53: Monitor reminder delivery
- **Stakeholder**: IT Team Member | **Priority**: Low
- **Screen Location**: `reports.html?r=reminder-delivery` (IT role) & `jobs.html`
- **How to Demo**:
  1. Switch role to **IT** and open **Reminder delivery** report.
  2. Table tracks delivery status across all reminder messages (`sent`, `delivered`, `bounced`, `failed`).
  3. Bounced emails (e.g. Account `100005`, Jamie Carter) are highlighted and set `emailBounced: true` on customer record.
  4. Failure rate monitor calculates percentage of bounced/failed messages; if failure rate exceeds 10%, an automated IT alert (`ALT-1`) is triggered.
- **Acceptance Criteria Verification**:
  - *Records delivery status (sent, delivered, bounced, failed)*: Granular status per message.
  - *Alert raised if failure rate exceeds threshold*: Triggers threshold alert in IT dashboard.
  - *Bounced addresses flagged on customer record*: Automatic customer flag update.

---

## 4. Comprehensive Inventory of Exception Paths & Handling

The prototype demonstrates 24 distinct exception and unhappy paths, ensuring that errors, edge cases, and compliance boundaries are gracefully handled across customer self-service and staff operations:

| Exception ID | Category | Trigger Condition / Scenario | User-Facing Experience | System & Service Behavior | Security / Compliance Guardrail | Resolution / Recovery Route |
|---|---|---|---|---|---|---|
| **EP-01** | Verification | Customer enters incorrect password or non-existent account number on `portal-verify.html`. | Displays generic alert: *"We could not verify you with the details entered."* Form clears password field. | Verification logged as `Not verified`. Failed attempt counter incremented. Spike monitor evaluated. | Anti-harvesting: does not reveal whether password was incorrect, whether account exists, or whether it is locked. | Customer checks account credentials or calls Rep via on-screen telephone (`0800 000 000`). |
| **EP-02** | Lockout | Customer fails portal verification 3 consecutive times (`lockoutThreshold`). | Identical generic failure message displayed on portal. | Account marked `locked: true`. Audit event logged. IT alert (`ALT-3`) generated. | Brute-force deterrence: portal conceals lock state; subsequent portal attempts blocked even if credentials are correct. | Unlocked only by a Collections Rep/Leader after passing phone verification (DOB and Postcode). |
| **EP-03** | Threat Detection | 5+ failed portal verification attempts occur across any accounts within 10 minutes. | No user disruption (portal shows standard error). | `checkFailureSpike()` triggers high-severity security alert (`failed-verification-spike`). | Automated threat monitoring and rate alerting for SecOps / IT on-call. | IT reviews alert log in `reports.html?r=lockouts-alerts`. |
| **EP-04** | Staff ID Gate | Caller fails phone verification questions (DOB / Postcode) when speaking to Collections Rep. | Rep interface displays amber "Not verified" badge. Customer record tabs remain hidden. | Verification attempt logged as `Not verified` with Rep ID and timestamp. | Zero data disclosure: Rep cannot view or discuss balance, contact details, or history with unverified caller. | Rep asks caller to retrieve utility bill/statement or routes to senior supervisor. |
| **EP-05** | Account Unlock | Rep attempts to click "Unlock account" for locked customer without phone verification. | Button disabled or service returns error: *"Verify the caller by phone before unlocking."* | Rejects unlock transaction; preserves lock status. | Maker-checker / identity prerequisite: prevents accidental or social-engineered unlocks. | Rep conducts phone verification check (DOB and Postcode); once verified, "Unlock account" button activates and clears lock. |
| **EP-06** | Payments | Customer card payment is declined by card issuer (simulated via "Decline" option). | Error banner: *"Payment of £X.XX failed. Reason: Card declined."* Shows payment reference and attempt count. | Failed payment logged with `status: failed`, `reasonCategory: 'Card declined'`. Key cached in session. | Double-charge prevention: Retry button binds same `idempotencyKey`. | Customer clicks "Retry payment" with same amount, or clicks "Cancel" to select a different amount. |
| **EP-07** | Payments | Payment gateway timeout occurs before confirmation (simulated via "Timeout [not charged]"). | Error banner: *"Payment failed. Reason: Provider timeout."* Clear guidance that money was not taken. | Failed record stored with `status: failed`, `providerCharged: false`. | Safe retry: Reuses identical idempotency token so gateway treats retry as single transaction. | Customer retries payment safely or contacts rep via support route. |
| **EP-08** | Payments | Gateway times out after funds debited at provider (simulated via "Timeout but charged"). | Error banner initially indicates provider timeout. | Stored with `status: failed` but flags `providerCharged: true`. | Idempotent replay: On retry, system detects provider charged and reclaims existing charge without debiting again. | Customer clicks "Retry payment": succeeds instantly, balance drops once, notice confirms no double-charge. |
| **EP-09** | Payments | Customer attempts to pay an amount exceeding balance, zero, or negative value. | Form field highlights red with validation error (e.g. *"Amount cannot exceed current balance of £X.XX"*). | Submission blocked before reaching payment service. | Financial validation: prevents accidental over-collection or negative postings. | Customer corrects amount in accordance with on-screen balance bounds. |
| **EP-10** | Promises | Customer attempts to select a promise date outside 1 to 14 days from today. | HTML date picker constrains selection; manual tampering rejected with field error. | Form rejected by `Validate.date({min, max})`. | Policy enforcement: ensures promises conform to agreed collections policy window. | Customer selects a date within allowable 14-day window. |
| **EP-11** | Promises | Customer submits a new promise when an active promise already exists. | Confirmation notice: *"Your previous promise has been replaced."* | Previous promise marked `status: 'Superseded'`, `supersededBy: [newId]`. Audit trail recorded. | Singular commitment rule: accounts maintain exactly 1 active promise at any time. | New promise becomes active; old promise archived in history. |
| **EP-12** | Fulfilment | Scheduled fulfilment check runs and customer has paid £0 of promised amount. | System flags account; automated missing payment email (`TPL-4`) sent to customer outbox. | Promise updated to `status: 'Not fulfilled'`. Paused follow-ups automatically resumed. Shortfall banner added. | Automated recovery: ensures broken promises are immediately re-queued for collections. | Rep contacts customer; customer can pay online or raise a query. |
| **EP-13** | Fulfilment | Customer paid less than promised amount by due date (e.g. paid £80 of £200). | System updates account; customer record displays partial shortfall banner. | Promise updated to `status: 'Partially fulfilled'`. Shortfall calculated (£120). Paused follow-ups resumed. | Proportional tracking: acknowledges partial payment while maintaining visibility of unpaid balance. | Customer pays remainder online or Rep agrees revised payment plan. |
| **EP-14** | Fulfilment | Customer with unfulfilled promise shortfall makes payment covering the shortfall. | Unfulfilled promise banner clears dynamically from customer record. | `Services.refreshPromiseFlags()` detects `shortfall <= 0`, stamps `flagClearedAt` and audits event. | Dynamic auditability: if payment is later reversed, shortfall banner automatically restores. | Happy recovery; account returns to standard status. |
| **EP-15** | Dispute Hold | Customer disputes delinquency or missing payment via "Is a payment missing? Raise a query". | Yellow banner appears on account: *"Query open: collection activity on hold."* | Case query created (`status: 'Open'`); sets `delinquencyHold: true`. Scheduled jobs skip customer. | Consumer protection: halts automated collections and reminders during disputed cases. | Collections Rep reviews query and clicks "Mark query reviewed", lifting hold. |
| **EP-16** | Contact Limits | Rep attempts to log an interaction when customer had 3+ contacts in last 7 days. | Amber warning appears on form: *"Contact limit reached (3 contacts in last 7 days)."* | Mandatory "Override reason" textarea displayed. Submit button disabled until reason provided. | Regulatory compliance: prevents harassment and regulatory contact frequency breaches. | Rep enters justification (e.g. *"Customer initiated urgent inbound call"*); reason audited. |
| **EP-17** | Preferences | Rep schedules follow-up outside customer's preferred window (e.g. 16:00 vs 09:00-12:00). | Form detects discrepancy; prompts for mandatory override reason. | Follow-up creation requires `overrideReason` before saving. | Customer-centricity: respects customer communication constraints. | Rep enters agreed reason (e.g. *"Customer requested late call back"*); reason logged. |
| **EP-18** | Detail Updates | Customer submits invalid email, phone number, or postcode on `portal-details.html`. | Targeted field-level errors (e.g. *"Enter a valid UK phone number"*). | `Validate.contact()` rejects invalid structures before database write. | Data hygiene: prevents corrupt contact data entering single source of truth. | Customer corrects malformed field. |
| **EP-19** | Account Security | Customer updates contact details in portal. | Security alert notice dispatched immediately to PREVIOUS email and/or phone number. | `sendMessage` dispatches `TPL-6` to old contact info. Old bounce flags cleared if email changed. | Account takeover detection: alerts customer if details were altered fraudulently. | If fraudulent, customer calls fraud telephone (`0800 000 000`) provided in message. |
| **EP-20** | Preferences | User opens `portal-preferences.html` with invalid or corrupted URL token. | Red error banner: *"We could not recognise this link."* Fallback to sign-in or rep support. | Rejects request; prevents unauthenticated preference mutations. | Opaque tokens: protects customer identity by avoiding account numbers in reminder URLs. | Customer signs in via `portal-verify.html` or clicks link in newest email. |
| **EP-21** | Preferences | Unauthenticated visitor tries to re-enable reminders via unsubscribe link. | Form restricts controls: unverified visitors can only opt out or narrow channels. | Service rejects unauthenticated opt-in (`optedOut: false`). | Anti-tamper: third parties finding reminder link cannot spam or re-subscribe customer. | Customer verifies identity on portal to manage full communication settings. |
| **EP-22** | Delivery Failure | Reminder email bounces (e.g. Jamie Carter, Account `100005`). | Delivery status logged as `bounced`. Rep record displays amber "Email bounced" badge. | System sets `emailBounced: true` on customer. Reminder job tracks failure rate. | Communications integrity: prevents sending further emails to known invalid addresses. | Customer updates email in portal, or Rep captures new email during phone contact. |
| **EP-23** | Scheduled Jobs | Fulfilment check encounters simulated data source timeout on Attempt 1. | Attempt table shows Attempt 1 as `retried`. Succeeded on Attempt 2 displayed. | Automatic retry mechanism executes up to configured retries (default: 2 retries). | Resiliency: avoids operational gaps from transient database timeouts. | If all retries fail, high-severity alert (`ALT-2`) alerts IT on-call for manual intervention. |
| **EP-24** | Data Access | User tries to access another customer's data via read-only interface (`/api/customers/X`). | API returns `403 Forbidden` with body: *"You can only read your own record."* | Security event logged in `apiRequests` and written to immutable compliance audit trail. | Horizontal privilege escalation prevention: enforces strict tenant/customer boundary. | User restricted to authenticated session (`/api/me/account`). |

---

## 5. End-to-End Stakeholder Demo Walkthrough Scripts

To conduct a live demonstration for executive stakeholders or assessors, follow these four scripted journeys:

### Script A: Customer Self-Service & Recovery Journey
1. **Sign In or Sign Up**: Open `index.html`.
   - *Existing Customer*: Select **Customer Sign In**, enter Account `100001`, DOB `1988-04-12`, Postcode `M14 5QT`. Click **Sign In to My Account** to arrive on `portal-account.html`.
   - *New Customer*: Select **New Customer Registration**, complete name, address, contact details, initial balance, and consent checkbox. Click **Register & Sign In** to auto-provision account `100010` and sign in immediately.
2. **Account Review**: View balance (£420.00), due date, and payment history.
3. **Card Payment with Failure & Recovery**:
   - Go to **Make a payment** (`portal-pay.html`).
   - Select "Pay a different amount", enter `50.00`.
   - Set demo simulation to **Decline**. Click **Pay now**.
   - Observe the declined notice, error explanation, and safe retry button.
   - Change simulation to **Approve**. Click **Retry payment of £50.00**.
   - View successful confirmation. Balance updates to £370.00.
4. **Make a Promise to Pay**:
   - Go to **Promise to pay** (`portal-promise.html`).
   - Select the 50% plan (£185.00) and pick a date 7 days ahead.
   - Confirm promise. Notice confirmation message and link.
5. **Verify Outbox Messages**:
   - Go to **My messages** (`outbox.html`). View confirmation emails for payment and promise.

### Script B: Collections Rep Case Handling & Exception Journey
1. **Staff Sign In & Verification**:
   - Open `index.html`. Under **Staff Workspace**, select Sam Patel (Collections Rep, Team A) and click **Staff Sign In** (navigates directly to `staff-search.html`).
   - Enter `100006` (Fatima Rahman) on `staff-search.html`.
   - Notice record is locked ("Account locked"). Verification gate is active.
   - Enter caller's DOB (`1975-02-08`) and Postcode (`G12 8QQ`). Click **Verify caller**.
   - Click **Unlock account**: account unlocks and resets failed attempts.
2. **Review Record & Log Case**:
   - View complete balance and history.
   - Click **Log an interaction** (`staff-log.html`).
   - Select Outcome `CB` (Call back requested).
   - Notice automated follow-up is scheduled for +1 day.
   - Save log. Verify follow-up appears in `staff-followups.html`.

### Script C: Team Leader Oversight & Reversals
1. **Overdue Management**:
   - Switch role to **Team leader** (Priya Nair).
   - Open **Follow-ups** (`staff-followups.html`). Review overdue follow-ups across Team A.
   - Reassign an overdue item from Sam Patel to Jo Okafor.
2. **Payment Reversal Approval**:
   - Open **Reversal approvals** (`staff-approvals.html`).
   - Select payment for Account `100007` (duplicate bank transfer).
   - Select reason code `DUPLICATE` and approve.
   - Verify balance restores and reversal notice is dispatched.
3. **Configure Reminder Timing**:
   - Open **Reminder timing** (`reminders-config.html`). Change lead time from 3 to 5 days.

### Script D: IT & Compliance Governance
1. **Run Fulfilment & Retries**:
   - Switch role to **IT**. Open **Scheduled jobs** (`jobs.html`).
   - Simulate a timeout on attempt 1. Run fulfilment check.
   - Observe automatic retry succession, resulting in Fulfilled (`100002`), Partially fulfilled (`100003`), and Not fulfilled (`100004`).
2. **Audit Verification & DLP Scan**:
   - Switch role to **Compliance**. Open **Audit trail** (`reports.html?r=audit-trail`).
   - Filter by customer `100001` to view complete event ledger.
   - Open **Payment audit** (`reports.html?r=payment-audit`): view real-time PCI DSS card data scan confirming zero PAN leaks.
3. **API Security Validation**:
   - Switch to **IT** -> `api-demo.html`.
   - Test own-record retrieval (`200 OK`), cross-customer access attempt (`403 Forbidden`), and write attempt (`405 Method Not Allowed`).
