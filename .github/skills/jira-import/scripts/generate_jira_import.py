#!/usr/bin/env python3
"""Generate Jira CSV import files from a user stories report.

Reads the report, validates it against the user-stories skill layout, then writes:
  user-stories-jira-import.csv
  user-stories-jira-import-configuration.txt
  jira-import-guide.md
Nothing is written if the report has blocking errors.
"""
import argparse
import csv
import json
import re
import sys
from fractions import Fraction
from math import floor
from pathlib import Path

CSV_NAME = "user-stories-jira-import.csv"
CONFIG_NAME = "user-stories-jira-import-configuration.txt"
GUIDE_NAME = "jira-import-guide.md"

REQUIRED = ["Stakeholder", "Story", "Acceptance Criteria", "Business Value",
            "Assumptions", "Dependencies", "Priority"]
LIST_FIELDS = ["Acceptance Criteria", "Business Value"]
SCORE = {"Very Low": 1, "Low": 2, "Medium": 3, "High": 4, "Very High": 5}
JIRA_PRIORITY = {1: "Lowest", 2: "Low", 3: "Medium", 4: "High", 5: "Highest"}
CSV_HEADER = ["Issue Type", "Issue ID", "Parent", "Summary", "Description",
              "Priority", "Labels", "Labels"]


def parse_report(text):
    epics, stories, table, overview, stray = [], [], [], {"priorities": {}}, []
    cur_epic = cur = label = None
    section = None
    for raw in text.splitlines():
        line = raw.rstrip()
        m = re.match(r"## Epic (\d+):\s*(.+)", line)
        if m:
            cur_epic = {"num": int(m[1]), "name": m[2].strip(), "stories": []}
            epics.append(cur_epic)
            cur = label = None
            section = "epic"
            continue
        if line.startswith("## "):
            section = line[3:].strip().lower()
            if section not in ("overview", "summary"):
                stray.append(line[3:].strip())
            cur_epic = cur = label = None
            continue
        m = re.match(r"### (US-\d+):\s*(.+)", line)
        if m:
            cur = {"id": m[1], "title": m[2].strip(), "epic": cur_epic, "sections": {}}
            stories.append(cur)
            if cur_epic:
                cur_epic["stories"].append(cur)
            label = None
            continue
        if line.startswith("### "):
            stray.append(line[4:].strip())
            cur = label = None
            continue
        if line.strip() == "---":
            continue
        if section == "overview":
            m = re.match(r"- \*\*User stories:\*\*\s*(\d+)", line)
            if m:
                overview["stories"] = int(m[1])
            m = re.match(r"\|\s*(Very High|High|Medium|Low|Very Low)\s*\|\s*(\d+)\s*\|", line)
            if m:
                overview["priorities"][m[1]] = int(m[2])
        if section == "summary" and line.startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 5 and re.fullmatch(r"US-\d+", cells[0]):
                table.append({"id": cells[0], "epic": cells[1], "stakeholder": cells[2],
                              "priority": cells[3], "depends": cells[4]})
        if cur is not None:
            m = re.match(r"\*\*(.+?):\*\*\s*(.*)$", line)
            m2 = re.match(r"\*\*([^*:]+)\*\*\s*$", line)
            if m:
                label = m[1]
                cur["sections"][label] = {"text": m[2].strip(), "items": []}
            elif m2:
                label = m2[1]
                cur["sections"][label] = {"text": "", "items": []}
            elif line.startswith("- ") and label:
                cur["sections"][label]["items"].append(line[2:].strip())
    return epics, stories, table, overview, stray


def level_of(story):
    text = story["sections"].get("Priority", {}).get("text", "")
    return text.split(" - ")[0].strip()


