#!/usr/bin/env node
/**
 * llm-verifier.mjs - Reference implementation of the LLM-as-a-Verifier
 * framework from the Stanford + NVIDIA paper, arXiv:2607.05391.
 *
 * Core idea: standard LM judges emit ONE discrete score token, collapsing the
 * scoring distribution and inflating ties. This tool instead requests the
 * token distribution (logprobs) over a fixed fine-grained scale and computes
 * the EXPECTATION over the scale tokens, yielding continuous scores that
 * separate good from bad solutions.
 *
 * Scaling axes (the paper):
 *   G - score granularity (20 levels, tokens A..T)
 *   C - criteria decomposition (weighted rubric)
 *   K - repeated evaluation (average over K runs, report spread)
 *
 * Modes:
 *   --self-check   Token-free: validates rubric + prompt template, exits 0/1.
 *   score          Score one candidate against a rubric (live API calls).
 *   rank           Pivot tournament over a candidate pool (live API calls).
 *   progress       Per-step scores to track agent task progress (live API).
 *
 * Env:
 *   LLM_VERIFIER_URL     OpenAI-compatible chat completions endpoint.
 *   LLM_VERIFIER_MODEL   Verifier model id.
 *   LLM_VERIFIER_API_KEY API key (required only for live modes).
 *
 * Zero runtime dependencies (Node >= 18 for global fetch). Deterministic by
 * default: fixed rubric, fixed token scheme, temperature 0. Live modes never
 * run in CI; only --self-check is wired into the gate (npm run verify).
 */

