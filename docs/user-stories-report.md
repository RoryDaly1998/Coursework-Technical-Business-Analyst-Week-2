# User Stories Report

## Overview

- **Source:** In-scope features and ADKAR stakeholders from [phase-1-scope.md](phase-1-scope.md).
- **Epics (10):** Centralised Customer Detail Storage, Standardised Digital Record Logging, Self-Service Payments, Automated Identity Verification, Automated Payment Fulfillment Check, Automated Follow Up Scheduling, Self-Service Promise To Pay, Self-Service Account Information, Self-Service Updating Details, Automated Payment Reminders.
- **Stakeholders (6):** Customer, Collections Representative, Collections Team Leader, Financial Partner, Compliance Liaison, IT Team Member.
- **User stories:** 53

| Priority | Count |
|----------|-------|
| Very High | 9 |
| High | 15 |
| Medium | 14 |
| Low | 11 |
| Very Low | 4 |


## Summary

| ID | Epic | Stakeholder | Priority | Depends On |
|----|------|-------------|----------|------------|
| US-01 | 1. Centralised Customer Detail Storage | IT Team Member | Very High | None |
| US-02 | 1. Centralised Customer Detail Storage | IT Team Member | Very High | US-01 |
| US-03 | 1. Centralised Customer Detail Storage | Collections Representative | Very High | US-01, US-02 |
| US-04 | 1. Centralised Customer Detail Storage | Compliance Liaison | High | US-01 |
| US-05 | 1. Centralised Customer Detail Storage | Collections Team Leader | Medium | US-03 |
| US-06 | 1. Centralised Customer Detail Storage | Financial Partner | High | US-01 |
| US-07 | 1. Centralised Customer Detail Storage | Customer | Low | US-03 |
| US-08 | 2. Standardised Digital Record Logging | Collections Representative | Very High | US-01, US-03 |
| US-09 | 2. Standardised Digital Record Logging | Collections Team Leader | Medium | US-08 |
| US-10 | 2. Standardised Digital Record Logging | Compliance Liaison | High | US-04, US-08 |
| US-11 | 2. Standardised Digital Record Logging | Financial Partner | Medium | US-06, US-08 |
| US-12 | 3. Self-Service Payments | Customer | Very High | US-01, US-19 |
| US-13 | 3. Self-Service Payments | Customer | Medium | US-12 |
| US-14 | 3. Self-Service Payments | Customer | Very High | US-12 |
| US-15 | 3. Self-Service Payments | Collections Representative | High | US-08, US-12 |
| US-16 | 3. Self-Service Payments | Financial Partner | High | US-06, US-12, US-15 |
| US-17 | 3. Self-Service Payments | Compliance Liaison | High | US-04, US-12 |
| US-18 | 3. Self-Service Payments | Collections Team Leader | Medium | US-12, US-15 |
| US-19 | 4. Automated Identity Verification | Customer | Very High | US-01, US-02 |
| US-20 | 4. Automated Identity Verification | Customer | Very High | US-19 |
| US-21 | 4. Automated Identity Verification | Collections Representative | Very High | US-03, US-19 |
| US-22 | 4. Automated Identity Verification | Compliance Liaison | High | US-04, US-19 |
| US-23 | 4. Automated Identity Verification | IT Team Member | High | US-19 |
| US-24 | 5. Automated Payment Fulfillment Check | Collections Representative | High | US-08, US-15 |
| US-25 | 5. Automated Payment Fulfillment Check | Collections Representative | High | US-24 |
| US-26 | 5. Automated Payment Fulfillment Check | Collections Team Leader | Medium | US-24, US-25 |
| US-27 | 5. Automated Payment Fulfillment Check | Financial Partner | Very Low | US-06, US-24 |
| US-28 | 5. Automated Payment Fulfillment Check | Customer | Medium | US-24 |
| US-29 | 5. Automated Payment Fulfillment Check | IT Team Member | Low | US-24 |
| US-30 | 6. Automated Follow Up Scheduling | Collections Representative | High | US-08 |
| US-31 | 6. Automated Follow Up Scheduling | Collections Representative | High | US-30 |
| US-32 | 6. Automated Follow Up Scheduling | Collections Team Leader | Low | US-30 |
| US-33 | 6. Automated Follow Up Scheduling | Compliance Liaison | Medium | US-04, US-30 |
| US-34 | 6. Automated Follow Up Scheduling | Customer | Low | US-30 |
| US-35 | 7. Self-Service Promise To Pay | Customer | High | US-01, US-19 |
| US-36 | 7. Self-Service Promise To Pay | Customer | Medium | US-35 |
| US-37 | 7. Self-Service Promise To Pay | Collections Representative | High | US-08, US-30, US-35 |
| US-38 | 7. Self-Service Promise To Pay | Financial Partner | Very Low | US-06, US-35 |
| US-39 | 7. Self-Service Promise To Pay | Compliance Liaison | High | US-04, US-19, US-35 |
| US-40 | 8. Self-Service Account Information | IT Team Member | Medium | US-01, US-02 |
| US-41 | 8. Self-Service Account Information | Customer | Medium | US-19, US-40 |
| US-42 | 8. Self-Service Account Information | Compliance Liaison | Very Low | US-04, US-41 |
| US-43 | 9. Self-Service Updating Details | IT Team Member | Low | US-01 |
| US-44 | 9. Self-Service Updating Details | Customer | Low | US-19, US-43 |
| US-45 | 9. Self-Service Updating Details | Customer | Low | US-44 |
| US-46 | 9. Self-Service Updating Details | Collections Representative | Low | US-03, US-44 |
| US-47 | 9. Self-Service Updating Details | Compliance Liaison | Low | US-04, US-44 |
| US-48 | 10. Automated Payment Reminders | Customer | Medium | US-01 |
| US-49 | 10. Automated Payment Reminders | Customer | Medium | US-48 |
| US-50 | 10. Automated Payment Reminders | Collections Representative | Low | US-08, US-48 |
| US-51 | 10. Automated Payment Reminders | Collections Team Leader | Very Low | US-48 |
| US-52 | 10. Automated Payment Reminders | Compliance Liaison | Medium | US-33, US-48 |
| US-53 | 10. Automated Payment Reminders | IT Team Member | Low | US-48 |

