---
name: user-stories
description: 'Write user stories from a list of product features (epics) and stakeholders. Use when asked to create user stories, acceptance criteria, business value, assumptions, dependencies, story prioritisation, epics, product backlog, or a user story report for a Technical Business Analyst deliverable. Produces a formatted .md report.'
argument-hint: 'List of features (epics) and list of stakeholders'
---

# User Stories

Turns a list of features (epics) and a list of stakeholders into a complete, reviewed user story report exported as a Markdown file.

## When to Use
- The user supplies features for a new product and stakeholders, and wants user stories.
- The user wants acceptance criteria, business value, assumptions, dependencies or priorities for a backlog.

## Inputs
- **Features**: each feature is one epic.
- **Stakeholders**: the personas stories are written from.

If either input is missing, check the workspace for relevant files and confirm with the user before proceeding. Ask where to save the report if not stated.

## Procedure

Work through the stages in order. Do not skip the final review.

### 1. Write user stories
For each epic, write as many stories as the stakeholder list supports. Cover every stakeholder who plausibly interacts with or is affected by the epic.

Each story must have all of the following sections:

| Section | Requirement |
|---------|-------------|
| **ID** | Unique, e.g. `US-01`, grouped under the epic |
| **Story** | `As a <stakeholder>, I want <capability>, so that <benefit>.` Clear, concise, one use case |
| **Acceptance Criteria** | As many as apply. Concise bullets, each directly relevant to the story and measurable or with a clear pass/fail condition |
| **Business Value** | Concise list of every value that applies, e.g. cost reduction, revenue uplift, customer satisfaction, regulatory compliance, risk reduction, operational efficiency |
| **Assumptions** | What must be true for the story to work, e.g. legacy database migrated, payment provider contracted, customers have email addresses |
| **Dependencies** | Filled in at stage 2 |
| **Priority** | Filled in at stage 3 |

Acceptance criteria rules:
- Prefer measurable wording (time, count, percentage, state change, explicit message shown).
- One condition per bullet; no vague terms such as "easy", "fast", "user friendly".
- Do not restate the story or add criteria unrelated to it.

### 2. Define dependencies
For each story, list the story IDs that must be completed first. Write `None` if there are none.
- Only list direct, genuine blockers (not general relevance).
- Include a short reason in brackets, e.g. `US-01 (customer records must exist)`.
- Check for circular dependencies and remove them.

### 3. Assign priority
Rate each story: **Very Low, Low, Medium, High, Very High**.
- Higher for foundational stories that many others depend on, and for stories central to the core product objective, compliance or revenue.
- Lower for stories that are optional conveniences or have no dependants.
- A story must not have a lower priority than a story that depends on it being finished first unless justified in the story.
- Add a one-line rationale to each priority.

### 4. Review against specification
Before exporting, check and fix:
- [ ] Every feature is an epic with at least one story.
- [ ] Every story has: ID, story statement, acceptance criteria, business value, assumptions, dependencies, priority.
- [ ] Stories are clear and concise and describe one use case.
- [ ] Every acceptance criterion is measurable or has a clear pass/fail condition and relates to its story.
- [ ] Business values are specific and cover all that apply.
- [ ] Assumptions are explicit and not trivial.
- [ ] Dependencies reference real story IDs, with no circular references.
- [ ] Priorities are sensible: foundational stories rank above their dependants.
- [ ] Every stakeholder from the input appears in at least one story.

### 5. Export
Write the report to the agreed path using [the report template](./assets/report-template.md). Include:
1. Overview (features, stakeholders, count of stories)
2. Priority summary table (all stories: ID, epic, stakeholder, priority, dependencies)
3. Stories grouped by epic
4. Review confirmation, noting any open issues or assumptions the user should validate

Confirm the file path and a short summary to the user when done.
