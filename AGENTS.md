# monozen-skills — Agent Instructions

This repo is the canonical source for the Monozen workspace sandbox.
It's consumed by `npx skills add` and read by agent CLIs at project root.

## Workspace Architecture

The Monozen workspace is a 5-layer sandbox:

- **Layer 0 — Shell Substrate:** herdr v0.7.1 manages panes/tabs/sessions
- **Layer 1 — Directory Shortcut:** `workon {project}` resolves under Projects/
- **Layer 2 — Config Gate:** `kilo.jsonc` controls permissions, skills paths, agent delegation
- **Layer 3 — Skills Federation:** 42 skills federated across 6 directories
- **Layer 4 — Distribution:** This repo → `npx skills add`

See `FEDERATION.md` in this repo for the full federation map.
See `README.md` for setup and scaling guides.

## Engineering Rules

- Do not copy secret values into any output — reference `file:line` and credential type only.
- Skills are Markdown with frontmatter (`id`, `domain`, `consumers`).
- The `consumers` field controls which CLI gets the skill.
- Scope grep and file search to the project directory — avoid system dirs.
- Use `gh-axi` for GitHub operations and `chrome-devtools-axi` for browser automation.