---

## Epic 1: Centralised Customer Detail Storage

### US-01: Migrate legacy customer data

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want existing customer data migrated into one central database, so that every process reads from a single source of truth.

**Acceptance Criteria**
- All legacy customer records are migrated or listed in an exception report.
- Duplicate customer records are merged or flagged.
- Data types match across all records.

**Business Value**
- Cost reduction: removes maintenance of multiple workaround systems.
- Operational efficiency: single source for all downstream automation.
- Regulatory compliance: consistent data for audits.

**Assumptions**
- Legacy data sources are accessible.
- Data owners agree a data quality and de-duplication rule set.
- A cutover window is available.

**Dependencies:** None

**Priority:** Very High - foundation for every other feature.

### US-02: Secure and back up the central database

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want role-based access, encryption and automated backups on the central database, so that customer data is protected and recoverable.

**Acceptance Criteria**
- Each role can access only its permitted data, verified by access tests.
- Data is encrypted at rest and in transit.
- A backup completes at the agreed frequency (TBD) and a test restore succeeds within the agreed recovery time.
- Unauthorised access attempts are logged.

**Business Value**
- Risk reduction: limits data loss and breach exposure.
- Regulatory compliance: meets data protection obligations.
- Customer satisfaction: protects customer trust.

**Assumptions**
- Roles and permissions are defined with team leaders and compliance.
- Hosting platform supports encryption and scheduled backups.
- A recovery time objective is agreed.

**Dependencies:** US-01 (storage)

**Priority:** Very High - security is required before any customer data is exposed.

### US-03: View a single customer record

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want to see all of a customer's details in one record, so that I can handle their case without searching multiple systems.

**Acceptance Criteria**
- A customer record opens within n seconds (n TBD) when searched by account number.
- The record shows contact details, balance, case history and open follow-ups.
- Reps see only the fields permitted for their role.
- No second system is needed to complete a standard case.

**Business Value**
- Cost reduction: less rep time spent searching.
- Operational efficiency: faster case handling.
- Customer satisfaction: fewer repeated questions.

**Assumptions**
- Reps are trained on the new interface.
- Search by account number is the primary lookup.

**Dependencies:** US-01 (storage), US-02 (security)

**Priority:** Very High - the core rep workflow depends on it.

### US-04: Audit trail of record changes

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want every change to a customer record logged with who, what and when, so that I can evidence data handling during audits.

**Acceptance Criteria**
- Every create, update and delete is logged with user, timestamp, and before/after values.
- Audit entries cannot be edited or deleted by regular users.
- Audit entries can be searched by customer, user and date range.
- Entries are retained for the required retention period.

**Business Value**
- Regulatory compliance: supports audit trail requirements.
- Risk reduction: deters and detects improper changes.
- Cost reduction: shortens audit preparation.

**Assumptions**
- Retention period is confirmed by compliance.
- All system changes go through the central database.

**Dependencies:** US-01 (storage)

**Priority:** High - needed to pass audits and referenced by many compliance stories.

### US-05: Review account history for complex cases

**Stakeholder:** Collections Team Leader

**Story:** As a Collections Team Leader, I want to view a customer's full account history, so that I can reconcile complex cases quickly.

**Acceptance Criteria**
- History shows all payments, contacts and record changes in date order.
- History loads within n seconds (n TBD) for accounts with up to m years of data (m TBD).
- History can be filtered by event type and date range.

**Business Value**
- Operational efficiency: faster resolution of complex cases.
- Customer satisfaction: fewer unresolved cases.

**Assumptions**
- Team leaders have read access to the full history.
- Legacy history is migrated.

**Dependencies:** US-03 (customer record)

**Priority:** Medium - improves exception handling but does not block other stories.

### US-06: Query data for financial reporting

**Stakeholder:** Financial Partner

**Story:** As a Financial Partner, I want to query customer and payment data from the central database, so that I can produce financial reports without manual data gathering.

**Acceptance Criteria**
- Standard reports for balances, collections and arrears run on demand.
- Report totals match source ledger totals.
- Reports run without affecting rep system performance.
- Report access is limited to the Financial Partner role.

**Business Value**
- Cost reduction: removes manual report compilation.
- Revenue uplift: better visibility of collection performance.
- Regulatory compliance: consistent financial figures.

**Assumptions**
- Reporting requirements are agreed with the Financial Partner.
- A reporting tool or read-only data view is available.

**Dependencies:** US-01 (storage)

**Priority:** High - needed to prove cost savings and revenue uplift.

### US-07: Provide details only once

**Stakeholder:** Customer

