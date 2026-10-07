# Phase 1 Scope Analysis

## Identified Opportunities

This is a table of opportunities from the discovery phase. Included is an overview of the relevance of the opportunity to the process we are trying to improve, the ROI which was calculated in the discovery phase, the estimated complexity of enacting the change and the level of risk associated with the change. All of these aspects will be taken into account when deciding which opportunities are best included in the proof of concept.

| Opportunity | Relevance | ROI | Complexity | Risk |
|-------------|-----------|-----|------------|------|
| Automated Payment Fulfillment Check | High | High | Low | Medium |
| Automated Case Assignment | Medium | Low | High | Medium |
| Centralised Customer Detail Storage | High | Medium | Medium | Medium |
| Standardised Digital Record Logging | High | High | Low | Low |
| Automated Case Complexity Classification | Medium | Low | Medium | Medium |
| Intelligent Case Prioritisation | Low | Low | Medium | Low |
| Automated Follow Up Scheduling | High | High | Low | Medium |
| Self-Service Account Information | Medium | Low | Low | Medium |
| Self-Service Payments | High | High | Medium | High |
| Self-Service Promise To Pay | High | Medium | Low | Low |
| Self-Service Updating Details | Medium | Low | Low | Low |
| Automated Payment Reminders | Medium | Medium | Low | Low |
| Automated Identity Verification | High | Low | Medium | High |

## MoSCoW Prioritisation of Automation Opportunities

This is a MoSCoW breakdown of automation opportunities identified in the discovery phase.

### Must Have:

- **Centralised Customer Detail Storage** - Highly relevant to the project, needed for many other steps in the process to work efficiently. No direct ROI but some indirect ROI by speeding up account information checks. Somewhat complex to install a new database structure but manageable and should need little maintenance. Some risk since incorrect details could lead to compliance issues and problems in reliant areas but a reduction is risk when compared to the current process.
- **Standardised Digital Record Logging** - Automates several steps in the process and aids the implementation of many others. High ROI since it saves a lot of rep time, increases organisational efficiency and causes revenue uplift from correctly handled accounts that may have been handled incorrectly with manual record logging. Low complexity, just a standardised form stored in the database. Low risk since it has no added risk that the current system does not have and even lowers risk by standardising the process.
- **Self-Service Payments** - Core objective of brief to take work off the reps hands. High ROI since it would have a huge saving on staff time. Medium complexity since it requires a payment portal, a payment service and security checks. High risk since an error in the system here could lead to legal trouble or missed revenue collection, also requires policies for refunds, errors and so on.
- **Automated Identity Verification** - Required for all self-service actions. Low expected ROI since it is not a signifcant rep time sink. Potentially complex depending on stringency of checks required. High risk since error in this process could lead to significant liability.

### Should Have:

- **Automated Payment Fulfillment Check** - Highly relevant to the project brief. Saves on staff time but also increases revenue by capturing failed payments which could have been missed with manual checking. Low complexity to build, just a check on whether the promised payment has successfully gone through. Medium risk since it is an easy check to automate but if the software did go wrong then it could lead to missed revenue or customers being wrongly categorised as delinquent.
- **Automated Follow Up Scheduling** - Highly relevant since it represents a key part of the rep workflow which can be automated. High ROI since it would result in time cost savings as well as revenue uplift from not missing payments due to reps forgetting to follow up. Low complexity, simple storing and fetching from database. Medium risk since incorrect scheduling could lead to missed follow ups and direct monetary losses.
- **Self-Service Promise To Pay** - Highly relevant to the project since it saves rep time by offloading cases. Some ROI since it saves a lot of rep time following up on cases. Low complexity, just need to register the users choice. Low risk since no money is exchanging hands so it's easy to fix a mistake.

### Could Have:

- **Self-Service Account Information** - Relevant to the project since the customer will likely want to view their account information but not strictly needed for them to make payments. Low ROI since it provides no new revenue to the business. Low complexity as it is a simple database read. Incorrect information displayed could lead to legal issues but in most cases could be resolved with human help.
- **Self-Service Updating Details** - Somewhat relevant to the process as it saves rep time by allowing customers to update their own details and would lead to less unresolved cases. Low ROI since updating customer details is not a significant time cost saving. Low complexity as it is a simple write to the database. Low risk since it could be easily rectified if there are incorrect details and the onus would be on the customer not the company.
- **Automated Payment Reminders** - Somewhat relevant since it automates a part of the current process which is run manually but is not a core required feature. Leads to some revenue uplift from customers not missing payments. Low complexity as it is just a simple email service. Low risk as an incorrect reminder would cause confusion to the customer but not long term harm.