def validate(epics, stories, table, overview, stray):
    errors, warnings, extras = [], [], set()
    required_lower = {r.lower(): r for r in REQUIRED}
    if not epics:
        errors.append("No '## Epic N: Name' headings found.")
    if not stories:
        errors.append("No '### US-NN: Title' headings found.")
    for h in stray:
        warnings.append("Heading not recognised by the importer and ignored: '%s'." % h)

    ids = [s["id"] for s in stories]
    for sid in sorted({i for i in ids if ids.count(i) > 1}):
        errors.append("Duplicate story ID %s." % sid)

    counts = {r: 0 for r in REQUIRED}
    for s in stories:
        sid, sec = s["id"], s["sections"]
        if not s["epic"]:
            errors.append("%s is not under an '## Epic N: Name' heading." % sid)
        for label in sec:
            if label in REQUIRED:
                continue
            if label.lower() in required_lower:
                errors.append("%s: section '%s' should be named '%s'."
                              % (sid, label, required_lower[label.lower()]))
            else:
                extras.add(label)
        for r in REQUIRED:
            if r not in sec:
                errors.append("%s: missing section '%s'." % (sid, r))
                continue
            counts[r] += 1
            if r in LIST_FIELDS and not sec[r]["items"]:
                errors.append("%s: '%s' has no bullet items." % (sid, r))
            if r in ("Stakeholder", "Story", "Dependencies", "Priority") and not sec[r]["text"]:
                errors.append("%s: '%s' is empty." % (sid, r))
            if r == "Assumptions" and not (sec[r]["items"] or sec[r]["text"]):
                errors.append("%s: 'Assumptions' is empty (write None if there are none)." % sid)
        if "Priority" in sec and sec["Priority"]["text"] and level_of(s) not in SCORE:
            errors.append("%s: priority level '%s' is not one of %s."
                          % (sid, level_of(s), ", ".join(SCORE)))
        if "Story" in sec and not re.match(r"As an? ", sec["Story"]["text"]):
            warnings.append("%s: story text does not start with 'As a' or 'As an'." % sid)
        if "Dependencies" in sec:
            for dep in re.findall(r"US-\d+", sec["Dependencies"]["text"]):
                if dep == sid:
                    errors.append("%s depends on itself." % sid)
                elif dep not in ids:
                    errors.append("%s depends on %s, which does not exist." % (sid, dep))
    for label in sorted(extras):
        warnings.append("Extra section '%s' is not part of the skill layout; it will be "
                        "appended to each description that has it." % label)
    for e in epics:
        if not e["stories"]:
            warnings.append("Epic %d '%s' has no stories and will import empty." % (e["num"], e["name"]))

    by_id = {s["id"]: s for s in stories}
    for row in table:
        s = by_id.get(row["id"])
        if not s:
            warnings.append("Summary table lists %s, which has no story section." % row["id"])
            continue
        sec = s["sections"]
        epic_name = re.sub(r"^\d+\.\s*", "", row["epic"])
        if s["epic"] and epic_name != s["epic"]["name"]:
            warnings.append("%s: summary table epic '%s' differs from its section." % (s["id"], row["epic"]))
        if "Stakeholder" in sec and row["stakeholder"] != sec["Stakeholder"]["text"]:
            warnings.append("%s: summary table stakeholder differs from its section." % s["id"])
        if row["priority"] != level_of(s):
            warnings.append("%s: summary table priority '%s' differs from section '%s'. "
                            "The section value is used." % (s["id"], row["priority"], level_of(s)))
        if "Dependencies" in sec:
            want = re.findall(r"US-\d+", sec["Dependencies"]["text"])
            have = re.findall(r"US-\d+", row["depends"])
            if want != have:
                warnings.append("%s: summary table dependencies differ from its section." % s["id"])
    for sid in ids:
        if table and sid not in {r["id"] for r in table}:
            warnings.append("%s is missing from the summary table." % sid)
    if "stories" in overview and overview["stories"] != len(stories):
        warnings.append("Overview says %d stories but %d were found." % (overview["stories"], len(stories)))
    if overview["priorities"]:
        actual = {}
        for s in stories:
            actual[level_of(s)] = actual.get(level_of(s), 0) + 1
        for lvl in SCORE:
            if overview["priorities"].get(lvl, 0) != actual.get(lvl, 0):
                warnings.append("Overview counts %d '%s' stories but %d were found."
                                % (overview["priorities"].get(lvl, 0), lvl, actual.get(lvl, 0)))
    return errors, warnings, counts, sorted(extras)


