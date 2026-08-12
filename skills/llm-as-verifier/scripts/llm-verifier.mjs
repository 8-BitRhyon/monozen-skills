#!/usr/bin/env node
/**
 * llm-verifier.mjs - Zero-dep Node reference implementation of the
 * LLM-as-a-Verifier framework (arXiv:2607.05391, Stanford + NVIDIA) matching
 * the semantics of the official Python package `pip install llm-verifier`
 * (github.com/llm-as-a-verifier/llm-as-verifier).
 *
 * Grounded in the actual implementation:
 *   fine_grained_reward.py - letter scale A..T (A = 20 best, T = 1 worst),
 *     logprob-expectation reward R = (1/CK) sum_c sum_k sum_g p(v_g) phi(v_g),
 *     normalized to [0,1]; directed pairwise prompts with <score_A>/<score_B>.
 *   pivot_tournament.py    - Probabilistic Pivot Tournament: ring pass over a
 *     seeded random Hamiltonian cycle, pivot selection by ring-pass w/c,
 *     pivot rounds (non-pivot vs pivot + pivot vs pivot), argmax w/c.
 *   progress.py            - progress scale A = 0% .. T = 100% (inverted),
 *     prefix-only scoring per step (ProgressTracker pattern).
 *
 * Preference between two candidates is the Bradley-Terry model (Eq. 3.2):
 *   P(a > b) = 1 / (1 + exp(-(R_a - R_b)))
 *
 * Modes:
 *   --self-check   Token-free: validates rubric + templates, exits 0/1.
 *   score          Fine-grained reward of ONE candidate (per-criterion, K
 *                  repeats). Convenience extension; the package itself only
 *                  scores directed pairs.
 *   compare        Directed pairwise rewards (R_a, R_b) for one pair, like
 *                  llm_verifier.compare().
 *   rank           Best-of-N via PPT, like llm_verifier.select().
 *   progress       Per-step progress curve (prefix-only), like ProgressTracker.
 *
 * Env (same conventions as the package):
 *   OPENAI_BASE_URL   OpenAI-compatible endpoint (vLLM/SGLang/OpenAI);
 *                     default http://localhost:8000/v1
 *   OPENAI_API_KEY    default "EMPTY" (local vLLM accepts any key)
 *   LLM_VERIFIER_URL / LLM_VERIFIER_MODEL / LLM_VERIFIER_API_KEY  overrides
 * Default model: gemini-2.5-flash (the paper's verifier). Live modes require
 * a server that exposes token-level logprobs (top_logprobs). Only --self-check
 * is wired into CI (`npm run verify`); it never calls an API.
 */

