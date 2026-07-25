# Prompt Engineering Loop Skill

> **Scope:** Universal 6-step protocol for extracting maximum quality from any LLM interaction. Turns one-shot prompts into iterative, compounding excellence loops.

---

## The 6-Step Loop (Memorize → Internalize → Automate)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ELI10              │  2. 5 QUESTIONS        │  3. SHOW>TELL │
│  Explain Like I'm 10  │  Clarify + Expand      │  Examples >   │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. MEMORY/SKILL       │  5. SPARRING PARTNER   │  6. LOOP ENG  │
│  DRY → Compound Skills │  Pressure Test Ideas   │  Iterate to   │
└─────────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   COMPOUND    │
                    │  EXCELLENCE   │
                    └───────────────┘
```

---

## Step 1: ELI10 — Explain Like I'm 10

**Principle:** If you can't explain it simply, you don't understand it well enough. Force the LLM to build the mental model from ground up.

### Template
```
"Explain [topic] like I'm 10. Walk me through step-by-step.
No jargon without definition. Use concrete analogies.
Assume I know the basics of [adjacent field] but NOT [this field]."
```

### Why It Works
- Exposes hidden assumptions in YOUR understanding
- Forces LLM to use first-principles reasoning
- Creates shared vocabulary for steps 2-6
- Reveals gaps before they compound

### Anti-Pattern
> "Make this viral" / "Solidify the pipeline" / "Best practice this"
→ **Vague adjectives = vague output**

---

## Step 2: Five Clarifying Questions

**Principle:** Context is everything. The LLM knows nothing about your constraints, preferences, or success criteria unless you tell it.

### Protocol
After ELI10, ask the LLM to generate **5 clarifying questions** it needs answered to produce excellent output.

### Template
```
"Before you produce anything, ask me 5 clarifying questions that would
significantly improve your output. Focus on:
1. Constraints (time, budget, tech stack, compliance)
2. Success criteria (what does 'done' look like?)
3. Preferences (style, tone, architecture patterns)
4. Risks (what could go wrong?)
5. Context (who uses this? what's the lifecycle?)"
```

### Why 5?
- 3 = too shallow
- 7 = diminishing returns
- 5 = forces prioritization of highest-impact unknowns

### Your Job
Answer thoroughly. The LLM's output quality ∝ your answer quality.

---

## Step 3: Show, Don't Tell — Working Examples

**Principle:** Adjectives are subjective. Examples are objective. One working example > 100 adjectives.

### What to Provide
| Instead of Saying... | Provide... |
|---------------------|------------|
| "Make it viral" | A specific post that went viral + why |
| "Best presentation" | A deck you admire + what makes it work |
| "Solid pipeline" | A CI/CD config that works + tradeoffs |
| "Clean code" | A file from your codebase you consider clean |

### Protocol
```
"Here's an example of what I consider excellent: [link/file/paste].
Specifically, I like: [concrete attributes].
My output should match this quality level and these attributes."
```

### If You Have No Example
```
"I don't have a perfect example. Here are 3 references that each
capture PART of what I want: [ref1 for X, ref2 for Y, ref3 for Z].
Synthesize the common excellence pattern."
```

---

## Step 4: Memory/Skill — DRY Your Prompting

**Principle:** Don't Repeat Yourself. Every recurring prompt pattern becomes a skill. Compound excellence across sessions.

### The Loop
```
Chat 1: Solve problem → Extract pattern → Create skill
Chat 2: Load skill → Solve faster → Refine skill
Chat N: Skill evolves → Tailored to YOUR workflow
```

### When to Skill-ify
- You've asked for this pattern 3+ times
- The prompt has >5 specific constraints
- You'll need this again in different contexts
- The output quality is high and reproducible

### Skill Creation Template
```markdown
# [Name] Skill

> **Scope:** When to load this skill (specific trigger phrases + contexts)

## Protocol
Step-by-step instructions the LLM follows

## Constraints
MUST / MUST NOT rules

## Examples
2-3 working input/output pairs

## Verification
How to prove it worked

## Anti-Patterns
What goes wrong when ignored
```

### Your Personal Skill Registry
- `monozen-workflow` — your portfolio engineering loop
- `prompt-engineering-loop` — THIS skill (meta!)
- `[your-next-skill]` — extract from your next repetitive task

---

## Step 5: AI as Sparring Partner — Pressure Test Everything

**Principle:** LLMs are sycophantic by default (they want to please you). You need a **critic**, not a cheerleader.

### How to Activate Sparring Mode
```
"Act as my sparring partner. Your job is to FIND FLAWS in my thinking.
Pressure test every assumption. Ask 'what if X goes wrong?'
Challenge my constraints. Point out blind spots.
Be ruthless. My ego is not the priority — the outcome is."
```

### Sparring Checklist (LLM Must Cover)
- [ ] **Assumption audit:** "You assume X. What if X is false?"
- [ ] **Edge cases:** "What happens at 0? At 10000? At null?"
- [ ] **Failure modes:** "How does this fail silently? Loudly?"
- [ ] **Alternative approaches:** "Why not Y? What's the tradeoff?"
- [ ] **Maintenance burden:** "Who maintains this in 6 months?"
- [ ] **Security/Compliance:** "What did we miss on auth/data/privacy?"

### The Ego Tax
You will feel defensive. Good. That's the signal you're hitting a blind spot.
**Lean in.** The best ideas survive the beating.

---

## Step 6: Loop Engineering — Iterate Until Spec Met

**Principle:** Don't stop at "looks good." Stop at "verified against spec." Make the LLM do the iteration.

### The Loop Contract
```
"Don't stop until [SPECIFIC VERIFIABLE OUTCOME] is achieved.
Here's how YOU verify each iteration:
1. Run: [command/test/check]
2. Check: [specific assertion]
3. If FAIL: analyze root cause, fix, repeat
4. If PASS: confirm, then STOP

Do NOT ask me to verify. YOU run the loop. Report only final result."
```

### Verification Ladder (Escalating Rigor)
| Level | Method | Use For |
|-------|--------|---------|
| 1 | LLM self-check | Syntax, formatting, basic logic |
| 2 | Static analysis | Lint, typecheck, schema validation |
| 3 | Unit tests | `npm test` — logic correctness |
| 4 | Integration tests | API contracts, DB migrations |
| 5 | Browser automation | `chrome-devtools-axi` — visual/runtime |
| 6 | Deploy preview | Real URL + `curl` + smoke test |
| 7 | Production canary | Real users, metrics, rollback ready |

### Bundle with Skills
```
"Use skill:prompt-engineering-loop + skill:monozen-workflow + skill:chrome-devtools-axi
Run the full loop: ELI10 → 5Q → Example → Load Skills → Spar → Loop to Level 6"
```

### Daily Report Integration
```
"Run this loop daily on [recurring task]. Produce report:
- What was the input?
- What 5 questions clarified it?
- What example guided it?
- What skill was loaded/created?
- What sparring revealed?
- How many iterations to Level 6?
- Time saved vs manual?"
```

---

## Complete Invocation (Copy-Paste Ready)

```
I want to use the Prompt Engineering Loop (6 steps).

STEP 1 - ELI10: Explain [MY TOPIC] like I'm 10. Step-by-step, no unexplained jargon.

STEP 2 - 5 QUESTIONS: Ask me 5 clarifying questions that would significantly improve your output. Cover constraints, success criteria, preferences, risks, context.

STEP 3 - SHOW DON'T TELL: I'll provide [EXAMPLE/REFERENCES]. You synthesize the excellence pattern.

STEP 4 - MEMORY/SKILL: Load relevant skills: [skill1, skill2]. If pattern is new, we'll create a skill after.

STEP 5 - SPARRING: Pressure test my approach. Find flaws, challenge assumptions, propose alternatives. Be ruthless.

STEP 6 - LOOP ENGINEERING: Don't stop until [SPECIFIC VERIFIABLE OUTCOME]. You run verification at Level [1-7]. Report only final result.

BEGIN.
```

---

## Skill Quality Checklist (Self-Apply)

| Step | Done? | Evidence |
|------|-------|----------|
| 1. ELI10 | ☐ | LLM produced ground-up explanation |
| 2. 5 Questions | ☐ | 5 specific questions asked + answered |
| 3. Example | ☐ | Concrete reference provided + attributes extracted |
| 4. Skills | ☐ | Relevant skills loaded OR new skill created |
| 5. Sparring | ☐ | At least 3 assumptions challenged + resolved |
| 6. Loop | ☐ | Verified at Level ≥3, iteration count logged |

---

## Evolution Log

| Version | Change | Trigger |
|---------|--------|---------|
| v1.0 | 6-step loop codified from user workflow | "I keep repeating this pattern" |
| v1.1 | Added verification ladder + daily report | Need measurable rigor |
| v1.2 | Added sparring checklist + ego tax | Sycophancy catching blind spots |
| v1.3 | Added skill creation template + registry | Compound excellence across chats |

---

**This skill IS the loop.** Load it → Run it → Create the next skill → Compound forever.