def epic_priority(epic):
    scores = [SCORE[level_of(s)] for s in epic["stories"]]
    avg = Fraction(sum(scores), len(scores))
    rounded = floor(avg + Fraction(1, 2))  # exact halves round up
    return float(avg), rounded


def bullets(items):
    return "\n".join("* " + i for i in items)


def story_description(s):
    sec = s["sections"]
    assumptions = bullets(sec["Assumptions"]["items"]) or sec["Assumptions"]["text"]
    parts = [
        "*Story ID:* %s\n*Stakeholder:* %s" % (s["id"], sec["Stakeholder"]["text"]),
        "*Story:* %s" % sec["Story"]["text"],
        "h3. Acceptance Criteria\n" + bullets(sec["Acceptance Criteria"]["items"]),
        "h3. Business Value\n" + bullets(sec["Business Value"]["items"]),
        "h3. Assumptions\n" + assumptions,
        "*Dependencies:* %s" % sec["Dependencies"]["text"],
        "*Priority:* %s" % sec["Priority"]["text"],
    ]
    for label, v in sec.items():
        if label in REQUIRED:
            continue
        if v["items"]:
            parts.append("h3. %s\n%s" % (label, bullets(v["items"])))
        elif v["text"]:
            parts.append("*%s:* %s" % (label, v["text"]))
    return "\n\n".join(parts)


def build_rows(epics, epic_type, story_type):
    rows, epic_ids, summary = [], {}, []
    n = 0
    for e in epics:
        n += 1
        epic_ids[e["num"]] = n
        avg, rounded = epic_priority(e)
        first, last = e["stories"][0]["id"], e["stories"][-1]["id"]
        contains = ("1 user story: %s." % first if len(e["stories"]) == 1
                    else "%d user stories: %s to %s." % (len(e["stories"]), first, last))
        desc = ("Epic %d of %d. Contains %s\n\n*Priority:* %s - average of its stories "
                "priorities (Very Low = 1 to Very High = 5, exact halves rounded up)."
                % (e["num"], len(epics), contains, JIRA_PRIORITY[rounded]))
        rows.append([epic_type, n, "", e["name"], desc, JIRA_PRIORITY[rounded], "", ""])
        summary.append((e["num"], e["name"], len(e["stories"]), avg, JIRA_PRIORITY[rounded]))
    for e in epics:
        for s in e["stories"]:
            n += 1
            stake = re.sub(r"[^A-Za-z0-9_-]+", "-", s["sections"]["Stakeholder"]["text"]).strip("-")
            rows.append([story_type, n, epic_ids[e["num"]], "%s: %s" % (s["id"], s["title"]),
                         story_description(s), JIRA_PRIORITY[SCORE[level_of(s)]], s["id"], stake])
    return rows, summary


def read_saved_config(path):
    d = json.loads(Path(path).read_text(encoding="utf-8"))
    fm = d.get("config.field.mappings") or {}
    keys = {c: fm[c]["jira.field"] for c in ("Issue ID", "Parent") if c in fm}
    return (d.get("config.project") or {},
            (d.get("config.value.mappings") or {}).get("Issue Type", {}), keys)


def build_config(project, type_ids, keys):
    def fm(field, changed="true", manual="false"):
        return {"jira.field": field, "userChanged": changed, "manualMapping": manual}
    return {
        "config.version": "2.0",
        "config.project.from.csv": "false",
        "config.encoding": "UTF-8",
        "config.email.suffix": "@",
        "config.file.name": CSV_NAME,
        "config.field.mappings": {
            "Issue Type": fm("issuetype", manual="true" if type_ids else "false"),
            "Issue ID": fm(keys.get("Issue ID", "issue-id")),
            "Parent": fm(keys.get("Parent", "parent")),
            "Summary": fm("summary", "false"),
            "Description": fm("description", "false"),
            "Priority": fm("priority", "false"),
            "Labels": fm("labels", "false"),
        },
        "config.csv.file.id": None,
        "config.value.mappings": {"Issue Type": type_ids} if type_ids else {},
        "config.delimiter": ",",
        "config.project": {
            "project.type": None,
            "project.key": project.get("project.key"),
            "project.description": None,
            "project.url": None,
            "project.name": project.get("project.name"),
            "project.lead": project.get("project.lead"),
        },
        "config.date.format": "dd/MMM/yy h:mm a",
    }


