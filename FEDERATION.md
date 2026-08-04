# monozen-skills: Federation Map

> How canonical skills are federated across filesystem directories,
> and how CLI consumers resolve them.

---

## Overview

The federation is a **write-once, read-from-anywhere** model. Skills are authored canonically in this repo (`skills/`), validated through a multi-stage pipeline (frontmatter check, em-dash/machine-path bans, lock integrity via `npm run validate`, self-tests, gitleaks secret scan in CI), then distributed to each CLI's native skill directory via `npx skills add`. Each consumer reads from its own path. No symlinks, no shared state.

[Skills Federation mindmap](assets/monozen-skills-federation.svg)

---

## Directory Map

### `~/.agents/skills/` - 36 skills

The primary skill directory. Installed by `npx skills add` and consumed by Pi, Claude Code, OpenCode, Codex, and Cursor.

```
agentic-loop            # Universal observe -> plan -> act -> verify cycle
asta-skill              # Semantic Scholar corpus queries
axi                     # AXI-style CLI design skill
bangumi-frames          # Anime frame extraction from Bilibili
chrome-devtools-axi     # AXI-wrapped browser automation
code-review             # Five-dimension review protocol (universal)
context-engineering       # Context window, token budget, session memory
creating-mermaid-diagrams  # Mermaid diagram generation + Kroki export
drawio-skill            # draw.io diagram XML + export
excalidraw              # Excalidraw diagram generation + export
find-skills             # Agent skill discovery & suggestions
gh-axi                  # AXI-wrapped GitHub CLI (gh)
git-workflow            # Git commit signing + hygiene skill
git-worktree            # Isolated git worktrees (parallel agents)
herdr                   # herdr terminal multiplexer control skill
improve                 # Read-only codebase audit + improvement plans
journal-abbrev          # Journal name abbreviation lookup
monozen-portfolio        # Consolidated Monozen 5-panel SPA + theme contracts
new-project             # Project bootstrap: scaffold + constitution + CI
paper-fetch             # Paper PDF download via Unpaywall | Kroki
pi-agent                # Pi agent runtime, extensions, settings
pi-cli-runtime           # Pi-companion runtime contract
pi-prompting            # Pi prompt composition guidance
pi-result-handling      # Pi output presentation
plantuml-skill          # PlantUML diagram generation + Kroki export
pr-workflow             # Branch -> PR -> checks -> merge -> cleanup
production-web-audit      # Pre-deployment security, perf, CSP audit
prompt-engineering-loop    # Lean prompt refinement loop
quota-axi               # Local provider quota windows
semanticscholar-skill   # Semantic Scholar API search
skill-authoring           # Meta-skill: author runnable OSS skills
task-decomposition      # Task decomposition skill
tasks-axi                 # Markdown-native backlog manager (captain)
test-driven-dev         # Universal TDD: red -> green -> refactor
tldraw-skill            # tldraw diagram JSON + export
video-podcast-maker      # Video generation skill
```

### `~/.commandcode/skills/`  -  12 skills

Command Code's skill directory. A subset of monozen skills plus AXI tools and Cloudflare SDK skills core to the workflow.

```
agents-sdk                # Cloudflare Agents SDK
chrome-devtools-axi     # AXI-wrapped browser automation
cloudflare                # Cloudflare platform skill
cloudflare-email-service  # Cloudflare email service
cloudflare-one            # Cloudflare One Zero Trust
cloudflare-one-migrations # Cloudflare One migrations
durable-objects           # Cloudflare Durable Objects
gh-axi                      # AXI-wrapped GitHub CLI
herdr                       # herdr terminal multiplexer control
sandbox-sdk                # Cloudflare sandbox SDK
turnstile-spin             # Cloudflare Turnstile setup
web-perf                   # Web performance auditing
```

### `~/.gemini/config/skills/`  -  11 skills

Gemini's native skill directory. Primarily design and brand skills.

```
banner-design               # Banner/hero section design
brand                       # Brand identity system
claude-mem                  # Claude memory management
design                      # General design partner skill
design-system               # Design system construction
make-interfaces-feel-better # Interface polish & delight
ponytail                    # Specialized design skill
slides                      # Slide deck design
superpowers                 # Enhanced design capabilities
ui-styling                  # UI style guidance
ui-ux-pro-max               # Comprehensive UI/UX skill
```

### Gemini Plugin Directories  -  2 locations

Installed via Gemini's plugin system. These skills are loaded through plugin-specific paths.

**`~/.gemini/config/plugins/modern-web-guidance-plugin/skills/`**  -  2 skills

```
chrome-extensions       # Chrome extension development
modern-web-guidance     # Modern web development patterns
```

**`~/.gemini/config/plugins/ui-ux-pro-max-skill/.claude/skills/`**  -  7 skills