**Story:** As a Customer, I want my details held once and shared across all reps, so that I do not have to repeat them each time I make contact.

**Acceptance Criteria**
- Any rep can see my details at the start of contact.
- Reps are not required to ask for details already on record.
- Detail corrections made by one rep are visible to all reps immediately.

**Business Value**
- Customer satisfaction: reduces repeated questions.
- Operational efficiency: shorter calls.

**Assumptions**
- Customer data is accurate after migration.

**Dependencies:** US-03 (customer record)

**Priority:** Low - benefit follows from US-03 rather than adding new capability.

---

## Epic 2: Standardised Digital Record Logging

### US-08: Log case interactions with a standard form

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want to log each customer interaction in one standard digital form, so that records are complete and consistent.

**Acceptance Criteria**
- The form captures date, contact method, outcome code, promise details and next action.
- Mandatory fields must be completed before the form can be saved.
- Outcome codes are chosen from a fixed list.
- A log saves within n seconds (n TBD) and is linked to the customer record.

**Business Value**
- Cost reduction: removes manual and duplicate record keeping.
- Revenue uplift: fewer mishandled accounts.
- Regulatory compliance: consistent evidence of contact.

**Assumptions**
- Outcome codes and mandatory fields are agreed across all teams.
- Teams stop using their own workaround logs after go-live.

**Dependencies:** US-01 (storage), US-03 (customer record)

**Priority:** Very High - automates several steps and enables follow-ups, payments and reporting.

### US-09: Review team logs

**Stakeholder:** Collections Team Leader

**Story:** As a Collections Team Leader, I want to view and filter my team's logs, so that I can monitor case handling and quality.

**Acceptance Criteria**
- Logs can be filtered by rep, outcome code and date range.
- Results return within n seconds (n TBD) for a date range of up to m days (m TBD).
- Team leaders see only their own team's logs.

**Business Value**
- Operational efficiency: quicker oversight of workload.
- Customer satisfaction: consistent handling across teams.

**Assumptions**
- Team membership is maintained in the system.

**Dependencies:** US-08 (case logs)

**Priority:** Medium - supports management but does not block other work.

### US-10: Export logs for audits

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want to export case logs for a given customer or period, so that I can respond to audit requests quickly.

**Acceptance Criteria**
- Logs export to CSV or PDF filtered by customer or date range.
- Exports include all form fields and the audit trail for each entry.
- A standard export of up to n records (n TBD) completes within m minutes (m TBD).

**Business Value**
- Regulatory compliance: faster, more complete audit responses.
- Cost reduction: less manual audit preparation.
- Risk reduction: lower risk of failing audits through missing data.

**Assumptions**
- Auditors accept the exported formats.

**Dependencies:** US-04 (audit trail), US-08 (case logs)

**Priority:** High - directly addresses current audit failures.

### US-11: Report on contact outcomes

**Stakeholder:** Financial Partner

**Story:** As a Financial Partner, I want logged outcomes available as structured data, so that I can report on collection results by outcome.

**Acceptance Criteria**
- Outcome codes are stored as discrete values, not free text.
- A report shows the count and value of cases by outcome code.
- Report totals reconcile to logged cases.

**Business Value**
- Revenue uplift: identifies which outcomes lead to collections.
- Cost reduction: removes manual outcome tracking.

**Assumptions**
- Outcome codes map to financial reporting categories.

**Dependencies:** US-06 (reporting access), US-08 (case logs)

**Priority:** Medium - improves insight but is not foundational.

---

## Epic 3: Self-Service Payments

### US-12: Pay an outstanding balance online

**Stakeholder:** Customer

**Story:** As a Customer, I want to pay my outstanding balance by card in the portal, so that I can settle my account without calling a rep.

**Acceptance Criteria**
- A verified customer can pay the full balance or a partial amount.
- Payment amount cannot exceed the outstanding balance.
- A successful payment updates the account balance immediately.
- Card details are never stored on company systems.

**Business Value**
- Cost reduction: removes rep time on payment calls.
- Revenue uplift: easier payment increases collections.
- Customer satisfaction: payment access outside working hours.

**Assumptions**
- A third-party payment provider is contracted and integrated.
- Customers have a card and internet access.
- Payment refund and error policies are defined.

**Dependencies:** US-01 (storage), US-19 (identity verification)

**Priority:** Very High - core objective of the project and largest ROI.

### US-13: Receive payment confirmation

**Stakeholder:** Customer

**Story:** As a Customer, I want an immediate confirmation of my payment, so that I know it succeeded.

**Acceptance Criteria**
- A confirmation page shows amount, date and reference.
- A confirmation email is sent immediately.
- The confirmation matches the amount recorded on the account.

**Business Value**
- Customer satisfaction: reassurance of payment.
- Cost reduction: fewer incoming payment confirmation calls.

**Assumptions**
- A valid customer email address is on record.
- An email service is integrated.

**Dependencies:** US-12 (payments)

**Priority:** Medium - not essential to core process but builds customer trust.

### US-14: Recover from a failed payment

**Stakeholder:** Customer

**Story:** As a Customer, I want a clear message and a safe retry if my payment fails, so that I am not charged twice or left unsure of the outcome.

**Acceptance Criteria**
- A failed payment shows a message stating the reason category (e.g. declined, timeout).
- Retrying does not create a duplicate charge.
- The failed attempt is recorded on the account.
- The customer is shown the rep contact route.