def build_guide(a, epics, stories, counts, errors, warnings, extras, summary,
                project, type_ids, report_name):
    types = [a.epic_type, a.story_type]
    manual = []
    if not project.get("project.key"):
        manual.append("**Choose the project.** No project key was supplied, so the configuration "
                      "does not name one. Select the target space at the space mapping step.")
    for t in types:
        if t not in type_ids:
            manual.append("**Map work type `%s`.** No work type ID was supplied. At the value "
                          "mapping step choose the matching work type in the project." % t)
    manual.append("**Check the work types exist.** `%s` and `%s` must exist in the project. "
                  "If one does not, Jira warns that it is unsupported and substitutes another "
                  "type (a `Story` type missing from the project was auto-mapped to `Feature` "
                  "in a previous import)." % (a.epic_type, a.story_type))
    manual.append("**Confirm the parent link.** At the field mapping step `Issue ID` must map to "
                  "Issue id and `Parent` to Parent. They are pre-filled by the configuration; if "
                  "not, map them by hand. If Parent is not offered, enable sub-tasks (Settings, "
                  "System, Work items, Sub-tasks) and add the Linked Issues field to the "
                  "project screens.")
    manual.append("**Check priority names.** Priorities are written as Highest, High, Medium, "
                  "Low and Lowest. If the project uses a different priority scheme, map them at "
                  "the value mapping step.")
    manual.append("**Check description formatting.** Descriptions use Jira wiki markup (`*bold*`, "
                  "`h3.`, `* bullets`). If literal asterisks or `h3.` show after import, switch "
                  "the description to plain text.")
    manual.append("**Dependencies are text only.** Dependencies appear in each description. "
                  "They are not created as Jira issue links.")
    manual.append("**Remove earlier imports first.** Delete previously imported copies of these "
                  "items, or the import creates duplicates.")
    manual.append("**Save the configuration.** At the end of the import save the configuration "
                  "Jira offers. It records the work type IDs for your project.")

    L = ["# Jira Import Guide", "",
         "Generated from [%s](%s). Do not import until a person has reviewed and approved the report."
         % (report_name, report_name), "",
         "## Files", "",
         "- [%s](%s): the work items to import (%d epics and %d stories = %d items)."
         % (CSV_NAME, CSV_NAME, len(epics), len(stories), len(epics) + len(stories)),
         "- [%s](%s): pre-filled field and value mappings." % (CONFIG_NAME, CONFIG_NAME), "",
         "## Settings used", "",
         "| Setting | Value |", "|---------|-------|",
         "| Project | %s |" % (("%s (%s)" % (project.get("project.name"), project["project.key"]))
                               if project.get("project.key") else "Not set"),
         "| Epic work type | %s (ID %s) |" % (a.epic_type, type_ids.get(a.epic_type, "not set")),
         "| Story work type | %s (ID %s) |" % (a.story_type, type_ids.get(a.story_type, "not set")),
         "", "## Report check", "",
         "| Expected section | Found in | Status |", "|------------------|----------|--------|"]
    for r in REQUIRED:
        ok = counts[r] == len(stories)
        L.append("| %s | %d of %d stories | %s |" % (r, counts[r], len(stories),
                                                     "OK" if ok else "Missing"))
    L += ["", "Epic headings found: %d. Story headings found: %d." % (len(epics), len(stories)), "",
          "**Warnings**"]
    L += ["- " + w for w in warnings] or ["- None."]
    if extras:
        L += ["", "**Unrecognised sections:** " + ", ".join(extras)]
    L += ["", "## Manual operations", "",
          "Complete these in Jira during the import.", ""]
    L += ["%d. %s" % (i, m) for i, m in enumerate(manual, 1)]
    L += ["", "## Import steps", "",
          "1. In Jira go to Settings, then System, then External system import, then CSV. "
          "Select Switch to the old experience if shown.",
          "2. Choose `%s`. Tick Use an existing configuration file and choose `%s`. Next."
          % (CSV_NAME, CONFIG_NAME),
          "3. Select the project. Leave the date format as default. Next.",
          "4. Field mapping: check the table below. Next.",
          "5. Value mapping: check Issue Type and Priority values. Begin import.",
          "6. Save the configuration. Then check the result: %d epics, %d stories, every story "
          "under its epic, priorities and labels set."
          % (len(epics), len(stories)), "",
          "## Field mapping", "",
          "| CSV column | Jira field | Content |", "|------------|-----------|---------|",
          "| Issue Type | Work type | %s for epics, %s for stories |" % (a.epic_type, a.story_type),
          "| Issue ID | Issue id | Unique number used to link children to parents |",
          "| Parent | Parent | Issue ID of the epic that contains the story |",
          "| Summary | Summary | Epic name, or `US-NN: Title` |",
          "| Description | Description | All story fields (see below) |",
          "| Priority | Priority | Very High to Highest, Very Low to Lowest |",
          "| Labels | Labels | Story ID and stakeholder (two columns, merged by Jira) |", "",
          "Story descriptions contain: story ID, stakeholder, story, acceptance criteria, business "
          "value, assumptions, dependencies and priority with rationale.", "",
          "## Epic priorities", "",
          "Epic priority is the average of its stories' priorities (Very Low = 1 to Very High = 5), "
          "with exact halves rounded up.", "",
          "| Epic | Stories | Average | Jira priority |", "|------|---------|---------|---------------|"]
    for num, name, n, avg, jp in summary:
        L.append("| %d. %s | %d | %.2f | %s |" % (num, name, n, avg, jp))
    L.append("")
    return "\n".join(L)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--report", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--story-type", default="Story")
    p.add_argument("--epic-type", default="Epic")
    p.add_argument("--project-key")
    p.add_argument("--project-name")
    p.add_argument("--project-lead")
    p.add_argument("--type-id", action="append", default=[], metavar="NAME=ID")
    p.add_argument("--saved-config", help="Configuration file saved by a previous Jira import")
    a = p.parse_args()

    report = Path(a.report)
    epics, stories, table, overview, stray = parse_report(report.read_text(encoding="utf-8"))
    errors, warnings, counts, extras = validate(epics, stories, table, overview, stray)
    if errors:
        print("BLOCKING ERRORS - nothing written:")
        for e in errors:
            print("  - " + e)
        sys.exit(1)

    project, saved_ids, keys = {}, {}, {}
    if a.saved_config:
        project, saved_ids, keys = read_saved_config(a.saved_config)
    for k, arg in (("project.key", a.project_key), ("project.name", a.project_name),
                   ("project.lead", a.project_lead)):
        if arg:
            project[k] = arg
    type_ids = {t: saved_ids[t] for t in (a.epic_type, a.story_type) if t in saved_ids}
    for item in a.type_id:
        name, _, tid = item.partition("=")
        if name in (a.epic_type, a.story_type) and tid:
            type_ids[name] = tid

    rows, summary = build_rows(epics, a.epic_type, a.story_type)
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    with open(out / CSV_NAME, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL)
        w.writerow(CSV_HEADER)
        w.writerows(rows)
    (out / CONFIG_NAME).write_text(
        json.dumps(build_config(project, type_ids, keys), indent=2) + "\n", encoding="utf-8")
    (out / GUIDE_NAME).write_text(
        build_guide(a, epics, stories, counts, errors, warnings, extras, summary,
                    project, type_ids, report.name), encoding="utf-8")

    print("Wrote %s, %s, %s to %s" % (CSV_NAME, CONFIG_NAME, GUIDE_NAME, out))
    print("%d epics, %d stories, %d rows" % (len(epics), len(stories), len(rows)))
    for num, name, n, avg, jp in summary:
        print("  Epic %d %s: %d stories, avg %.2f -> %s" % (num, name, n, avg, jp))
    print("Warnings (%d):" % len(warnings))
    for w_ in warnings:
        print("  - " + w_)


if __name__ == "__main__":
    main()