### Won't Have:

- **Automated Case Assignment** - Somewhat relevant since it would allow reps to focus on cases that need human help but wouldn't speed up the process of dealing with those cases which is where the main bottleneck is. Low ROI since we don't anticipate any revenue uplift here. High complexity since what constitutes a specialised case may not be well defined. Medium risk since a mistake here could send an account into the wrong queue, leading to missed revenue or wrongly categorising customers.
- **Automated Case Complexity Classification** - Relevant to the project brief only in that it would assist the automated case assignment. Low expected ROI since it would not reduce case load only reprioritise and choosing a case is not a significant time sink. Some complexity around designing rules for what constitutes a complex case but once that is configured easy to apply it to each case. Some risk since incorrectly labelled cases could cause them to be put in the wrong queue and dealt with incorrectly.
- **Intelligent Case Prioritisation** - Not relevant to speeding up the process in question. Low ROI since it would not save staff time only help them reprioritise. Medium complexity since there would need to be defined rules to decide on how to prioritise cases. Low risk since cases would not be lost only deprioritised.

## Features in Scope

### In Scope

- **Centralised Customer Detail Storage** - Required for all other automation opportunities.
- **Standardised Digital Record Logging** - Saves a large amount of rep time with significant cost savings.
- **Self-Service Payments** - Core aspect of brief and provides largest potential ROI.
- **Automated Identity Verification** - Required for any self-service automation.
- **Automated Payment Fulfillment Check** - Easy to implement and automates a pain point in the current process.
- **Automated Follow Up Scheduling** - Currently handled manually leading to errors, automation offers revenue uplift through less missed collections.
- **Self-Service Promise To Pay** - Automates current key pain point handled manually and low complexity to implement.
- **Self-Service Account Information** - Significantly eases the process of customer using self-service portal and easy to implement.
- **Self-Service Updating Details** - Eases pain point of reps having to manually change customer details.
- **Automated Payment Reminders** - Easy to implements and potential revenue uplift by increasing successful collections.

### Out of Scope

- **Automated Case Assignment** - Does not affect any significant pain points in the current process and implementation could be difficult.
- **Automated Case Complexity Classification** - Would not reduce rep case load and so does not represent a significant ROI.
- **Intelligent Case Prioritisation** - Does not automate a significant pain point or offer real savings to the company.
- **Specialist Case Handling** - Needs human oversight, not an automation candidate.
- **Case Escalation** - Not in scope for the project.

## ADKAR Analysis

| Stakeholder | Awareness | Desire | Knowledge | Ability | Reinforcement |
|-------------|-----------|--------|-----------|---------|---------------|
| Customer | **Medium** - Aware of inefficiencies in current process but not with specifics of where the process breaks down. | **Medium** - Some customers will want an easier experience, some would rather stick to the process they're used to. | **Medium** - Self service will be a brand new system but old method of contacting rep directly will still be an option. | **Medium** - Customers with technical ability will find the change easy while those without may struggle. | **Medium** - Will support the service if it provides a good service. Won't support if there are issues or if it confusing to use. |
| Collections Representative | **High** - Deals with pain points in the process every day. | **Medium** - Some reps will welcome the improved workflow but others will see it as a threat to job security. | **High** - Reps already use database and process for self service does not affect their workflow. | **High** - No new technologies to learn as the rep process does not change very much. | **Medium** - Will support the new process only if it proves a net benefit to their workload. |
| Collections Team Leader | **High** - See the effect of current workflow issues on their team every day. | **Medium** - Will want a better workflow for their team but will be cautious that any new processes don't create new issues. | **Medium** - Manager process does not change but underlying technologies do which the managers may need to interact with for complex cases. | **Medium** - Reconciling complex cases may involve direct interaction with new technologies such as the database. | **Medium** - The new process will continue to be supported only if it successfully improves their team's workflow. |
| Financial Partner | **Medium** - Aware of financial losses but not parts of the process that cause inefficiencies. | **Medium** - Strong desire to increase revenue and reduce costs but will be cautious to make sure new process is actually effective. | **Low** - Will have to interact with new database in order to create financial reports. | **Medium** - Processes for financial reporting will be new but they have dealt with the previous database system and so skills will transfer to dealing with the new one. | **Medium** - Will continue to support only if there are proven cost savings and revenue uplift from automation. |
| Compliance Liaison | **High** - Very aware of need for better recording of data for audit trails. | **Medium** - Current process makes audits easy to fail through poor data organisation. However a new process could create new risks. | **Low** - New self service portal will create completely new process for data audits. | **Medium** - Dealing with legacy system means they have the ability to deal with databases but self service portal will require new auditing processes. | **Medium** - Will support the new process only if it makes the auditing process easier and more accurate. |
| IT Team Member | **Medium** - Some awareness of change due to having to maintain many different workaround systems. Low awareness of business need for change. | **Medium** - Desire to simplify the current system and create less maintenance work but only if the new system does not create new issues. | **Low** - New process will introduce many new processes they would need to learn. | **Medium** - Already know how to build and maintain current legacy database which will translate to ability to build and maintain new database but some processes like automatic verification will be completely new. | **Medium** - Will support new process only if it is easy to maintain and does not cause new issues. |