**Business Value**
- Customer satisfaction: reduces frustration at failure.
- Risk reduction: avoids double charges and disputes.
- Revenue uplift: more failed payments are completed on retry.

**Assumptions**
- The payment provider returns failure reason codes.
- Duplicate protection is supported by the provider.

**Dependencies:** US-12 (payments)

**Priority:** Very High - high risk area in core process where errors cause legal and revenue issues.

### US-15: Log portal payments automatically

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want portal payments recorded automatically on the account, so that I do not have to enter them manually.

**Acceptance Criteria**
- A successful payment appears in the case log immediately.
- The log entry includes amount, date, reference and channel.
- No manual entry is needed for portal payments.

**Business Value**
- Cost reduction: removes manual payment recording.
- Operational efficiency: accurate balances for reps.
- Revenue uplift: allows focusing on clients who haven't paid.

**Assumptions**
- The payment provider sends confirmation callbacks reliably.

**Dependencies:** US-08 (case logs), US-12 (payments)

**Priority:** High - automates a key part of the process saving rep time.

### US-16: Reconcile portal payments

**Stakeholder:** Financial Partner

**Story:** As a Financial Partner, I want a regular reconciliation of portal payments against provider settlements, so that I can confirm all money collected is accounted for.

**Acceptance Criteria**
- A report, generated at an agreed frequency (TBD), lists payments in the system versus provider settlement.
- Unmatched items are listed separately.

**Business Value**
- Revenue uplift: unmatched payments are identified and recovered.
- Regulatory compliance: accurate financial records.
- Risk reduction: early detection of payment errors.

**Assumptions**
- The provider supplies a settlement file or API.

**Dependencies:** US-06 (reporting access), US-12 (payments), US-15 (payment posting)

**Priority:** High - protects revenue on the highest-risk feature.

### US-17: Secure and log payment transactions

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want every payment transaction secured to card industry standards and logged, so that the company meets its legal obligations.

**Acceptance Criteria**
- Card data is handled only by the certified payment provider.
- Each transaction has an audit entry with customer, amount, time and result.
- A compliance review confirms no card data is stored or logged.

**Business Value**
- Regulatory compliance: meets payment security standards.
- Risk reduction: reduces fraud and liability.

**Assumptions**
- The payment provider is certified to PCI DSS.
- Required standards are confirmed by compliance.

**Dependencies:** US-04 (audit trail), US-12 (payments)

**Priority:** High - legal exposure on the highest-risk feature.

### US-18: Reverse an erroneous payment

**Stakeholder:** Collections Team Leader

**Story:** As a Collections Team Leader, I want to approve a refund or reversal of an incorrect payment, so that errors are corrected quickly and controlled.

**Acceptance Criteria**
- Only team leaders can approve reversals.
- A reversal requires a reason code and is logged on the account.
- The balance is corrected within a reasonable timeframe.
- The customer is notified of the reversal.

**Business Value**
- Customer satisfaction: errors are fixed fast.
- Risk reduction: reduces legal exposure from payment errors.
- Regulatory compliance: controlled and auditable refunds.

**Assumptions**
- A refund and error policy is agreed.
- The payment provider supports refunds via API.

**Dependencies:** US-12 (payments), US-15 (payment posting)

**Priority:** Medium - required for error handling but manual path does exist.

---

## Epic 4: Automated Identity Verification

### US-19: Verify identity to access the portal

**Stakeholder:** Customer

**Story:** As a Customer, I want to verify my identity securely, so that only I can access my account and make payments.

**Acceptance Criteria**
- Access to account actions requires successful verification.
- A successful verification completes quickly.
- Unverified users cannot view or change any account data.

**Business Value**
- Risk reduction: prevents fraud and unauthorised access.
- Regulatory compliance: protects personal data.
- Customer satisfaction: secure access to account.

**Assumptions**
- Customer data used for verification is accurate after migration.
- The level of check stringency is agreed with compliance.
- A verification method is chosen (e.g. one-time code or knowledge-based check).

**Dependencies:** US-01 (storage), US-02 (security)

**Priority:** Very High - prerequisite for every self-service feature.

### US-20: Use an alternative route when verification fails

**Stakeholder:** Customer

**Story:** As a Customer, I want to be directed to a rep if verification fails, so that I can still resolve my account.

**Acceptance Criteria**
- A failed verification shows the rep contact route.
- The failure message does not reveal which data was incorrect.
- The customer is not locked out of rep-assisted contact.

**Business Value**
- Customer satisfaction: no dead-end for legitimate customers.
- Revenue uplift: customers still reach a payment route.
- Risk reduction: avoids information leakage.

**Assumptions**
- Rep contact channels remain available.

**Dependencies:** US-19 (identity verification)

**Priority:** Very High - new process cannot leave customer at a dead end.

### US-21: Verify customers over the phone

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want to enter a caller's details into the verification process, so that I can verify their identity over the phone before discussing the account.

**Acceptance Criteria**
- The rep can enter the caller's verification details from the customer record screen.
- The system returns a Verified or Not verified result immediately after submission.
- Account details are not displayed to the rep for discussion until the result is Verified.
- The result is shown without revealing which detail was incorrect.
- Each phone verification attempt is logged with rep ID, customer ID, time and outcome.

**Business Value**
- Risk reduction: prevents disclosure of account details to unverified callers.
- Regulatory compliance: consistent identity checks across portal and phone channels.
- Customer satisfaction: customers who fail or avoid the portal still have a secure route.
- Operational efficiency: replaces ad hoc manual questioning with one standard check.

