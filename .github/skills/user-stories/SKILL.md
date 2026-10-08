---
name: user-stories
description: 'Write user stories from a list of product features (epics) and stakeholders. Use when asked to create user stories, acceptance criteria, business value, assumptions, dependencies, story prioritisation, epics, product backlog, or a user story report for a Technical Business Analyst deliverable. Produces a formatted .md report.'
argument-hint: 'List of features (epics) and list of stakeholders'
---

# User Stories

Turns a list of features (epics) and a list of stakeholders into a complete user story report and a separate review file, both exported as Markdown.

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

Each story must have all of the following sections, in this order:

| Section | Requirement |
|---------|-------------|
| **ID** | Unique, e.g. `US-01`, grouped under the epic. Shown in the story heading with a short title |
| **Stakeholder** | The persona the story is written from |
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
- Include a short hint in brackets after every ID, e.g. `US-01 (storage), US-03 (customer record)`. See the style guide for hint rules.
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
- [ ] The summary table and overview counts match the story sections (priority, stakeholder, epic, dependencies).
- [ ] The formatting and style guide below is followed.

### 5. Export
Write two files to the agreed folder:

1. The report, using [the report template](./assets/report-template.md). Include:
   1. Overview (source, epics, stakeholders, count of stories, count per priority)
   2. Summary table (all stories: ID, epic, stakeholder, priority, dependencies)
   3. Stories grouped by epic
2. The review, as `user-stories-review.md`, using [the review template](./assets/review-template.md). It confirms the review checks and lists open issues or assumptions the user should validate. Do not put the review inside the report.

Confirm the file paths and a short summary to the user when done.

## Formatting and Style Guide

### Report structure
- `# User Stories Report` as the only H1.
- `## Overview`, `## Summary`, then one `## Epic N: <Feature Name>` per epic.
- `### US-NN: <Title>` for each story. Stories in an epic are separated by a blank line only.
- A `---` line separates the Summary table from Epic 1 and each epic from the next. No `---` between stories.
- No review content in the report.

### Overview
- Bullets in this order: **Source**, **Epics (N)**, **Stakeholders (N)**, **User stories**.
- Epics and stakeholders are comma-separated lists ending with a full stop. Source links to the scope file.
- A priority count table follows (Very High to Very Low). Counts must sum to the story total.

### Summary table
- Columns: ID, Epic, Stakeholder, Priority, Depends On.
- Epic is written as `N. Epic name`. Priority is Title Case.
- Depends On is a comma-separated list of IDs with no hints, or `None`.
- One row per story, in ID order. Every value matches the story section, which is the source of truth.

### Story layout
- Fields appear in this order, separated by one blank line: **Stakeholder:**, **Story:**, **Acceptance Criteria**, **Business Value**, **Assumptions**, **Dependencies:**, **Priority:**.
- Single-value fields are inline (`**Stakeholder:** Customer`). List fields use a bold label with no colon, followed directly by bullets with no blank line between label and first bullet or between bullets.
- Titles are sentence case and start with a verb or short noun phrase (e.g. "Log case interactions with a standard form").
- Stories use `As a` or `As an`, then `I want`, then `so that`, ending with a full stop.

### Bullets
- Sentence case, ending with a full stop, one idea per bullet.
- Business Value bullets use `Value type: one-line explanation.` Use these value types where they apply: Cost reduction, Revenue uplift, Customer satisfaction, Regulatory compliance, Risk reduction, Operational efficiency.
- Assumptions with nothing to record are written as `None` and not as an empty list.
- Unknown numbers are marked `(TBD)` in the bullet, e.g. `within n seconds (n TBD)` or `an agreed frequency (TBD)`. They are listed for validation in the review.

### Dependencies
- `None`, or a comma-separated list such as `US-01 (storage), US-03 (customer record)`.
- The hint is 1-3 lowercase words naming what the dependency provides, not why it is needed.
- A story always gets the same hint wherever it is referenced.

### Priority
- Written as `**Priority:** <Level> - <one-line rationale>.` with a space either side of the hyphen.
- Level is one of Very High, High, Medium, Low, Very Low, in Title Case everywhere, including the summary table.
- If a dependency ranks below its dependant, justify it in the rationale.

### Language
- British English (prioritisation, unauthorised, categorisation).
- Plain, concise wording. No vague terms in criteria. No emojis.
- Use the stakeholder names exactly as given in the input.

### Review file
- Saved as `user-stories-review.md` next to the report.
- Structure: `# User Stories Review`, a link line to the report, `Checked against the skill specification:` followed by bullets, then `**Points to validate with stakeholders**` followed by bullets.
- Claims in the review must match the report. State exceptions explicitly (e.g. a dependency ranked below its dependant) and list them in the validation points.
