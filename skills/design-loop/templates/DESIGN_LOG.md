# Design Log

> One file per design effort. Update in place. Never rewrite history.

- Brief: `DESIGN_BRIEF.md`
- Current direction:
- Started:
- Last update:

## Direction Scores

Score 0-2 per criterion. Review blind: do not record which model produced which direction.

| Criterion | A | B | C |
|---|---|---|---|
| Clarity | | | |
| Hierarchy | | | |
| Craft | | | |
| Motion | | | |
| Distinctiveness | | | |
| Feasibility | | | |
| Total | | | |

- Winner:
- Reason, one sentence:
- Hybrid of:
- Why the hybrid beats each parent:

## Build

- Chosen direction commit:
- Money shot:
- States covered: empty / loading / error / success
- Files owned:

## Annotation Rounds

| Round | Severity | Annotation IDs | Files touched | Verify | Status |
|---|---|---|---|---|---|
| 1 | blocking | | | | |

Pending queue:
```bash
curl -s "http://127.0.0.1:4748/annotations?status=pending" | jq
```

Resolve:
```bash
curl -s -X PATCH "http://127.0.0.1:4748/annotations/<id>" \
  -H "content-type: application/json" \
  -d '{"status":"resolved"}'
```

## Polish

- [ ] Motion 120-240 ms, state change only
- [ ] Keyboard focus order and visible focus
- [ ] `prefers-reduced-motion`
- [ ] 390 px width
- [ ] 1440 px width
- [ ] No anti-slop bans present

## Handoff

- Open questions:
- Known limits:
- Next skill: `production-web-audit`