**Assumptions**
- Verification details held for each customer are accurate after migration.
- Phone verification uses the same rules as portal verification, as agreed with compliance.
- Reps have been trained and permitted to run verification.

**Dependencies:** US-03 (customer record), US-19 (identity verification)

**Priority:** Very High - the main fallback when portal verification fails and a prerequisite for safe phone contact.

### US-22: Record every verification attempt

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want every verification attempt logged with its outcome, so that I can evidence access controls to auditors.

**Acceptance Criteria**
- Each attempt logs customer ID, time, method and outcome.
- Logs contain no full verification secrets.
- Logs are retained for the required period and searchable by customer and date.

**Business Value**
- Regulatory compliance: evidence of access control.
- Risk reduction: supports fraud investigation.

**Assumptions**
- Retention period is confirmed by compliance.

**Dependencies:** US-04 (audit trail), US-19 (identity verification)

**Priority:** High - high-risk feature requires traceability.

### US-23: Lock out repeated failed attempts

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want accounts locked after repeated failed verification and alerts raised on unusual activity, so that brute-force and fraud attempts are stopped.

**Acceptance Criteria**
- An account is locked after a number (TBD) of consecutive failed attempts.
- A locked account can only be unlocked by a rep after manual verification.
- An alert is raised if failed attempts exceed an agreed threshold within a defined time window (TBD).

**Business Value**
- Risk reduction: reduces fraud and liability.
- Regulatory compliance: demonstrates security controls.

**Assumptions**
- The lockout limit and alert thresholds are agreed with compliance.
- An alerting channel for IT exists.

**Dependencies:** US-19 (identity verification)

**Priority:** High - limits the liability identified for verification errors.

---

## Epic 5: Automated Payment Fulfillment Check

### US-24: Check promised payments automatically

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want the system to check whether each promised payment was received by its due date, so that I do not have to check manually.

**Acceptance Criteria**
- Each promised payment is checked on its due date.
- Results are set as Fulfilled, Partially fulfilled or Not fulfilled.
- The result is written to the case log automatically.
- Checks complete for all due promises within the due date.

**Business Value**
- Cost reduction: removes manual payment checking.
- Revenue uplift: failed payments are captured rather than missed.
- Operational efficiency: reps focus on non-fulfilled cases.

**Assumptions**
- Payments from all channels are recorded in the central database.
- Promised payments are stored as structured data (amount and date).

**Dependencies:** US-08 (case logs), US-15 (payment posting)

**Priority:** High - highly relevant, low complexity and captures lost revenue.

### US-25: Flag unfulfilled promises on the account

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want unfulfilled promises flagged on the account, so that I can act on them straight away.

**Acceptance Criteria**
- A not fulfilled result flags the account.
- The flag shows promised amount, due date and shortfall.
- The flag clears automatically once the payment is received.

**Business Value**
- Revenue uplift: faster follow up on missed payments.
- Operational efficiency: clear prioritisation for reps.

**Assumptions**
- Reps view flags in the standard case view.

**Dependencies:** US-24 (promise check)

**Priority:** High - turns check results into action.

### US-26: Report of unfulfilled promises

**Stakeholder:** Collections Team Leader

**Story:** As a Collections Team Leader, I want a regular list of unfulfilled promises for my team, so that I can make sure each is followed up.

**Acceptance Criteria**
- The report is generated at an agreed frequency and available by an agreed time (both TBD).
- It lists customer, amount, due date and days overdue.

**Business Value**
- Revenue uplift: fewer missed follow ups.
- Operational efficiency: quick workload oversight.

**Assumptions**
- None

**Dependencies:** US-24 (promise check), US-25 (unfulfilled flag)

**Priority:** Medium - ensures follow ups are not missed.

### US-27: Report on failed payment value

**Stakeholder:** Financial Partner

**Story:** As a Financial Partner, I want to see the count and value of failed and unfulfilled payments, so that I can quantify revenue recovered by the automated check.

**Acceptance Criteria**
- Report shows count and value of each fulfilment result per reporting period (period TBD).
- Totals reconcile to underlying payments.

**Business Value**
- Revenue uplift: evidences recovered collections.

**Assumptions**
- Failed payments are accessible from the payment provider.

**Dependencies:** US-06 (reporting access), US-24 (promise check)

**Priority:** Very Low - nice to have but does not impact delivery.

### US-28: Be told about a missing payment

**Stakeholder:** Customer

**Story:** As a Customer, I want to be notified if my promised payment is not found, so that I can correct it before being treated as delinquent.

**Acceptance Criteria**
- A notification is sent immediately upon a not fulfilled result.
- It states the amount and date expected and how to contact a rep.
- A customer can raise a query that suspends delinquent categorisation until reviewed.

**Business Value**
- Customer satisfaction: avoids wrongful delinquency.
- Revenue uplift: prompts payment.
- Risk reduction: reduces disputes from wrong categorisation.

**Assumptions**
- Valid contact details are on record.
- An email service is available.

**Dependencies:** US-24 (promise check)

**Priority:** Medium - mitigates the risk of wrongly categorised customers.

### US-29: Monitor and retry the check

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want the check job monitored and retried on failure, so that missed runs do not cause missed revenue.

