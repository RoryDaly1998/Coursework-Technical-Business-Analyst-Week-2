# Director's Report: Collections Portal Prototype

## 1. What was created

An interactive wireframe prototype of the Phase 1 collections system. It is plain greyscale and uses fake data only. It has 18 pages and 17 reports, in three areas:

- **Customer portal** (6 pages plus a message viewer): verify identity, view the account, pay (full or part), make a promise to pay, update contact details, and manage reminder preferences.
- **Staff workspace** (4 pages): search by account number, customer record (with phone verification), a standard log form, and follow-up lists. Team leaders also get reversal approval, reminder timing, and team reports.
- **Oversight** (finance, compliance and IT): reports (balances, reconciliation, audit trail, verification log, lockouts, delivery and more), template approval, contact-limit setting, background-job monitoring, and a read-only data interface demo.

One header control switches between six roles: Customer, Collections Representative, Team Leader, Financial Partner, Compliance Liaison and IT Team Member. Each role sees only its own pages.

## 2. Why: coverage of the 10 epics and 53 stories

| Epic | Stories | Where it is shown | Gaps |
|---|---|---|---|
| 1 Central storage | US-01 to 07 | Single customer record, audit trail, migration report, security status, finance balances | Encryption, backups and timings are labelled "simulated" panels. |
| 2 Record logging | US-08 to 11 | Standard log form, team logs, log export, outcomes report | None. |
| 3 Self-service payments | US-12 to 18 | Portal pay with approve, decline, timeout and safe retry; reconciliation; reversal approval | Provider is simulated. |
| 4 Identity verification | US-19 to 23 | Portal verify, lockout, rep phone verification and unlock, verification log | Alert threshold only partly shown (see section 4). |
| 5 Fulfilment check | US-24 to 29 | Jobs page, flag on the record, unfulfilled report, finance report | The deadline alert fires only when all retries fail. |
| 6 Follow-up scheduling | US-30 to 34 | Log form creates follow-ups automatically, rep list, leader reassign, contact limit | None. |
| 7 Promise to pay | US-35 to 39 | Portal promise, confirmation, follow-ups pause, forecast report | None. |
| 8 Account information | US-40 to 42 | Portal account, read-only data interface demo, display sampling | Only one seeded mismatch. |
| 9 Updating details | US-43 to 47 | Portal details with validation, notice to previous contact, "customer-made change" on the record | None. |
| 10 Reminders | US-48 to 53 | Reminder job, outbox, preferences, timing config, template approval, delivery report | Opt-out takes effect immediately. The "n hours" value is a label only. |

All "n seconds" and "TBD" values in the stories appear as visibly labelled placeholders (for example "TBD (demo: 3)"). A prototype cannot measure real performance.

## 3. How to use it

1. Open `prototype-collections-portal/index.html` by double-clicking it in Chrome, Edge or Safari. There is no install and no server. Firefox may lose saved state between pages.
2. The page lists demo accounts 100001 to 100009. A customer verifies with account number, date of birth and postcode (for example 100001, 1988-04-12, M14 5QT).
3. Use the "Role" selector to switch role. "Advance day" moves the demo date forward so time-driven features can be shown. "Reset demo data" starts again.

**Suggested walkthrough**

1. As Customer, verify as 100001, pay part of the balance, then make a promise to pay. Open the message viewer to see the confirmations.
2. Switch to Rep. Search 100001, verify the caller by phone, and see the payment and promise in the history. Log an interaction and see the follow-up appear automatically.
3. Switch to IT. Run the fulfilment check (100002 Fulfilled, 100003 Partially, 100004 Not fulfilled), then the reminder job (some customers are skipped, with reasons).
4. Switch to Team Leader. Approve a reversal, change reminder timing, and view the unfulfilled-promises report.
5. Switch to Finance and Compliance. View reconciliation, the audit trail and template approval.
6. As Customer, enter the wrong details three times for 100001. As Rep, verify by phone and unlock the account.

**Fake data:** all customers, payments, logs, messages and reports. The state is held in the browser's local storage only.

## 4. Errors and issues

