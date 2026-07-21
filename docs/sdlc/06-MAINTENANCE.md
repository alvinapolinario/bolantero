# Maintenance & Change Control — Bolantero

## 1. Change types

| Type | Examples | Approval |
|------|----------|----------|
| Standard | Docs, tests, small UI fixes | PR review |
| Normal | New FR, schema change, fee formula change | Design + PR |
| Emergency | Production outage, money bug | Fix-forward + post-incident review |

## 2. Incident response (lightweight)

1. Detect / report (severity S1–S4)
2. Contain (disable path / hotfix)
3. Fix with migration/PR
4. Verify with regression tests
5. Postmortem for S1/S2 (what, why, action items)

## 3. Monitoring (MVP → next)

MVP: manual ops via Admin live deliveries + reports.  
Next: error tracking, uptime checks, auth failure alerts, fee anomaly reports.

## 4. Continuous improvement

Each sprint retrospective should ask:

- Did we follow SDLC gates?
- Which requirements lack tests?
- Any money/security debt?

Backlog items must reference FR/NFR IDs when they change product behavior.
