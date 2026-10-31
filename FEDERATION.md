# monozen-skills: Federation Map

> How canonical skills are federated across filesystem directories,
> and how CLI consumers resolve them.

---

## Overview

The federation is a **write-once, read-from-anywhere** model. Skills are authored canonically in this repo (`skills/`), validated through a multi-stage pipeline (frontmatter check, em-dash/machine-path bans, lock integrity, eval schemas via `npm run validate`, self-tests, gitleaks secret scan in CI), then distributed to each CLI's native skill directory via `npx skills add`. Each consumer reads from its own path. No symlinks, no shared state.

[Skills Federation mindmap](assets/monozen-skills-federation.svg)

---

## Directory Map

### `~/.agents/skills/` - 49 skills

The primary skill directory. Installed by `npx skills add` and consumed by Pi, Claude Code, OpenCode, Codex, and Cursor.

```
agents-sdk               # Cloudflare Agents SDK
alpha-loop               # Multi-agent ideation and alpha selection
asd-ste100               # Simplified Technical English with zero em dashes
axi                      # Agent eXperience Interface (TOON CLIs)
chrome-devtools-axi      # AXI-wrapped browser automation
ci-gate-recovery         # Recovery for blocked required checks and protected branches
cloudflare               # Cloudflare platform
cloudflare-email-service # Cloudflare email sending and routing
cloudflare-one           # Cloudflare One Zero Trust and SASE
cloudflare-one-migrations # Cloudflare One migration planning
code-review              # Fresh-context diff review
context-engineering      # Context budget, compaction, handoff
design-loop              # Click-to-annotate design iteration loop
design-research          # Evidence-driven design briefs and directions
durable-objects          # Cloudflare Durable Objects
failure-to-regression    # Bug -> failing check -> root cause -> durable gate
find-skills              # Agent skill discovery
gh-axi                   # AXI-wrapped GitHub CLI
git-workflow             # Commit signing and branch hygiene
git-worktree             # Isolated worktrees for parallel agents
grill-me                 # Relentless plan and design interview
grilling                 # Design-tree interview rounds
gtm-loop                 # Six-week launch and weekly growth loop
hackathon-project-optimizer # Demo-first hackathon scope, spec lock, parallel worktrees, judging
herdr                    # Herdr panes, states, recovery
lavish                   # Reviewable HTML artifacts
llm-as-verifier          # Probabilistic LLM verification
marketing-copy           # Voice-matched copy, claims, de-AI pass
monozen-portfolio        # Monozen portfolio contracts
new-project              # Project bootstrap
pi-agent                 # Pi runtime and extensions
positioning              # Positioning contract for technical products
pr-workflow              # Pull request lifecycle
production-web-audit     # Pre-deployment web audit
project-constitution     # Existing-repo AGENTS.md and feature map
quota-axi                # Provider quota windows
sandbox-sdk              # Cloudflare sandbox SDK
skill-authoring          # Skill authoring meta-skill
swiftui-expert-skill     # SwiftUI, Liquid Glass, and Apple platform UI
task-decomposition       # Atomic task breakdown
tasks-axi                # Markdown backlog manager
test-driven-dev          # Red -> green -> refactor -> verify
transitions-dev          # Production CSS transitions and micro-interactions
transitions-polish       # Motion token tuning and refinement
turnstile-spin           # Cloudflare Turnstile setup
usefulness-gate          # Problem, spike, UX test, build or kill
web-perf                 # Web performance auditing
workers-best-practices   # Cloudflare Workers best practices
wrangler                 # Cloudflare Workers CLI
```

### `~/.commandcode/skills/`  -  14 skills

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
workers-best-practices     # Cloudflare Workers best practices
wrangler                   # Cloudflare Workers CLI
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
| **Pi** | `~/.pi/agent/settings.json` `skills` array (default also discovers `~/.agents/skills/`) | herdr (panes, sessions) | Global settings.json + AGENTS.md |
| **Claude Code** | `~/.agents/skills/` + `AGENTS.md` at project root | herdr (panes, sessions) | Project-level AGENTS.md lists monozen-skills |
| **OpenCode** | `~/.agents/skills/` + `AGENTS.md` | herdr | AGENTS.md at project root |
| **Codex** | `~/.agents/skills/` + `AGENTS.md` | herdr | AGENTS.md at project root |
| **Cursor** | `~/.agents/skills/` + `AGENTS.md` + `.cursorrules` | herdr | AGENTS.md at project root |
| **Gemini** | `~/.gemini/config/skills/` + plugin skill dirs | herdr | Gemini UI config / plugin settings |

---

## Load Order

Skills are resolved from directory lists per CLI (e.g. Pi's `settings.json` `skills` string array, Cursor's plugin paths, Gemini's plugin dirs). When multiple directories contain skills with the same name, the **first path wins** (the repo's canonical `skills/` are federated into the earliest priority path so they shadow any external namesakes).

```jsonc
// Pi: ~/.pi/agent/settings.json `skills` array (also auto-discovers ~/.agents/skills)
"skills": [
  "~/.agents/skills"   // 1st priority (the directory this repo's install script targets)
]
```

---

## Skill Canonicalization

This repo is the **source of truth** for its own universal skills (`task-decomposition`, `axi`, `herdr`, `git-worktree`, `pi-agent`, `monozen-portfolio`, etc.). Skills that overlap between external directories (e.g., `design`, `banner-design` in Gemini plugin dirs) live in those external repos, not here. This repo federates its canonical set, it does not deduplicate third-party registries.

Installation per consumer is handled by `scripts/install.sh`:
- Universal skills → installed to every consumer path that needs them (`~/.agents/skills/` and friends)
- Consumer-specific skills → mentioned in the per-consumer directory block above
- `skills-lock.json` (generated by `npm run manifest`) is the canonical manifest: name, description, source, and a sha256 content hash per skill. `validate.sh` enforces that the lock is complete, orphan-free, and in sync with disk.

---

## Adding to the Federation

To add a new skill that appears in every consumer's directory:

1. Create the skill folder `skills/<name>/SKILL.md` with `name` + `description` frontmatter (name must equal the folder name).
2. Run `npm run manifest` to regenerate `skills-lock.json`, then `npm run validate && npm test && npm run verify`.
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