**Acceptance Criteria**
- Each run logs start, end and records processed.
- A failed run is retried automatically up to (TBD) times.
- An alert is sent if the job has not completed successfully by an agreed time (TBD).

**Business Value**
- Risk reduction: prevents silent failures.
- Operational efficiency: less manual checking of jobs.

**Assumptions**
- There is an agreed on time for an automatic check to run before manually retrying.

**Dependencies:** US-24 (promise check)

**Priority:** Low - protects reliability but a manual check is possible with good logging.

---

## Epic 6: Automated Follow Up Scheduling

### US-30: Schedule follow-ups automatically

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want a follow-up scheduled automatically from my logged outcome, so that I never forget to follow up.

**Acceptance Criteria**
- Saving a log with a follow-up outcome creates a follow-up with date and owner.
- Default follow-up intervals are set per outcome code.
- A rep can override the date, with the reason logged.

**Business Value**
- Revenue uplift: fewer missed collections.
- Cost reduction: removes manual diary management.
- Operational efficiency: consistent follow-up timing.

**Assumptions**
- Follow-up intervals per outcome are agreed with team leaders.

**Dependencies:** US-08 (case logs)

**Priority:** High - high ROI and removes a manual source of error.

### US-31: See today's follow-ups

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want a list of my due follow-ups, so that I can work through them in order.

**Acceptance Criteria**
- List shows all follow-ups due today and overdue, sorted by due date.
- Each item links to the customer record.
- Completing a follow-up removes it from the list.

**Business Value**
- Operational efficiency: clear workload.
- Revenue uplift: overdue items are visible.

**Assumptions**
- Reps use the system as intended.

**Dependencies:** US-30 (follow-ups)

**Priority:** High - makes scheduling usable.

### US-32: Monitor overdue follow-ups

**Stakeholder:** Collections Team Leader

**Story:** As a Collections Team Leader, I want to see overdue follow-ups across my team, so that I can reassign or escalate them.

**Acceptance Criteria**
- Overdue follow-ups list rep, customer and days overdue.
- Team leader can reassign a follow-up to another rep.
- Reassignment is logged.

**Business Value**
- Revenue uplift: fewer missed collections.
- Operational efficiency: workload balancing.

**Assumptions**
- Team leaders have authority to reassign work.

**Dependencies:** US-30 (follow-ups)

**Priority:** Low - nice to have but does not impact delivery.

### US-33: Limit and evidence contact frequency

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want follow-up contact frequency limited and its history kept, so that the company can demonstrate compliant collection practices.

**Acceptance Criteria**
- The system warns when scheduling would exceed the agreed contact limit.
- A rep cannot exceed the limit without a logged override reason.
- The full follow-up history can be exported per customer.

**Business Value**
- Regulatory compliance: avoids breaching contact rules.
- Risk reduction: reduces complaints and penalties.

**Assumptions**
- Applicable contact frequency rules are confirmed by compliance.

**Dependencies:** US-04 (audit trail), US-30 (follow-ups)

**Priority:** Medium - prevents regulatory breaches caused by incorrect scheduling.

### US-34: Be contacted at a preferred time

**Stakeholder:** Customer

**Story:** As a Customer, I want follow-up contact at my preferred time and channel, so that I can respond when convenient.

**Acceptance Criteria**
- The preferred time and channel can be recorded on the customer record.
- Scheduled follow-ups default to the recorded preference.
- Follow-ups outside the preferred window require a logged override.

**Business Value**
- Customer satisfaction: respects availability.
- Revenue uplift: higher contact success rate.

**Assumptions**
- Preferences are captured by reps during logging.

**Dependencies:** US-30 (follow-ups)

**Priority:** Low - improves experience but not essential.

---

## Epic 7: Self-Service Promise To Pay

### US-35: Submit a promise to pay

**Stakeholder:** Customer

**Story:** As a Customer, I want to promise a payment amount and date in the portal, so that I can arrange payment without calling a rep.

**Acceptance Criteria**
- A verified customer can select an amount and a date within the permitted window.
- Dates outside the permitted window cannot be selected.
- The promise is saved to the account on submission.
- No more than 1 active promise exists per account.

**Business Value**
- Cost reduction: removes rep time on promise calls.
- Revenue uplift: earlier commitment to pay.
- Customer satisfaction: arranges payment at their convenience.

**Assumptions**
- Policy for permitted amounts and date window is agreed.
- No money is taken at the time of promise.
- Customer can only choose permitted plans.

**Dependencies:** US-01 (storage), US-19 (identity verification)

**Priority:** High - a key manual pain point with low complexity.

### US-36: Confirm the promise

**Stakeholder:** Customer

**Story:** As a Customer, I want confirmation of my promise to pay, so that I know the arrangement is recorded.

**Acceptance Criteria**
- A confirmation page shows amount, date and reference.
- A confirmation email is sent immediately.
- The customer can view the active promise in the portal.

**Business Value**
- Customer satisfaction: clarity of commitment.
- Cost reduction: fewer queries on promise status.

**Assumptions**
- A valid email address is on record.
- Email service is active.

**Dependencies:** US-35 (promise to pay)

**Priority:** Medium - improves clarity but not essential for functionality.

### US-37: Record promises automatically

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want customer promises recorded on the case and follow-ups paused until the due date, so that I do not chase customers who have committed to pay.

**Acceptance Criteria**
- A promise appears in the case log immediately.
- Scheduled follow-ups are paused until the promise due date.
- Follow-ups resume automatically if the promise is unfulfilled.