## ADKAR Risk Mitigation Strategy

### Customer

**Risk** - Customers are only partially aware of where the current process breaks down and some prefer dealing with a human rep, leading to low portal uptake. Customers with limited technical ability may struggle, and a confusing or unreliable portal will remove their support.

**Mitigation Actions** -
- Communicate the benefits of self-service (faster resolution, 24/7 access) through the existing contact channels such as email and rep calls.
- Keep the rep contact route available so no customer is forced onto the portal.
- Provide in-portal guidance and a short how-to guide for first-time users.
- Usability test the portal with a sample of customers, including less technical ones, before launch.
- Monitor portal error rates and customer feedback after launch and fix issues quickly.

### Collections Representative

**Risk** - Some reps may see automation as a threat to job security, reducing desire and leading to resistance. Support depends on the new process proving a net benefit to their workload.

**Mitigation Actions** -
- Communicate early that automation is intended to remove repetitive work so reps can focus on complex and specialist cases.
- Involve reps in testing the prototype and gather their feedback to shape the process.
- Share workload measures (e.g. cases handled per rep, time spent on admin) before and after rollout to show the benefit.
- Agree with management how any freed capacity will be used and communicate this to reps.

### Collections Team Leader

**Risk** - Team leaders will need to interact with new underlying technologies, such as the database, when reconciling complex cases, and may be cautious that the new process creates new issues. Support depends on it improving their team's workflow.

**Mitigation Actions** -
- Provide hands-on training on the new database and case reconciliation steps before go-live.
- Provide a quick reference guide for common complex case scenarios.
- Name an IT contact for escalating issues during the early rollout period.
- Review team workflow measures with team leaders regularly after launch and act on their feedback.

### Financial Partner

**Risk** - Financial partners will need to create reports from the new database, which they do not yet know how to use. Their support depends on proven cost savings and revenue uplift.

**Mitigation Actions** -
- Provide standard financial report templates and training on the new database before go-live.
- Agree baseline measures with the Financial Partner (e.g. collection rate, rep time per case) before launch.
- Report against those measures at agreed intervals after launch to evidence savings and uplift.

### Compliance Liaison

**Risk** - The self-service portal creates a new process for data audits, which the Compliance Liaison is not yet familiar with, and the new process could introduce new compliance risks. Support depends on auditing becoming easier and more accurate.

**Mitigation Actions** -
- Involve the Compliance Liaison in requirements and design so audit trail needs are built in from the start.
- Confirm that standardised record logging captures all data required for audits.
- Walk through the new audit process and train the Compliance Liaison before go-live.
- Run a trial audit on prototype data to check the new process works before full rollout.

### IT Team Member

**Risk** - IT team members have low awareness of the business need and low knowledge of some new processes, such as automated identity verification. Their support depends on the system being easy to maintain and not creating new issues.

**Mitigation Actions** -
- Brief the IT team on the business case and the pain points the project addresses.
- Involve the IT team in design and build so they understand the system before handover.
- Provide training and documentation on new components such as identity verification and the payment service.
- Define a maintenance and support plan before go-live, including monitoring and incident handling.

## Deliverable Timeline

| Deliverable | Deadline | Potential Blockers |
|-------------|----------|--------------------|
| To-Be Process Diagram | Tuesday | None |
| User Stories | Tuesday | None |
| Build Prototype | Thursday | Dependencies required that weren't considered. Implementation is more complex than expected. |
| Stakeholder Briefing | Friday | None |