```
banner-design
brand
design
design-system
slides
ui-styling
ui-ux-pro-max
```

### Command Code Built-in Skills  -  2 skills

Shipped with the `command-code` npm package at `~/.npm-global/lib/node_modules/command-code/skills/`.

```
agent-browser   # Browser automation for AI agents
design          # Design partner for frontend interfaces
```

---

## Consumer → Path Resolution

| CLI | Resolves skills from | Shell substrate | Entry point |
|---|---|---|---|
| **Pi** | `~/.pi/agent/settings.json` -> `skills.paths` (`~/.agents/skills/`) | herdr (panes, sessions) | Global settings.json + AGENTS.md |
| **Claude Code** | `~/.agents/skills/` + `AGENTS.md` at project root | herdr (panes, sessions) | Project-level AGENTS.md lists monozen-skills |
| **OpenCode** | `~/.agents/skills/` + `AGENTS.md` | herdr | AGENTS.md at project root |
| **Codex** | `~/.agents/skills/` + `AGENTS.md` | herdr | AGENTS.md at project root |
| **Cursor** | `~/.agents/skills/` + `AGENTS.md` + `.cursorrules` | herdr | AGENTS.md at project root |
| **Gemini** | `~/.gemini/config/skills/` + plugin skill dirs | herdr | Gemini UI config / plugin settings |

---

## Load Order

Skills are resolved from directory lists per CLI (e.g. Pi's `settings.json -> skills.paths`, Cursor's plugin paths, Gemini's plugin dirs). When multiple directories contain skills with the same name, the **first path wins** (the repo's canonical `skills/` are federated into the earliest priority path so they shadow any external namesakes).

```jsonc
// Pi: ~/.pi/agent/settings.json -> skills.paths (primary consumer)
"skills": {
  "paths": [
    "~/.agents/skills"   // 1st priority (36 skills, canonical monozen skills shadow namesakes)
  ]
}
```

---

## Skill Canonicalization

This repo is the **source of truth** for its own universal skills (`agentic-loop`, `axi`, `herdr`, `git-worktree`, `pi-agent`, `monozen-portfolio`, etc.). Skills that overlap between external directories (e.g., `design`, `banner-design` in Gemini plugin dirs) live in those external repos, not here. This repo federates its canonical set, it does not deduplicate third-party registries.

Installation per consumer is handled by `scripts/install.sh`:
- Universal skills → installed to every consumer path that needs them (`~/.agents/skills/` and friends)
- Consumer-specific skills → mentioned in the per-consumer directory block above
- `skills-lock.json` (generated by `npm run manifest`) is the canonical manifest: name, description, source, and a sha256 content hash per skill. `validate.sh` enforces that the lock is complete, orphan-free, and in sync with disk.

---

## Adding to the Federation

To add a new skill that appears in every consumer's directory:

1. Create the skill folder `skills/<name>/SKILL.md` with `name` + `description` frontmatter (name must equal the folder name).
2. Run `npm run manifest` to regenerate `skills-lock.json`, then `npm run validate && npm test`.
3. Commit the skill and the lock file together (the pre-commit hook enforces lock sync).
4. Consumers pick it up on next `npx skills add 8-BitRhyon/monozen-skills`.

---

## CI/CD Security: SHA-Pinned GitHub Actions

Every GitHub Action referenced in `.github/workflows/` **must** be pinned to a full commit SHA, never a mutable version tag (`@v1`, `@latest`, `@main`).

### Why

Version tags are mutable references. The action owner (or anyone who compromises the action repo) can move a tag to point to different code at any time. A workflow using `action@v1` today could silently execute different, potentially malicious code tomorrow with no diff visible in this repo.

A commit SHA is immutable. It always resolves to the exact commit it was reviewed against, so no one can swap in altered code by moving a tag. This closes the tag-reassignment supply chain vector entirely.

This is a general GitHub Actions security practice, not specific to any runtime or language.

### Enforcement

The `zgosalvez/github-actions-ensure-sha-pinned-actions` step in the validate workflow scans every workflow and fails the build if any action uses a version tag instead of a SHA. This check is a release gate: a workflow with an unpinned action does not pass CI.

### Rule of Thumb

When adding any action to a workflow:

1. Resolve the action to a specific release tag (e.g., `v1.321.0`)
2. Get that tag's commit SHA (via `gh api repos/<owner>/<repo>/tags` or the GitHub UI)
3. Pin with `uses: owner/repo@<full-40-char-sha>`
4. Optionally append the human-readable version as a comment, e.g. `# v1.321.0`

### Accepted Pattern

```yaml
- name: Set up Ruby
  uses: ruby/setup-ruby@95ef2b042f9d7a56d8268cba8559e2842e2ad01b # v1.321.0
```