**Business Value**
- Cost reduction: fewer unnecessary contacts.
- Customer satisfaction: avoids chasing committed customers.
- Operational efficiency: reps focus on uncommitted cases.

**Assumptions**
- None

**Dependencies:** US-08 (case logs), US-30 (follow-ups), US-35 (promise to pay)

**Priority:** High - gives the feature its rep time saving.

### US-38: Forecast cash from promises

**Stakeholder:** Financial Partner

**Story:** As a Financial Partner, I want a report of promised amounts by date, so that I can forecast expected collections.

**Acceptance Criteria**
- Report shows total promised amount over any period chosen.
- Report compares past promised amounts with amounts actually received.
- Report is refreshed when needed.
- Report is filterable by time period.

**Business Value**
- Revenue uplift: better cash flow planning.
- Cost reduction: replaces manual forecasting.

**Assumptions**
- Payment fulfilment data is available.

**Dependencies:** US-06 (reporting access), US-35 (promise to pay)

**Priority:** Very Low - useful insight but not foundational and possible to do manually.

### US-39: Evidence promises for audit

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want every promise stored with the verified identity and timestamp, so that arrangements can be evidenced in audits and disputes.

**Acceptance Criteria**
- Each promise stores customer ID, verification result, timestamp, amount and date.
- Promise records cannot be edited, only superseded with a new record.
- Promises can be exported with the audit trail.

**Business Value**
- Regulatory compliance: proof of customer agreement.
- Risk reduction: supports dispute resolution.

**Assumptions**
- Retention period is confirmed by compliance.

**Dependencies:** US-04 (audit trail), US-19 (identity verification), US-35 (promise to pay)

**Priority:** High - supports compliance on a low-risk feature.

---

## Epic 8: Self-Service Account Information

### US-40: Provide a read-only data interface for the portal

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want the portal to read account data through a read-only interface, so that viewing information cannot alter or expose other records.

**Acceptance Criteria**
- The interface exposes read-only access to the verified customer's own data.
- Requests for another customer's data are rejected and logged.
- Write operations through this interface return an error.

**Business Value**
- Risk reduction: prevents accidental changes and data leakage.
- Regulatory compliance: enforces data access limits.

**Assumptions**
- The portal and database are hosted in an environment that allows an access layer.

**Dependencies:** US-01 (storage), US-02 (security)

**Priority:** Medium - technical foundation for the account information feature.

### US-41: View account information

**Stakeholder:** Customer

**Story:** As a Customer, I want to view my balance, due dates and payment history, so that I know what I owe without calling a rep.

**Acceptance Criteria**
- Page shows current balance, due date, payments and active promise.
- Data shown matches the central record at time of load.
- The page loads quickly.
- Only a verified customer can view the page.

**Business Value**
- Cost reduction: fewer balance enquiry calls.
- Customer satisfaction: transparency and self-sufficiency.

**Assumptions**
- Customers have internet access.
- Historical payment data is migrated.

**Dependencies:** US-19 (identity verification), US-40 (data interface)

**Priority:** Medium - eases portal use but is not required for payments.

### US-42: Verify displayed information and log access

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want portal views of account data logged and checked for accuracy, so that incorrect displays can be detected and corrected.

**Acceptance Criteria**
- Each account view is logged with customer ID and time.
- A sample check, run at an agreed frequency (TBD), confirms displayed values match the database.
- Discrepancies are reported to IT for correction.

**Business Value**
- Regulatory compliance: limits legal risk from incorrect information.
- Risk reduction: early detection of display errors.

**Assumptions**
- Sampling procedure is agreed with compliance.

**Dependencies:** US-04 (audit trail), US-41 (account info)

**Priority:** Very Low - protects against a risk that is resolvable through human support.

---

## Epic 9: Self-Service Updating Details

### US-43: Validate customer detail inputs

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want submitted details validated before saving, so that the database holds only well-formed data.

**Acceptance Criteria**
- Email, phone number and postcode formats are validated.
- Invalid inputs are rejected with a field-level error message.
- Validation rules are applied to both portal and rep entry.

**Business Value**
- Cost reduction: fewer failed contacts caused by bad data.
- Regulatory compliance: improved data accuracy.

**Assumptions**
- Validation rules are agreed per field.

**Dependencies:** US-01 (storage)

**Priority:** Low - protects data quality for an optional feature.

### US-44: Update my contact details

**Stakeholder:** Customer

**Story:** As a Customer, I want to update my contact details in the portal, so that the company can reach me without a call to a rep.

**Acceptance Criteria**
- A verified customer can edit phone, email and address.
- Changes save to the central record immediately.
- The customer sees a confirmation of the saved change.
- Customers can edit only allowed fields.

**Business Value**
- Cost reduction: reduces rep time on detail changes.
- Customer satisfaction: self-service convenience.
- Revenue uplift: accurate details improve contact success.

**Assumptions**
- Policy on which fields customers may edit is agreed.

**Dependencies:** US-19 (identity verification), US-43 (input validation)

**Priority:** Low - low ROI, eases a rep pain point.

### US-45: Be alerted to changes in my details

**Stakeholder:** Customer

**Story:** As a Customer, I want to be notified at my previous contact method when details change, so that I can spot unauthorised changes.

**Acceptance Criteria**
- A notification is sent to the previous email or phone immediately.
- The notification includes how to report an unauthorised change.