import { readFileSync, readdirSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(HERE, '..')
const DEFAULT_RUBRIC = join(SKILL_DIR, 'templates', 'rubric.json')
const PROMPT_TEMPLATE = join(SKILL_DIR, 'templates', 'prompt.md')
const OUTPUT_MARKER = 'Then output your final scores:'
const GRANULARITY = 20

const ENV_MODEL = process.env.LLM_VERIFIER_MODEL || 'gemini-2.5-flash'
const ENV_URL = process.env.LLM_VERIFIER_URL || process.env.OPENAI_BASE_URL || 'http://localhost:8000/v1'
const ENV_KEY = process.env.LLM_VERIFIER_API_KEY || process.env.OPENAI_API_KEY || 'EMPTY'

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function usage() {
  console.log(`
llm-verifier.mjs - reference LLM-as-a-Verifier CLI (arXiv:2607.05391)

Usage:
  node llm-verifier.mjs --self-check [--rubric <path>] [--verbose]
  node llm-verifier.mjs score   --candidate <path|-> [--rubric <path>] [--task <text>] [--note <text>] [--k N] [--out <path>]
  node llm-verifier.mjs compare --candidates <dir|file,file> (exactly 2) [--rubric <path>] [--task <text>] [--note <text>] [--k N] [--out <path>]
  node llm-verifier.mjs rank    --candidates <dir|file,file> [--rubric <path>] [--task <text>] [--note <text>] [--k N] [--pivots P] [--seed S] [--out <path>]
  node llm-verifier.mjs progress --steps <dir> [--rubric <path>] [--task <text>] [--k N] [--out <path>]

Options: --model M --url U --key K --timeout MS --verbose
Env: OPENAI_BASE_URL (default http://localhost:8000/v1), OPENAI_API_KEY (default EMPTY);
     LLM_VERIFIER_URL / LLM_VERIFIER_MODEL / LLM_VERIFIER_API_KEY override.
Defaults: model gemini-2.5-flash, K=8, pivots=2, seed=0.
`)
}

function parseArgs(argv) {
  const VALUE_FLAGS = new Set(['--k', '--pivots', '--seed', '--rubric', '--candidate', '--candidates', '--steps', '--task', '--note', '--out', '--model', '--url', '--key', '--timeout'])
  const opts = {
    k: 8,
    pivots: 2,
    seed: 0,
    rubric: '',
    candidate: '',
    candidates: '',
    steps: '',
    task: '',
    note: '',
    out: '',
    timeout: 0,
    verbose: false,
    model: ENV_MODEL,
    url: ENV_URL,
    key: ENV_KEY
  }
  const mode = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--self-check') {
      mode.push('self-check')
    } else if (a === 'score' || a === 'compare' || a === 'rank' || a === 'progress') {
      mode.push(a)
    } else if (a.startsWith('--')) {
      const eq = a.indexOf('=')
      const k = eq >= 0 ? a.slice(0, eq) : a
      let v = eq >= 0 ? a.slice(eq + 1) : undefined
      if (v === undefined && VALUE_FLAGS.has(k)) v = argv[++i]
      switch (k) {
        case '--k':
          opts.k = parseInt(v, 10)
          if (!Number.isInteger(opts.k) || opts.k < 1) { console.error('[llm-verifier] --k must be a positive integer'); process.exit(2) }
          break
        case '--pivots':
          opts.pivots = parseInt(v, 10)
          if (!Number.isInteger(opts.pivots) || opts.pivots < 1) { console.error('[llm-verifier] --pivots must be a positive integer'); process.exit(2) }
          break
        case '--seed': opts.seed = parseInt(v, 10) || 0; break
        case '--rubric': opts.rubric = v; break
        case '--candidate': opts.candidate = v; break
        case '--candidates': opts.candidates = v; break
        case '--steps': opts.steps = v; break
        case '--task': opts.task = v; break
        case '--note': opts.note = v; break
        case '--out': opts.out = v; break
        case '--model': opts.model = v; break
        case '--url': opts.url = v; break
        case '--key': opts.key = v; break
        case '--timeout': opts.timeout = parseInt(v, 10) || 0; break
        case '--verbose': opts.verbose = true; break
        default:
          console.error('[llm-verifier] unknown flag: ' + k)
          process.exit(2)
      }
    } else {
      console.error('[llm-verifier] unexpected argument: ' + a)
      process.exit(2)
    }
  }
  return { mode, opts }
}

// ---------------------------------------------------------------------------
// Rubric + scales
// ---------------------------------------------------------------------------

function validateRubric(raw) {
  let r
  try {
    r = JSON.parse(raw)
  } catch (e) {
    throw new Error('rubric is not valid JSON: ' + e.message)
  }
  const scale = r && r.scale
  const criteria = r && r.criteria
  const errors = []
  if (!scale || !Array.isArray(scale.tokens) || !Array.isArray(scale.values) || scale.tokens.length !== scale.values.length || scale.tokens.length < 2) {
    errors.push('scale.tokens and scale.values must be equal-length arrays of length >= 2')
  }
  if (!Array.isArray(criteria) || criteria.length === 0) {
    errors.push('criteria must be a non-empty array')
  } else {
    if (criteria.length > 5) errors.push('keep criteria <= 5 to limit prompt complexity')
    for (const c of criteria) {
      if (!c.id && !c.name) errors.push('each criterion needs an id or name')
      if (!c.description && !c.prompt) errors.push('each criterion needs a description or prompt')
      if (typeof c.weight !== 'number') errors.push('each criterion needs a numeric weight')
    }
    const w = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0)
    if (Math.abs(w - 1) > 0.01) errors.push('criteria weights must sum to 1 (got ' + w.toFixed(3) + ')')
  }
  if (errors.length) throw new Error('invalid rubric: ' + errors.join('; '))
  return r
}