import { readFileSync, readdirSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(HERE, '..')
const DEFAULT_RUBRIC = join(SKILL_DIR, 'templates', 'rubric.json')
const PROMPT_TEMPLATE = join(SKILL_DIR, 'templates', 'prompt.md')

const ENV_URL = process.env.LLM_VERIFIER_URL || 'https://api.openai.com/v1/chat/completions'
const ENV_MODEL = process.env.LLM_VERIFIER_MODEL || 'gpt-4o-mini'

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function usage() {
  console.log(`
llm-verifier.mjs - reference LLM-as-a-Verifier CLI (arXiv:2607.05391)

Usage:
  node llm-verifier.mjs --self-check [--rubric <path>] [--verbose]
  node llm-verifier.mjs score --candidate <path|-> [--rubric <path>] [--task <text>] [--k N] [--out <path>] [--model M]
  node llm-verifier.mjs rank --candidates <dir|file,file> [--rubric <path>] [--task <text>] [--k N] [--pivots P] [--out <path>]
  node llm-verifier.mjs progress --steps <dir> [--rubric <path>] [--task <text>] [--k N] [--out <path>]

Env: LLM_VERIFIER_URL, LLM_VERIFIER_MODEL, LLM_VERIFIER_API_KEY
`)
}

function parseArgs(argv) {
  const VALUE_FLAGS = new Set(['--k', '--pivots', '--rubric', '--candidate', '--candidates', '--steps', '--task', '--out', '--model', '--url', '--key', '--timeout'])
  const opts = {
    k: 3,
    pivots: 0,
    rubric: '',
    candidate: '',
    candidates: '',
    steps: '',
    task: '',
    out: '',
    timeout: 0,
    verbose: false,
    model: ENV_MODEL,
    url: ENV_URL,
    key: process.env.LLM_VERIFIER_API_KEY || ''
  }
  const mode = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--self-check') {
      mode.push('self-check')
    } else if (a === 'score' || a === 'rank' || a === 'progress') {
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
          if (!Number.isInteger(opts.pivots) || opts.pivots < 0) { console.error('[llm-verifier] --pivots must be a non-negative integer'); process.exit(2) }
          break
        case '--rubric': opts.rubric = v; break
        case '--candidate': opts.candidate = v; break
        case '--candidates': opts.candidates = v; break
        case '--steps': opts.steps = v; break
        case '--task': opts.task = v; break
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
// Rubric + prompt
// ---------------------------------------------------------------------------

function validateRubric(raw, path) {
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
      if (!c.id || !c.prompt) errors.push('each criterion needs id and prompt')
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
  return validateRubric(raw, path)
}

function buildScaleMap(scale) {
  const map = new Map()
  for (let i = 0; i < scale.tokens.length; i++) map.set(scale.tokens[i], Number(scale.values[i]))
  const vals = [...map.values()]
  return {
    tokens: [...map.keys()],
    values: vals,
    min: Math.min(...vals),
    max: Math.max(...vals)
  }
}

let cachedTemplate = null
function compilePrompt(rubric, crit, task, candidate) {
  if (cachedTemplate === null) cachedTemplate = readFileSync(PROMPT_TEMPLATE, 'utf8')
  return cachedTemplate
    .replace('{task}', task || '(no task provided)')
    .replace('{weight}', String(crit.weight))
    .replace('{crit_prompt}', crit.prompt)
    .replace('{candidate}', candidate)
}

function pairPrompt(task, crit, left, right) {
  // Pairwise comparison for pivot tournament: one token, L or R.
  // The caller alternates left/right placement per criterion to cancel
  // positional bias, mirroring the paper's random ring pass.
  return [
    'You are a verifier. Compare the two candidates against ONE criterion.',
    'Respond with EXACTLY one token: L if the LEFT candidate is better,',
    'R if the RIGHT candidate is better.',
    '',
    'TASK',
    task || '(no task provided)',
    '',
    'CRITERION',
    crit.prompt,
    '',
    'LEFT CANDIDATE',
    left,
    '',
    'RIGHT CANDIDATE',
    right
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Probabilistic fine-grained scoring (expectation over scoring-token logits)
// ---------------------------------------------------------------------------

async function callVerifier(prompt, opts, topN) {
  if (!opts.key) {
    throw new Error('LLM_VERIFIER_API_KEY is required for live scoring; --self-check is the token-free mode')
  }
  const timeoutMs = opts.timeout > 0 ? opts.timeout : Number(process.env.LLM_VERIFIER_TIMEOUT) || 60000
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + opts.key },
      body: JSON.stringify({
        model: opts.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1,
        temperature: 0,
        logprobs: true,
        top_logprobs: Math.min(20, topN)
      }),
      signal: ac.signal
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error('verifier API error ' + res.status + ': ' + body.slice(0, 300))
    }
    return res.json()
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('verifier API timed out after ' + timeoutMs + 'ms')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

function expectationFromLogprobs(choice, scaleMap) {
  // OpenAI-compatible logprobs shapes:
  //   A) choices[0].logprobs.content[0].top_logprobs = [{token, logprob}] (chat)
  //   B) choices[0].logprobs.top_logprobs[0] (legacy completions)
  //   C) choices[0].logprobs[0].top_logprobs (completions n=1)
  const lp = choice && choice.logprobs
  let list = null
  if (lp && Array.isArray(lp.content) && lp.content[0] && Array.isArray(lp.content[0].top_logprobs)) {
    list = lp.content[0].top_logprobs
  } else if (lp && Array.isArray(lp.top_logprobs) && lp.top_logprobs[0]) {
    list = lp.top_logprobs[0]
  } else if (Array.isArray(lp) && lp[0] && Array.isArray(lp[0].top_logprobs)) {
    list = lp[0].top_logprobs
  }
  const visible = {}
  if (list) for (const t of list) visible[t.token] = t.logprob

  // Expectation over the scale tokens present in the visible distribution.
  const parts = []
  for (const tok of scaleMap.tokens) {
    const lpVal = visible[tok]
    if (lpVal !== undefined) parts.push({ token: tok, value: scaleMap.values[scaleMap.tokens.indexOf(tok)], logprob: lpVal })
  }
  if (!parts.length) {
    throw new Error('verifier did not emit scale tokens (top_logprobs unavailable); check backend logprobs support')
  }
  const z = parts.reduce((s, p) => s + Math.exp(p.logprob), 0)
  let score = 0
  for (const p of parts) score += (Math.exp(p.logprob) / z) * p.value
  const norm = scaleMap.max - scaleMap.min || 1
  return { score, normalized: (score - scaleMap.min) / norm }
}

function decide(rubric, composite) {
  if (composite >= (rubric.passThreshold ?? 0.8)) return 'pass'
  if (composite >= (rubric.reviewThreshold ?? 0.6)) return 'review'
  return 'fail'
}

async function scoreOneCriterion(rubric, crit, task, candidate, opts, scaleMap) {
  const prompt = compilePrompt(rubric, crit, task, candidate)
  const data = await callVerifier(prompt, opts, scaleMap.tokens.length)
  const choice = data.choices && data.choices[0]
  if (!choice) throw new Error('verifier response has no choices')
  return expectationFromLogprobs(choice, scaleMap)
}

async function scoreCandidate(rubric, task, candidate, opts) {
  const scaleMap = buildScaleMap(rubric.scale)
  const perCriterion = []
  let composite = 0
  for (const crit of rubric.criteria) {
    const runs = []
    for (let r = 0; r < opts.k; r++) {
      const { normalized } = await scoreOneCriterion(rubric, crit, task, candidate, opts, scaleMap)
      runs.push(normalized)
    }
    const mean = runs.reduce((s, v) => s + v, 0) / runs.length
    const spread = runs.length > 1 ? Math.sqrt(runs.reduce((s, v) => s + (v - mean) ** 2, 0) / (runs.length - 1)) : 0
    perCriterion.push({ id: crit.id, weight: crit.weight, mean: round(mean), spread: round(spread), runs: runs.map(round) })
    composite += crit.weight * mean
  }
  return {
    perCriterion,
    composite: round(composite),
    decision: decide(rubric, composite)
  }
}

// ---------------------------------------------------------------------------
// Pivot tournament ranking (cost-efficient, O(N x sqrt(N)) pairwise)
// ---------------------------------------------------------------------------

async function comparePair(rubric, task, left, right, opts) {
  // Weighted P(candidate beats pivot) across ALL criteria, so the pairwise
  // stage ranks on the same basis as the pivot composite. Left/right placement
  // alternates per criterion to cancel positional bias.
  const map = { tokens: ['L', 'R'], values: [1, 0], min: 0, max: 1 }
  let total = 0
  for (let i = 0; i < rubric.criteria.length; i++) {
    const crit = rubric.criteria[i]
    const candidateLeft = i % 2 === 0
    const prompt = pairPrompt(task, crit, candidateLeft ? left : right, candidateLeft ? right : left)
    const data = await callVerifier(prompt, opts, 2)
    const choice = data.choices && data.choices[0]
    if (!choice) throw new Error('verifier response has no choices')
    const pLeft = expectationFromLogprobs(choice, map).score
    total += crit.weight * (candidateLeft ? pLeft : 1 - pLeft)
  }
  return total
}

function loadCandidates(spec) {
  const out = []
  if (!spec) throw new Error('--candidates <dir|file,file> is required')
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

async function runRank(rubric, opts) {
  const labels = loadCandidates(opts.candidates)
  const N = labels.length
  const pivotCount = opts.pivots > 0 ? opts.pivots : Math.max(1, Math.ceil(Math.sqrt(N)))
  const sampleSize = Math.min(N, Math.max(2, Math.ceil(2 * Math.sqrt(N))))
  const sample = labels.slice(0, sampleSize)
  const scored = []
  for (const s of sample) {
    scored.push({ label: s.label, text: s.text, result: await scoreCandidate(rubric, opts.task, s.text, opts) })
  }
  scored.sort((a, b) => b.result.composite - a.result.composite)
  const pivots = scored.slice(0, Math.min(pivotCount, scored.length))
  const pivotLabels = new Set(pivots.map((p) => p.label))
  const rest = labels.filter((c) => !pivotLabels.has(c.label))
  const restScores = []
  for (const c of rest) {
    let wins = 0
    for (const p of pivots) wins += await comparePair(rubric, opts.task, c.text, p.text, opts)
    restScores.push({ label: c.label, winScore: round(wins / Math.max(1, pivots.length)) })
  }
  restScores.sort((a, b) => b.winScore - a.winScore)
  return {
    strategy: 'pivot-tournament',
    poolSize: N,
    pivots: pivots.map((p) => ({ label: p.label, composite: p.result.composite, decision: p.result.decision })),
    ranked: [
      ...pivots.map((p) => ({ label: p.label, composite: p.result.composite, decision: p.result.decision })),
      ...restScores
    ]
  }
}

async function runProgress(rubric, opts) {
  const steps = loadCandidates(opts.steps)
  const rows = []
  for (const s of steps) {
    const result = await scoreCandidate(rubric, opts.task, s.text, opts)
    rows.push({ step: s.label, composite: result.composite, decision: result.decision })
  }
  const abandon = rows.find((r) => r.decision === 'fail')
  const trend = rows.length > 1 && rows.every((r, i) => i === 0 || r.composite >= rows[i - 1].composite) ? 'rising' : 'mixed-or-falling'
  return { steps: rows, trend, suggestedAbandonPoint: abandon ? abandon.step : null }
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
    } catch (e) {
      ok(false, 'rubric invalid: ' + e.message)
    }
  }
  ok(existsSync(PROMPT_TEMPLATE), 'prompt template exists: ' + PROMPT_TEMPLATE)
  if (existsSync(PROMPT_TEMPLATE)) {
    const tpl = readFileSync(PROMPT_TEMPLATE, 'utf8')
    for (const ph of ['{task}', '{candidate}', '{crit_prompt}', '{weight}']) {
      ok(tpl.includes(ph), 'prompt template has placeholder ' + ph)
    }
  }
  if (rubric) {
    const hash = createHash('sha256').update(readFileSync(rubricPath, 'utf8')).digest('hex')
    console.log('  [info] rubric sha256: ' + hash.slice(0, 16))
    if (opts.verbose) {
      console.log('  [info] compiled prompt preview:\n' + compilePrompt(rubric, rubric.criteria[0], 'example task', 'example candidate').slice(0, 500))
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
  const rubric = validateRubric(rubricRaw, rubricPath)
  const rubricHash = createHash('sha256').update(rubricRaw).digest('hex').slice(0, 16)
  let result
  if (mode.includes('score')) {
    if (!opts.candidate) throw new Error('score requires --candidate <path|->')
    const text = opts.candidate === '-' ? readFileSync(0, 'utf8') : readFileSync(opts.candidate, 'utf8')
    result = await scoreCandidate(rubric, opts.task, text, opts)
  } else if (mode.includes('rank')) {
    result = await runRank(rubric, opts)
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
