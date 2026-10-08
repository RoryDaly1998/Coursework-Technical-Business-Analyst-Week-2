# Phase 1 Scope Summary

## Scope Definition

### In Scope

- **Centralised Customer Detail Storage** – Foundational data layer required by all subsequent automation features.
- **Standardised Digital Record Logging** – Eliminates manual record-keeping errors and yields substantial rep time and cost savings.
- **Self-Service Payments** – Core project objective delivering the highest direct ROI by shifting collection workloads off representatives.
- **Automated Identity Verification** – Essential security and compliance gate required before customers can perform any self-service actions.
- **Automated Payment Fulfillment Check** – Streamlines reconciliation and prevents missed revenue by automatically verifying completed payments.
- **Automated Follow-Up Scheduling** – Replaces error-prone manual scheduling with automated tracking, reducing lost collections.
- **Self-Service Promise to Pay** – High-impact, low-complexity feature enabling customers to record commitments without representative intervention.
- **Self-Service Account Information** – Low-complexity capability providing customers visibility into balances and status, driving portal adoption.
- **Self-Service Updating Details** – Empowers customers to maintain accurate contact data directly, reducing unresolved cases and staff overhead.
- **Automated Payment Reminders** – Low-overhead proactive notifications that boost collection rates and lower default risk.

### Out of Scope

- **Automated Case Assignment** – Excluded due to high implementation complexity and minimal impact on core processing bottlenecks.
- **Automated Case Complexity Classification** – Reordering case queues provides negligible time savings and does not reduce overall representative workload.
- **Intelligent Case Prioritisation** – Does not address core process bottlenecks or produce tangible operational savings.
- **Specialist Case Handling** – Requires human judgment and contextual analysis; unsuitable for automated processing.
- **Case Escalation** – Retained under existing manual supervisory workflows; excluded from Phase 1.

---

## ADKAR Change Management Analysis

| Stakeholder | Awareness | Desire | Knowledge | Ability | Reinforcement |
|-------------|-----------|--------|-----------|---------|---------------|
| **Customer** | **Medium** – Recognises current inefficiencies, but lacks visibility into system bottlenecks. | **Medium** – Split between those seeking digital convenience and those preferring familiar human support. | **Medium** – Portal is new, but assisted rep channels remain available as a fallback. | **Medium** – High ease of use for digital users; non-technical users may encounter friction. | **Medium** – Continued adoption depends directly on portal usability and reliability. |
| **Collections Representative** | **High** – Experiences daily friction and manual administrative burdens directly. | **Medium** – Welcomes reduced busywork, but may harbor concerns regarding automation displacing roles. | **High** – Already familiar with core data concepts; self-service changes external workflows rather than their core tools. | **High** – Rep tooling and procedures remain largely unchanged, requiring minimal technical upskilling. | **Medium** – Ongoing buy-in requires tangible evidence of reduced administrative workload. |
| **Collections Team Leader** | **High** – Directly observes operational friction and administrative strain on their team. | **Medium** – Eager for workflow efficiency, but wary of new processes introducing operational issues. | **Medium** – Core management workflow is preserved, but resolving complex cases requires new technical exposure. | **Medium** – Handling complex reconciliations requires direct interaction with the new database setup. | **Medium** – Support relies on demonstrable team productivity and error reduction. |
| **Financial Partner** | **Medium** – Sees bottom-line losses, but lacks insight into specific process-level friction points. | **Medium** – Strong interest in cost reduction and revenue uplift, balanced by caution over solution efficacy. | **Low** – Requires instruction on extracting and validating financial reports from the new database. | **Medium** – Core reporting concepts transfer from legacy tools, but specific query and extract steps are new. | **Medium** – Sustained sponsorship requires clear evidence of verified ROI, cost savings, and cash uplift. |
| **Compliance Liaison** | **High** – Keenly aware of audit and compliance vulnerabilities in legacy logging. | **Medium** – Eager to fix fragile manual records, but vigilant against data governance risks in self-service. | **Low** – Self-service portal introduces entirely new data generation and audit trail mechanisms. | **Medium** – Strong database auditing background, but requires training on the self-service audit interface. | **Medium** – Ongoing endorsement contingent on simpler, more defensible, and accurate audit workflows. |
| **IT Team Member** | **Medium** – Aware of legacy patchwork maintenance, but lacks context on strategic business drivers. | **Medium** – Welcomes system simplification provided new technologies do not create maintenance overhead. | **Low** – Unfamiliar with components such as automated third-party verification and payment gateways. | **Medium** – Core database engineering skills transfer directly, but automated identity verification is novel. | **Medium** – Ongoing support requires an easily maintainable, stable platform that avoids operational churn. |

---

## ADKAR Risk Mitigation Strategy

### Customer
- **Risk:** Split preferences and varying technical literacy may depress portal adoption, while technical friction could drive users away.
- **Mitigation Actions:**
  - Promote 24/7 convenience through existing call and email channels while keeping representative-assisted routes open.
  - Deliver intuitive in-portal guidance, clear onboarding, and pre-launch usability testing across diverse customer cohorts.
  - Actively monitor post-launch error rates and user feedback to resolve defects rapidly.

### Collections Representative
- **Risk:** Automation anxiety regarding job security may trigger staff resistance or hinder adoption.
- **Mitigation Actions:**
  - Position automation as an administrative aid that frees staff to tackle complex, high-value cases.
  - Involve representatives directly in prototype testing and user feedback loops.
  - Track and communicate administrative time savings alongside clear management commitments on capacity reuse.

### Collections Team Leader
- **Risk:** Apprehension that technical complexity in handling exceptions will disrupt daily team performance.
- **Mitigation Actions:**
  - Deliver focused hands-on training and quick-reference guides for complex case reconciliations prior to go-live.
  - Establish dedicated IT escalation channels and conduct regular post-launch workflow reviews.

### Financial Partner
- **Risk:** Lack of familiarity with new reporting structures and skepticism regarding delivered ROI.
- **Mitigation Actions:**
  - Supply pre-built reporting templates and comprehensive database training ahead of cutover.
  - Agree baseline operational metrics upfront and report validated cost savings and collection uplifts on a fixed schedule.

### Compliance Liaison
- **Risk:** Concerns over unvetted audit trails and potential regulatory non-compliance in self-service workflows.
- **Mitigation Actions:**
  - Engage compliance stakeholders early to embed audit logging specifications into core design.
  - Validate standardized audit captures via pre-rollout trial audits and deliver dedicated audit walkthroughs.

### IT Team Member
- **Risk:** Limited business context and unfamiliarity with new self-service and verification architectures.
- **Mitigation Actions:**
  - Brief teams on strategic goals and include engineering in architectural design from inception.
  - Provide vendor-specific technical training alongside a structured maintenance, monitoring, and incident response plan.

---

## Deliverable Timeline

| Deliverable | Deadline | Potential Blockers |
|-------------|----------|--------------------|
| **To-Be Process Diagram** | Tuesday | None |
| **User Stories** | Tuesday | None |
| **Build Prototype** | Thursday | Unidentified third-party dependencies; unforeseen implementation complexity. |
| **Stakeholder Briefing** | Friday | None |

---

> **Note:** For the full, unabridged analysis—including the discovery phase opportunity matrix and detailed MoSCoW breakdown—please refer to the full report at [submissions/phase-1-scope.md](submissions/phase-1-scope.md).