function readRubric(path) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    throw new Error('rubric not readable: ' + path)
  }
  return validateRubric(raw)
}

function buildScaleMap(scale) {
  // A..T with phi(v) values (20..1 by default); case-insensitive token match.
  const byToken = new Map()
  for (let i = 0; i < scale.tokens.length; i++) byToken.set(String(scale.tokens[i]).toUpperCase(), Number(scale.values[i]))
  const vals = [...byToken.values()]
  return { byToken, min: Math.min(...vals), max: Math.max(...vals) }
}

// Progress scale is INVERTED relative to the reward scale: A = 0% progress,
// T = 100% progress (matches llm_verifier.progress.LETTER_TO_VALUE).
function progressScaleMap() {
  const byToken = new Map()
  const letters = 'ABCDEFGHIJKLMNOPQRST'
  for (let i = 0; i < GRANULARITY; i++) byToken.set(letters[i], i / (GRANULARITY - 1))
  return { byToken, min: 0, max: 1 }
}

// ---------------------------------------------------------------------------
// Prompts (mirror llm_verifier.prompts / fine_grained_reward.build_prompt)
// ---------------------------------------------------------------------------

let cachedTemplate = null
function getTemplate() {
  if (cachedTemplate === null) cachedTemplate = readFileSync(PROMPT_TEMPLATE, 'utf8')
  return cachedTemplate
}

function fillTemplateHead(task, crit, a, b, note) {
  const tpl = getTemplate()
  const idx = tpl.indexOf(OUTPUT_MARKER)
  const head = idx >= 0 ? tpl.slice(0, idx + OUTPUT_MARKER.length) : tpl
  const name = crit.name || crit.id || ''
  const description = crit.description || crit.prompt || ''
  return head
    .replace('{criterion_name}', name)
    .replace('{criterion_name}', name)
    .replace('{note}', note || '')
    .replace('{task}', task || '(no task provided)')
    .replace('{a}', a)
    .replace('{b}', b)
    .replace('{criterion_description}', description)
}

// Directed slot prompt: ends right before the requested tag so the single
// completion token is the score letter (max_tokens=1, logprobs).
function buildSlotPrompt(task, crit, a, b, slot, note) {
  return fillTemplateHead(task, crit, a, b, note) + '\n<score_' + slot + '>'
}

// Single-trajectory variant (score mode): trajectory A only, <score_A> tag.
function buildSinglePrompt(task, crit, candidate, note) {
  return fillTemplateHead(task, crit, candidate, '(no second trajectory in this prompt)', note) + '\n<score_A>'
}