**Business Value**
- Risk reduction: detects account takeover.
- Customer satisfaction: increases trust in the portal.

**Assumptions**
- Previous contact details were valid.

**Dependencies:** US-44 (detail updates)

**Priority:** Low - security enhancement on an optional feature.

### US-46: See updated details without re-entry

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want customer-made changes visible on the record straight away, so that I do not update details manually.

**Acceptance Criteria**
- Portal changes appear on the customer record immediately.
- The record marks the change as customer-made with a timestamp.
- No manual re-entry is required.

**Business Value**
- Cost reduction: removes manual detail updates.
- Operational efficiency: reps work from current details.

**Assumptions**
- The central database is the only data store reps use.

**Dependencies:** US-03 (customer record), US-44 (detail updates)

**Priority:** Low - largely delivered by the central record.

### US-47: Audit customer-made changes

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want customer-made changes to show before and after values, so that I can trace the source of any incorrect details.

**Acceptance Criteria**
- Each change logs previous value, new value, time and channel.
- Logs can be searched by customer and date.

**Business Value**
- Regulatory compliance: traceability of data changes.
- Risk reduction: supports investigation of incorrect details.

**Assumptions**
- Audit trail supports channel identification.

**Dependencies:** US-04 (audit trail), US-44 (detail updates)

**Priority:** Low - extends the existing audit trail to the portal.

---

## Epic 10: Automated Payment Reminders

### US-48: Receive a reminder before payment is due

**Stakeholder:** Customer

**Story:** As a Customer, I want a reminder before my payment is due, so that I do not miss it.

**Acceptance Criteria**
- A reminder is sent (TBD) days before the due date.
- It includes amount, due date and a link to pay or contact a rep.
- Customers with no payment due do not receive a reminder.
- Reminders are sent to the correct customer.

**Business Value**
- Revenue uplift: fewer missed payments.
- Cost reduction: replaces manual reminder contact.
- Customer satisfaction: helpful prompt.

**Assumptions**
- An email service is contracted.
- Valid email addresses are on record.
- Reminder timing is agreed.

**Dependencies:** US-01 (storage)

**Priority:** Medium - modest ROI, low complexity.

### US-49: Manage reminder preferences

**Stakeholder:** Customer

**Story:** As a Customer, I want to opt out of reminders or change how I receive them, so that I only get messages I want.

**Acceptance Criteria**
- Every reminder has an unsubscribe or preferences link.
- An opt-out takes effect within n hours (n TBD).
- The preference is shown on the customer record.

**Business Value**
- Customer satisfaction: control over communications.
- Regulatory compliance: honours consent preferences.

**Assumptions**
- Opt-out for reminders is permitted by policy.

**Dependencies:** US-48 (reminders)

**Priority:** Medium - consent requirement for sending reminders.

### US-50: Log reminders automatically

**Stakeholder:** Collections Representative

**Story:** As a Collections Representative, I want each reminder logged on the account, so that I know what the customer has been sent.

**Acceptance Criteria**
- Each sent reminder creates a log entry with date, channel and template.
- Reminders show on the account history.
- No manual logging is required.

**Business Value**
- Operational efficiency: reps see contact history.
- Customer satisfaction: avoids duplicate contact.

**Assumptions**
- Reminder and case logs use the same customer ID.

**Dependencies:** US-08 (case logs), US-48 (reminders)

**Priority:** Low - convenience for reps.

### US-51: Configure reminder timing

**Stakeholder:** Collections Team Leader

**Story:** As a Collections Team Leader, I want to adjust when reminders are sent, so that timing can be tuned to improve payments.

**Acceptance Criteria**
- Team leaders can set days before due date within an allowed range.
- Changes apply to reminders scheduled after the change.
- Changes are logged with user and time.

**Business Value**
- Revenue uplift: allows tuning for higher payment rates.
- Operational efficiency: no IT request needed.

**Assumptions**
- Team leaders are authorised to change reminder settings.

**Dependencies:** US-48 (reminders)

**Priority:** Very Low - the default timing is sufficient at launch.

### US-52: Use approved reminder templates

**Stakeholder:** Compliance Liaison

**Story:** As a Compliance Liaison, I want reminders to use approved templates and respect contact limits, so that messages are compliant.

**Acceptance Criteria**
- Only approved templates can be sent.
- Template changes require compliance approval and are version controlled.
- Reminders count towards the contact frequency limit.

**Business Value**
- Regulatory compliance: consistent, approved wording.
- Risk reduction: avoids incorrect or non-compliant messages.

**Assumptions**
- Compliance has approved the initial templates.

**Dependencies:** US-33 (contact limits), US-48 (reminders)

**Priority:** Medium - controls the risk of confusing or non-compliant reminders.

### US-53: Monitor reminder delivery

**Stakeholder:** IT Team Member

**Story:** As an IT Team Member, I want reminder delivery monitored, so that failures and bounced emails are identified and fixed.

**Acceptance Criteria**
- Each reminder records a delivery status (sent, delivered, bounced, failed).
- An alert is raised if the failure rate exceeds an agreed threshold within a defined period (TBD).
- Bounced addresses are flagged on the customer record.

**Business Value**
- Revenue uplift: reminders actually reach customers.
- Operational efficiency: problems are detected early.

**Assumptions**
- The email provider returns delivery status.

**Dependencies:** US-48 (reminders)

**Priority:** Low - supports reliability of an optional feature.


