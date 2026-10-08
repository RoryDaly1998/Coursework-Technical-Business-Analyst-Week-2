---
name: jira-import
description: 'Convert a reviewed user stories report into Jira CSV import files. Use when asked to export user stories to Jira, import a backlog or epics into Jira, build a Jira CSV import, or a Jira import configuration file. Produces user-stories-jira-import.csv, user-stories-jira-import-configuration.txt and jira-import-guide.md. Run only after the report has been reviewed by a person.'
argument-hint: 'Path to the user stories report, output folder, and Jira project details'
---

# Jira Import

Turns a user stories report (produced by the `user-stories` skill) into three files for Jira Cloud's CSV import: the CSV, a pre-filled import configuration, and a guide listing the manual steps.

## When to Use
- The user wants the stories from `user-stories-report.md` imported into Jira.
- The user wants a Jira CSV, an import configuration file, or an import guide.

Do not use this skill to write or change the stories. Edit the report with the `user-stories` skill, then run this skill.

## Human review gate
The import must happen only after a person has reviewed the report. Before running, ask the user to confirm the report has been reviewed and approved. Do not run the import steps in Jira for the user.

## Inputs
Confirm or look up each of these. Ask only for what is missing.

| Input | Notes |
|-------|-------|
| Report path | Default `docs/user-stories-report.md`. |
| Output folder | Where the three files are saved. Ask if not stated. |
| Epic work type | Default `Epic`. |
| Story work type | Default `Story`. Ask which work types the project has. If the project has no `Story`, Jira auto-maps stories to another type (seen: `Feature`), so use the type that exists. |
| Project key, name, lead | Optional. Without them the guide tells the user to pick the project in the wizard. |
| Work type IDs | Optional, e.g. `Epic=10011`. Specific to the project. |
| Saved Jira configuration | Optional. A configuration file Jira saved after a previous import. If one exists in the workspace (e.g. `BulkCreate-configuration-*.txt`), use it: it supplies the project, work type IDs and the `Issue ID` and `Parent` field keys. |

## Procedure

### 1. Generate the files
Run the script, adding only the options you have values for:

```
python3 .github/skills/jira-import/scripts/generate_jira_import.py \
  --report <report> --out-dir <folder> \
  --story-type <type> --saved-config <file> \
  --project-key <KEY> --project-name "<name>" --project-lead <id> \
  --type-id Epic=<id> --type-id <StoryType>=<id>
```

The script checks the report first. If it finds blocking errors it prints them and writes nothing. Typical errors are a missing required section, a section named differently from the skill layout (e.g. `Acceptance criteria`), an empty list, an invalid priority level or a dependency on a story that does not exist. Fix these in the report (with the `user-stories` skill) and rerun. Do not work around them by editing the generated files.

### 2. Review the output
- Read `jira-import-guide.md`. Add anything the script could not know, such as project-specific behaviour the user has described. Keep its structure.
- Check the script's printed summary: epic and story counts, epic priorities, warnings.
- Report warnings to the user. Warnings do not block the export. For example the summary table disagreeing with a story section: the story section is used.

### 3. Report back
Give the user the three file paths, the item count (epics plus stories), the epic priorities and any warnings. Remind them which manual operations in the guide apply to them.

## What the files contain

### user-stories-jira-import.csv
- Columns: `Issue Type, Issue ID, Parent, Summary, Description, Priority, Labels, Labels`. The header has no punctuation, as Jira requires.
- Epics come first, then stories, because parents must appear before children.
- `Issue ID` is a unique number. A story's `Parent` holds its epic's `Issue ID`, never the Jira key.
- Epic summary is the epic name. Story summary is `US-NN: Title`.
- Story description holds every story field: story ID, stakeholder, story, acceptance criteria, business value, assumptions, dependencies and priority with rationale. It uses Jira wiki markup. Sections not in the skill layout are appended.
- Story priority: Very High to Highest, High to High, Medium to Medium, Low to Low, Very Low to Lowest. The original wording stays in the description.
- Epic priority is the average of its stories' priorities (Very Low = 1 to Very High = 5), with exact halves rounded up. It is not read from the report.
- Two `Labels` columns: the story ID and the stakeholder with spaces replaced by hyphens. Epics have none.
- Every field is quoted, so commas and line breaks are kept.

### user-stories-jira-import-configuration.txt
- JSON saved as `.txt` so Jira's file picker accepts it.
- Maps each CSV column to a Jira field: `Issue Type` to `issuetype`, `Issue ID` to `issue-id`, `Parent` to `parent`, then `summary`, `description`, `priority`, `labels`. These keys were verified against a configuration Jira saved after a successful import.
- `config.file.name` is `user-stories-jira-import.csv`.
- Work type IDs go in `config.value.mappings` only when known. Unknown IDs are left for the user to map in the wizard.
- Do not add `config.file.id`; Jira generates it.

### jira-import-guide.md
Generated by the script, so it adapts to the report:
- Settings used and the project.
- Report check: each expected section name, how many stories have it, and warnings.
- Manual operations that may be needed (project choice, work type mapping, confirming the parent link, priority names, description formatting, dependencies not linked, removing earlier imports, saving the configuration).
- Step-by-step import instructions, the field mapping table and the epic priority table.

## Known limits
- Dependencies are written to the description only; no Jira issue links are created.
- Epic names and story IDs must be unique to avoid confusion after import.
- Work type IDs and the project belong to one Jira site. For another project, regenerate with its details or map the types in the wizard.
- Jira recommends no more than 1500 items per CSV.
- Language: British English in any text added to the guide. No emojis.