// Progress prompt (mirrors llm_verifier.progress.build_progress_prompt, one
// checkpoint): trusts observed output, not the agent's narration.
function buildProgressPrompt(task, steps) {
  const numbered = steps.map((s, i) => '=== Agent Step ' + (i + 1) + ' ===\n' + s).join('\n\n')
  return [
    'You are a strict, skeptical evaluator of agent task attempts. Trust observed output - NOT the agent\'s narration.',
    '',
    '**Task instruction:**',
    task || '(no task provided)',
    '',
    '**Agent trajectory (' + steps.length + ' agent steps; each step is one action with its observed output):**',
    numbered,
    '',
    'You will score the trajectory at 1 CHECKPOINT. The score measures exactly ONE thing:',
    '  "Given everything the agent has done up to and including this step, would the agent\'s CURRENT state actually satisfy the task\'s hidden grader?"',
    '',
    'Use the 20-letter A..T progress scale:',
    '  A = certainly NO progress yet, or a clearly wrong path',
    '  H-M = uncertain, a plausible solution is taking shape',
    '  T = essentially certain the task is complete (verified output matches)',
    '',
    'CRITICAL CALIBRATION: effort, exploration, step count, and confident narration are NOT progress.',
    '',
    'Output EXACTLY one line:',
    '<c1>LETTER</c1>',
    '',
    'where LETTER is a single letter from A to T.'
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Verifier calls: OpenAI-compatible chat completions with token logprobs
// ---------------------------------------------------------------------------

async function callVerifier(prompt, opts, topN) {
  const timeoutMs = opts.timeout > 0 ? opts.timeout : Number(process.env.LLM_VERIFIER_TIMEOUT) || 60000
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  const baseBody = {
    model: opts.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1,
    temperature: 1.0,
    logprobs: true,
    top_logprobs: Math.min(20, topN)
  }
  const post = async (body) => {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + opts.key },
      body: JSON.stringify(body),
      signal: ac.signal
    })
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      throw new Error('verifier API error ' + res.status + ': ' + bodyText.slice(0, 300))
    }
    return res.json()
  }
  try {
    // vLLM/SGLang: skip hybrid thinking so the score tag comes fast; the
    // package tries this first and falls back if unsupported.
    try {
      return await post({ ...baseBody, chat_template_kwargs: { enable_thinking: false } })
    } catch {
      return await post(baseBody)
    }
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('verifier API timed out after ' + timeoutMs + 'ms')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// Expected score at the tag position: expectation over the scale-token
// distribution from top_logprobs, normalized to [0,1]. Mirrors
// fine_grained_reward.extract_score: strip token whitespace / leading '>'
// (BPE merges like '>B'), match scale letters case-insensitively, keep the
// max probability per value, then E[v] with linear normalization. Returns
// null when no scale token is visible (caller falls back to 0.5).
function expectationFromLogprobs(choice, scaleMap) {
  const lp = choice && choice.logprobs
  let list = null
  if (lp && Array.isArray(lp.content) && lp.content[0] && Array.isArray(lp.content[0].top_logprobs)) {
    list = lp.content[0].top_logprobs
  } else if (lp && Array.isArray(lp.top_logprobs) && lp.top_logprobs[0]) {
    list = lp.top_logprobs[0]
  } else if (Array.isArray(lp) && lp[0] && Array.isArray(lp[0].top_logprobs)) {
    list = lp[0].top_logprobs
  }
  if (!list) return null
  const byValue = new Map()
  for (const t of list) {
    let s = String(t.token || '').replace(/^>+/, '').trim()
    if (!s) continue
    const c = s[0].toUpperCase()
    if (scaleMap.byToken.has(c)) {
      const value = scaleMap.byToken.get(c)
      const p = Math.exp(t.logprob)
      byValue.set(value, Math.max(byValue.get(value) || 0, p))
    }
  }
  if (!byValue.size) return null
  const total = [...byValue.values()].reduce((s, p) => s + p, 0)
  let expected = 0
  for (const [v, p] of byValue) expected += v * p
  expected /= total
  const span = scaleMap.max - scaleMap.min || 1
  return { score: expected, normalized: (expected - scaleMap.min) / span }
}

// ---------------------------------------------------------------------------
// Scoring: directed pairwise rewards (R_a, R_b), K repeats per criterion
// ---------------------------------------------------------------------------

async function slotScore(rubric, crit, task, a, b, slot, opts, scaleMap, note) {
  const prompt = buildSlotPrompt(task, crit, a, b, slot, note)
  const data = await callVerifier(prompt, opts, scaleMap.byToken.size)
  const choice = data.choices && data.choices[0]
  if (!choice) throw new Error('verifier response has no choices')
  const r = expectationFromLogprobs(choice, scaleMap)
  return r ? r.normalized : 0.5
}

// Directed comparison: candidate a is shown in slot A, b in slot B, for every
// criterion and repeat; rewards are averaged (llm_verifier.compare). The ring
// pass in `rank` is what cancels slot bias, not this call.
async function comparePair(rubric, task, aText, bText, opts) {
  const scaleMap = buildScaleMap(rubric.scale)
  let sa = 0, sb = 0, n = 0
  for (const crit of rubric.criteria) {
    for (let r = 0; r < opts.k; r++) {
      sa += await slotScore(rubric, crit, task, aText, bText, 'A', opts, scaleMap, opts.note)
      sb += await slotScore(rubric, crit, task, aText, bText, 'B', opts, scaleMap, opts.note)
      n++
    }
  }
  return { ra: sa / n, rb: sb / n }
}

// Bradley-Terry preference from the reward difference (paper Eq. 3.2).
function bradleyTerry(ra, rb) {
  return 1 / (1 + Math.exp(-(ra - rb)))
}

// ---------------------------------------------------------------------------
// Probabilistic Pivot Tournament (mirror llm_verifier.pivot_tournament)
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function ringPairs(n, rng) {
  // Directed adjacent pairs of a random Hamiltonian cycle: every candidate
  // appears once in slot A and once in slot B, canceling positional bias.
  if (n <= 1) return []
  const perm = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  return perm.map((x, i) => [x, perm[(i + 1) % n]])
}

async function runRank(rubric, opts) {
  const candidates = loadCandidates(opts.candidates)
  const n = candidates.length
  if (n === 1) {
    return { strategy: 'probabilistic-pivot-tournament', poolSize: 1, pivotCount: 1, pivots: [candidates[0].label], pairCount: 0, ranked: [{ label: candidates[0].label, wins: 0, count: 0, score: 1 }] }
  }
  const rng = mulberry32(opts.seed)
  const ring = ringPairs(n, rng)
  const k = Math.min(Math.max(1, opts.pivots), n)
  const w = Array(n).fill(0)
  const c = Array(n).fill(0)

  // Step 1: ring pass.
  for (const [a, b] of ring) {
    const { ra, rb } = await comparePair(rubric, opts.task, candidates[a].text, candidates[b].text, opts)
    const p = bradleyTerry(ra, rb)
    w[a] += p; c[a]++
    w[b] += 1 - p; c[b]++
  }

  // Step 2: pivots = empirical leaders by ring-pass mean preference w/c.
  const order = [...Array(n).keys()].sort((i, j) => ((w[j] / c[j] || 0) - (w[i] / c[i] || 0)) || (i - j))
  const pivots = order.slice(0, k)
  const pivotSet = new Set(pivots)

  // Step 3: pivot rounds - non-pivot (slot A) vs pivot (slot B), and pivot vs
  // pivot (lower index in slot A). Aggregated into the same w, c.
  const prPairs = []
  for (let i = 0; i < n; i++) {
    if (pivotSet.has(i)) continue
    for (const p of pivots) prPairs.push([i, p])
  }
  const sortedPivots = [...pivots].sort((a, b) => a - b)
  for (let i = 0; i < sortedPivots.length; i++) {
    for (let j = i + 1; j < sortedPivots.length; j++) prPairs.push([sortedPivots[i], sortedPivots[j]])
  }
  for (const [a, b] of prPairs) {
    const { ra, rb } = await comparePair(rubric, opts.task, candidates[a].text, candidates[b].text, opts)
    const p = bradleyTerry(ra, rb)
    w[a] += p; c[a]++
    w[b] += 1 - p; c[b]++
  }

  // Step 4: selection - argmax w_i / c_i (count normalization removes the
  // bias that pivots participate in more comparisons).
  const ranked = candidates
    .map((x, i) => ({ label: x.label, wins: round(w[i]), count: c[i], score: c[i] ? round(w[i] / c[i]) : 0 }))
    .sort((x, y) => (y.score - x.score) || x.label.localeCompare(y.label))
  return {
    strategy: 'probabilistic-pivot-tournament',
    poolSize: n,
    pivotCount: pivots.length,
    pivots: pivots.map((i) => candidates[i].label),
    pairCount: ring.length + prPairs.length,
    ranked
  }
}

async function runCompare(rubric, opts) {
  const list = loadCandidates(opts.candidates)
  if (list.length !== 2) throw new Error('compare requires exactly 2 candidates (dir with 2 files, or file,file)')
  const { ra, rb } = await comparePair(rubric, opts.task, list[0].text, list[1].text, opts)
  return { a: list[0].label, b: list[1].label, ra: round(ra), rb: round(rb), preference: round(bradleyTerry(ra, rb)) }
}

async function runScore(rubric, opts) {
  if (!opts.candidate) throw new Error('score requires --candidate <path|->')
  const text = opts.candidate === '-' ? readFileSync(0, 'utf8') : readFileSync(opts.candidate, 'utf8')
  const scaleMap = buildScaleMap(rubric.scale)
  const perCriterion = []
  let composite = 0
  for (const crit of rubric.criteria) {
    const runs = []
    for (let r = 0; r < opts.k; r++) {
      const prompt = buildSinglePrompt(opts.task, crit, text, opts.note)
      const data = await callVerifier(prompt, opts, scaleMap.byToken.size)
      const choice = data.choices && data.choices[0]
      if (!choice) throw new Error('verifier response has no choices')
      const norm = expectationFromLogprobs(choice, scaleMap)
      runs.push(norm ? norm.normalized : 0.5)
    }
    const mean = runs.reduce((s, v) => s + v, 0) / runs.length
    const spread = runs.length > 1 ? Math.sqrt(runs.reduce((s, v) => s + (v - mean) ** 2, 0) / (runs.length - 1)) : 0
    perCriterion.push({ id: crit.id || crit.name, weight: crit.weight, mean: round(mean), spread: round(spread), runs: runs.map(round) })
    composite += crit.weight * mean
  }
  return {
    perCriterion,
    composite: round(composite),
    decision: decide(rubric, composite)
  }
}

// ---------------------------------------------------------------------------
// Progress tracking (mirror llm_verifier.progress.ProgressTracker): one call
// per step per repeat, prefix-only, progress scale A = 0% .. T = 100%.
// ---------------------------------------------------------------------------

async function runProgress(rubric, opts) {
  const steps = loadCandidates(opts.steps)
  const scaleMap = progressScaleMap()
  const prefix = []
  const rows = []
  for (const s of steps) {
    prefix.push(s.text)
    const prompt = buildProgressPrompt(opts.task, prefix)
    let total = 0
    for (let r = 0; r < opts.k; r++) {
      const data = await callVerifier(prompt, opts, 20)
      const choice = data.choices && data.choices[0]
      if (!choice) throw new Error('verifier response has no choices')
      const norm = expectationFromLogprobs(choice, scaleMap)
      total += norm ? norm.normalized : 0.5
    }
    rows.push({ step: s.label, progress: round(total / opts.k) })
  }
  const trend = rows.length > 1 && rows.every((r, i) => i === 0 || r.progress >= rows[i - 1].progress) ? 'rising' : 'mixed-or-falling'
  const abandon = rows.find((r) => r.progress < 0.05)
  return { steps: rows, trend, suggestedAbandonPoint: abandon ? abandon.step : null }
}

function decide(rubric, composite) {
  if (composite >= (rubric.passThreshold ?? 0.8)) return 'pass'
  if (composite >= (rubric.reviewThreshold ?? 0.6)) return 'review'
  return 'fail'
}

function loadCandidates(spec) {
  const out = []
  if (!spec) throw new Error('--candidates <dir|file,file> or --steps <dir> is required')
  if (existsSync(spec) && statSync(spec).isDirectory()) {
    const files = readdirSync(spec).filter((f) => /\.(txt|md|jsonl|out|log)$/i.test(f)).sort()
    for (const f of files) out.push({ label: f, text: readFileSync(join(spec, f), 'utf8') })
  } else {
    for (const p of spec.split(',')) {
      if (!p.trim()) continue
      if (!existsSync(p)) throw new Error('candidate not found: ' + p)
      out.push({ label: basename(p), text: readFileSync(p, 'utf8') })
    }
  }
  if (!out.length) throw new Error('no candidates found in ' + spec)
  return out
}

// ---------------------------------------------------------------------------
// Token-free self-check (the only mode that runs in CI)
// ---------------------------------------------------------------------------

function selfCheck(opts) {
  const fails = []
  const ok = (cond, msg) => {
    if (cond) console.log('  [ok] ' + msg)
    else {
      console.log('  [FAIL] ' + msg)
      fails.push(msg)
    }
  }
  const rubricPath = opts.rubric || DEFAULT_RUBRIC
  ok(existsSync(rubricPath), 'rubric exists: ' + rubricPath)
  let rubric = null
  if (existsSync(rubricPath)) {
    try {
      rubric = readRubric(rubricPath)
      ok(true, 'rubric parses and schema is valid')
      const scale = buildScaleMap(rubric.scale)
      ok(scale.byToken.get('A') > scale.byToken.get('T'), 'scale is ordered A (best) > T (worst)')
    } catch (e) {
      ok(false, 'rubric invalid: ' + e.message)
    }
  }
  ok(existsSync(PROMPT_TEMPLATE), 'prompt template exists: ' + PROMPT_TEMPLATE)
  if (existsSync(PROMPT_TEMPLATE)) {
    const tpl = readFileSync(PROMPT_TEMPLATE, 'utf8')
    for (const ph of ['{task}', '{a}', '{b}', '{note}', '{criterion_name}', '{criterion_description}']) {
      ok(tpl.includes(ph), 'prompt template has placeholder ' + ph)
    }
    ok(tpl.includes(OUTPUT_MARKER), 'prompt template has output marker')
    ok(tpl.includes('<score_A>') && tpl.includes('<score_B>'), 'prompt template has score_A and score_B tags')
  }
  if (rubric) {
    const hash = createHash('sha256').update(readFileSync(rubricPath, 'utf8')).digest('hex')
    console.log('  [info] rubric sha256: ' + hash.slice(0, 16))
    if (opts.verbose) {
      const crit = rubric.criteria[0]
      console.log('  [info] slot prompt preview:\n' + buildSlotPrompt('example task', crit, 'candidate A', 'candidate B', 'A', 'example note').slice(0, 700))
      console.log('  [info] progress prompt preview:\n' + buildProgressPrompt('example task', ['step 1', 'step 2']).slice(0, 700))
    }
  }
  if (fails.length) {
    console.error('self-check FAILED: ' + fails.join('; '))
    process.exit(1)
  }
  console.log('self-check PASS: token-free verifier reference is runnable')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function round(n) {
  return Math.round(n * 1000) / 1000
}

async function main() {
  const { mode, opts } = parseArgs(process.argv.slice(2))
  if (mode.length === 1 && mode[0] === 'self-check') {
    selfCheck(opts)
    return
  }
  if (mode.length === 0) {
    usage()
    process.exit(2)
  }
  const rubricPath = opts.rubric || DEFAULT_RUBRIC
  const rubricRaw = readFileSync(rubricPath, 'utf8')
  const rubric = validateRubric(rubricRaw)
  const rubricHash = createHash('sha256').update(rubricRaw).digest('hex').slice(0, 16)
  let result
  if (mode.includes('rank')) {
    result = await runRank(rubric, opts)
  } else if (mode.includes('compare')) {
    result = await runCompare(rubric, opts)
  } else if (mode.includes('score')) {
    result = await runScore(rubric, opts)
  } else if (mode.includes('progress')) {
    result = await runProgress(rubric, opts)
  } else {
    usage()
    process.exit(2)
  }
  const json = JSON.stringify(
    {
      schema: 'llm-verifier-result/v1',
      model: opts.model,
      rubricHash,
      k: opts.k,
      ...result
    },
    null,
    opts.verbose ? 2 : 0
  )
  if (opts.out) writeFileSync(opts.out, json + '\n')
  else console.log(json)
}

main().catch((e) => {
  console.error('[llm-verifier] ' + (e && e.message ? e.message : String(e)))
  process.exit(1)
})