**Found and fixed after one review round (code, QA and compliance reviews, plus a headless-browser smoke test)**
- Finance reconciliation lines could show "Does not match" after a normal demo flow. There is now one shared "payments since" rule.
- The outbox showed every customer's messages to staff without verification. It is now gated per customer, and IT sees masked entries.
- Failure messages revealed which accounts exist or are locked. There is now one generic message.
- The unsubscribe link used the account number. It now uses an opaque token and is opt-out only unless the customer is signed in.
- A customer's query hold had no effect or way to clear it. The jobs now honour holds, hardship and wrong-person flags, and a rep can mark a query reviewed.
- New reminder timing could never be shown. There is now a demo button that starts the next billing cycle.
- Different parts of the system wrote audit rows in different shapes, and templates were ignored by some messages. Both are now consistent.
- The privacy notice was thin. It now has placeholder headings and a "Your data rights" panel.
- Smaller items: stricter amount checking, audit entries cannot be updated, the card form is clearly labelled as a test form, and form errors are linked to their fields for accessibility.

**Still open (no second review was run, per your instruction)**
- The prototype was checked by a headless-browser smoke test (no console errors on 45 role and page combinations) and by code reading. It has not been clicked through by a person. The final round of changes was smoke-tested but not re-reviewed.
- Role switching is a stub and is labelled "not security". There is no staff sign-in and no team scoping on records.
- The reminder-preference service call does not itself stop an unverified caller turning reminders back on. Only the page enforces it.
- The link from the reversal result to the customer's message now shows the hidden-count view until the record is unlocked.
- The alert for jobs missing their deadline is not evaluated (US-29), and the failed-attempt alert is simple.
- Repeated small helper functions and report helpers remain in several files. These were judged lower value than the risk of refactoring.
- Accessibility is partial: tabs and modals lack full keyboard support.
- Personal data in audit entries and some reports is shown unmasked (fictional data).
- A reminder job re-run does not show an already-sent customer as skipped after they opt out.

## 5. Out-of-scope work

- Smoke testing in headless Chrome and file-integrity checks (script/link/report-id consistency) were run by the manager through the command-line helper. No existing agent can run a browser. **Recommendation:** add a "Test Runner" agent with terminal access, or give the QA Tester a terminal.
- Copying the plan into the output folder as a build reference, then removing it before delivery.

No backend (Python) work was needed, so the Backend Developer was not used.

## 6. Subagent changes

- **Frontend Developer:** removed the "keep JavaScript minimal" rule, which conflicted with the plan. Added rules against duplicating helpers, requiring one shape and vocabulary for shared data, and requiring every personal-data screen to be gated (the outbox, pickers and logs were missed).
- **Designer:** now must name one shared function and boundary rules for repeated calculations, list personal-data pages and their gates, and state how time-driven criteria are demonstrated.
- No agents were created. All six expected agent files already existed.

## 7. Workflow variations

- The Designer's foundation task was split into three parallel parts (core, data, services) because it was too large for one developer.
- Four front-end chunks were built in parallel after the foundation.
- Code, QA and compliance reviews ran in parallel, as the workflow asks. After revisions, **only one review round** was run, at the director's request. The workflow allows up to three.
- The manager ran a headless-browser smoke test directly instead of delegating it (see section 5).
- Fixes were done in two sequential developer passes (logic and data first, then pages and UI) to avoid file conflicts.

## 8. Compliance and branding

- **Branding and standards:** none were supplied. The prototype uses plain greyscale wireframe styling, and no company standards could be checked.
- **Compliance findings (general good practice, not legal advice):** account details are hidden until verification, and verification answers and card data are never stored. All text is inserted safely, and spreadsheet exports are protected against formula injection. Reminders honour opt-out, contact limits, and approved templates only.
- **Addressed:** account-existence leaks, unsubscribe token, outbox gating, privacy notice, query holds, and the card form labelling.
- **Left open:** see section 4 (stub login, unmasked fictional personal data, partial accessibility). All data is fictional, so none of this is a blocker for a demo. It would be for a real deployment.
