---
name: skill-authoring
description: Meta-skill for authoring clean, runnable agent skill modules with frontmatter metadata, structured protocols, and zero em dashes.
---

# Skill Authoring Skill

> **Scope:** How to create new skills that are actually useful  -  not documentation that rots. A skill is a **runnable protocol**, not a wiki page.

---

## Skill Anatomy

Every skill MUST have:

```
.skill-name/
├── SKILL.md          # The protocol (this file)
├── scripts/          # Optional: CLI tools, validators
├── templates/        # Optional: starter files
└── test/             # Optional: skill self-tests
```

### SKILL.md Required Sections

```markdown
# Skill Name

> **Scope:** One sentence: when to load this skill.

---

## Core Concept
2-3 paragraphs. The mental model. Why this skill exists.

## Rules (Non-Negotiable)
- MUST / MUST NOT statements
- Testable criteria

## Patterns
Recurring structures with code examples

## Tools
CLI commands, APIs, keybindings

## Verification
How to prove the skill was applied correctly

## Anti-Patterns
What goes wrong when ignored

## Invocation Triggers
"Load this skill when user says X or situation Y"

## Evolution Log
Version → Change → Reason
```

---

## Creation Workflow

### 1. Extract from Repetition
> "I've explained this 3 times" → **skill candidate**

### 2. Write the Protocol First
- Rules before examples
- Verification before tools
- Anti-patterns before patterns

### 3. Make It Runnable
A skill fails if:
- ❌ Requires human judgment at every step
- ❌ Can't be verified automatically
- ❌ Has no invocation trigger

A skill succeeds if:
- ✅ Agent can follow without clarification
- ✅ `grep`/`bash` can verify compliance
- ✅ Clear "load when" conditions

### 4. Test the Skill
```bash
# Self-test: can a fresh agent use it?
npx skills add ./my-skill --skill my-skill
# Run through a scenario
```

### 5. Publish to Registry
```bash
# Push to monozen-skills repo
git add skills/my-skill
git commit -m "Add my-skill: <one-line purpose>"
git push
```

---

## Skill Quality Checklist

| Criterion | Pass | Fail |
|-----------|------|------|
| **Scope** | One sentence, specific | "Useful for development" |
| **Rules** | Imperative, testable | "Be careful with..." |
| **Verification** | Command + expected output | "Check manually" |
| **Triggers** | User phrases + code patterns | "When relevant" |
| **Evolution** | Versioned with reasons | No history |
| **Dependencies** | Explicit (other skills, tools) | Implicit |

---

## Meta-Skills (Skills for Skills)

| Skill | Purpose | Source |
|-------|---------|--------|
| `find-skills` | Discover existing skills | External (vercel-labs/skills, installed by setup.sh) |
| `skill-authoring` | This skill | This repo |
| `improve` | Audit codebase for skill opportunities | External (not installed by setup.sh) |

---

## Invocation

Load when:
- Creating a new skill
- Refining an existing skill
- Auditing skill quality
- User asks "how do I make a skill for X?"

---

## Evolution

| Version | Change |
|---------|--------|
| v1.0 | Core anatomy + creation workflow |
| v1.1 | Added quality checklist |
| v1.2 | Added meta-skills reference |