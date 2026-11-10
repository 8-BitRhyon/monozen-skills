---
name: web-design-guidelines
description: "Review UI code against Vercel's Web Interface Guidelines: accessibility, focus, forms, animation, typography, images, performance, navigation, dark mode, touch, locale, hydration, and copy. Use when asked to review my UI, audit accessibility or UX, check a page or component against best practices, or run a pre-merge design review."
---

# Web Design Guidelines

Review UI code. Do not edit it unless the user asks for fixes after the review.

## Scope

- User gives files, globs, or routes: review those.
- No target: ask once. In a git repo, offer `git diff --name-only` and the main UI directories.
- Read every target file plus the components, styles, and layout it depends on. Never review from filenames alone.

## Procedure

1. Read [references/guidelines.md](references/guidelines.md) in full. The rules are pinned from Vercel Labs on 2026-11-10, so the review is repeatable.
2. Classify each rule before reporting:
   - **Mandatory:** accessibility, keyboard and focus behavior, forms and labels, semantic HTML, reduced motion, zoom, contrast, touch targets.
   - **Advisory:** Vercel or React house style, copy conventions, framework-specific patterns. Report only when the project already follows that convention or the user asks for strict compliance.
3. Check implementation, not intent. A rule passes only when the code shows it.
4. For runtime-only behavior (focus order, overflow, reduced motion, hydration), verify with `chrome-devtools-axi` when available. Otherwise mark the finding `unverified`.
5. Group findings by file. Use terse `file:line` lines:

```text
## src/Button.tsx
src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:55 - animation ignores prefers-reduced-motion

## src/Card.tsx
✓ pass
```

6. Order by severity: blocking, degraded UX, advisory. Cap each file at the ten highest-signal findings.
7. End with one summary line: files reviewed, blocking count, advisory count.

## Rules

- Never invent a line number. Re-read the file before citing it.
- Never report a style preference as a defect without labeling it advisory.
- No preamble, no praise, no restating the guidelines.
- If every file passes, write `✓ pass` for each and state that no blocking findings exist.
- Do not edit files. Offer a fix pass only after the review is delivered.

## Maintenance

The reference is vendored for repeatable reviews. Refresh it only on request:

```bash
curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Replace the body, update the pinned date, keep the attribution, then run `npm run validate`.

Source: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines). MIT license and provenance: [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
