# Agent Instructions: Project Seed

> Generated from monozen-skills/templates/AGENTS.md
> Customize for each project's needs.

## Code Quality & Readability

- **Code Readability First**: Write clean, self-explanatory code. Avoid overly complicated abstractions or bloated boilerplate.
- **Concise Comments Only**: Do not write overly verbose, decorative, or state-the-obvious comments. Explain non-obvious rationale only when necessary.
- **No Em Dashes**: Never use em dashes (`—`) anywhere in skill files (`SKILL.md`), documentation, or code comments. Use standard hyphens (`-`), colons (`:`), or spaced hyphens (` - `) instead.

## Tool Usage

- Use `gh-axi` (`npx -y gh-axi`) for all GitHub operations (issues, PRs, releases, CI).
- Use `chrome-devtools-axi` (`npx -y chrome-devtools-axi`) for browser automation.
- Scope grep and file search to the project directory - avoid system dirs.
- Do not copy secret values into any output - reference `file:line` and credential type only.

## Workflow

- Run `npm run dev` (or equivalent) in a sibling pane for live reload.
- Prefer CSS and 2D canvas over WebGL/shader when the same result can be achieved at lower cost.
- Write descriptive commit messages with proper names and descriptions.
