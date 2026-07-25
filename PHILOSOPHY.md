# The Monozen Engineering Philosophy

> **"Seems right is not done."**  
> Executable engineering discipline, evidence-driven verification, and cognitive persona isolation.

---

## 1. Cognitive Persona Isolation (Moon vs Sun)

Most engineering systems try to collapse debugging, architecture, visual design, and diagnostic tracing into a single visual theme or workflow mode. Monozen rejects this approach.

Engineering requires switching between two distinct cognitive modes:

```
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│          MOON (The Systemizer)         │   │            SUN (The Shaper)            │
│ ────────────────────────────────────── │   │ ────────────────────────────────────── │
│ • Mode: Diagnostic & Tracing           │   │ • Mode: Architectural Drafting         │
│ • Tool: Reticle HUD & Terminal Logs    │   │ • Tool: Drafting Pen & Vellum Canvas   │
│ • Mindset: Cold, precision-driven      │   │ • Mindset: Synthesis & Polish          │
│ • Action: Decodes & verifies state     │   │ • Action: Draws & stops when done      │
└────────────────────────────────────────┘   └────────────────────────────────────────┘
```

- **Moon** is the Systemizer. Cold precision, terminal reticles, memory cleanup audits, unit test gates (`npm test`), and hardware-level performance boundaries. It never stops monitoring.
- **Sun** is the Shaper. The technical drafting table, vellum paper, clean SVG line geometry, and scrollytelling visual narratives. It produces the technical drawing, then rests.

By decoupling these two personas at the code, theme, and lifecycle levels, every tool and script operates with unambiguous intent.

---

## 2. Epistemic Discipline: Evidence Over Hope

In agentic software development, hope is a failure mode. Saying *"the code looks right"* or *"the fix should work"* is unacceptable.

Monozen operates on strict **epistemic discipline**:

1. **TDD Prove-It Pattern**: Never write code to fix a bug until you write a failing test that reproduces it. A test that passes before your fix is applied is a broken test.
2. **Runtime Verification over Static Assumptions**: Unit tests prove logic; Chrome DevTools (`chrome-devtools-axi`) proves runtime reality. A change is not complete until its visual paint, event listeners, and memory allocation are verified in a real browser context.
3. **Zero-Hallucination Guardrails**: Always read source files before editing. Never guess function signatures or schema definitions.

---

## 3. Skills as Executable Knowledge

Documentation rots when it lives as passive wiki text, Notion pages, or inline comment sprawl.

In the Monozen ecosystem, **knowledge is authored as executable skills**:

- **A Skill is a Protocol**: It defines non-negotiable rules, anti-patterns, automated verification commands, and explicit invocation triggers.
- **Runnable Contracts**: If an AI agent or developer cannot execute a skill protocol without asking for clarification, the skill is underspecified.
- **Federated Distribution**: Authored once in `monozen-skills/skills/`, validated via automated CI, and distributed across all agent CLIs (`npx skills add`).

---

## 4. Self-Curated Compounding Discipline

Self-directed computer science education requires intense systematic structure. Every skill module, configuration script, and architecture decision in this repository represents a lesson learned from real engineering failures, captured into a permanent, reusable asset.

Knowledge is not merely acquired; it is **formalized into automated protocols that compound over time**.
