#!/usr/bin/env node
/**
 * verifier-functional-test.mjs - Functional tests for the llm-as-verifier
 * reference CLI against a zero-dep mock OpenAI-compatible logprob server.
 *
 * The mock serves deterministic top_logprobs driven by markers in the prompt
 * text, so every assertion below is a closed-form hand computation:
 *
 *   VSCORE=<0..1>        reward-scale score for the candidate in the slot
 *                        being requested (letter value v = 1 + round(q*19),
 *                        normalized (v-1)/19).
 *   VDIST=<tok:p,...>    exact token distribution (expectation math tests).
 *   VPROG=<0..1>         progress value for the current step (letter idx =
 *                        round(q*19), normalized idx/19, inverted scale).
 *   VFAIL=<status>       respond with that HTTP status (error handling).
 *   VSLOW=<ms>           delay before responding (timeout handling).
 *   VREJECT_HYBRID=1     reject requests carrying chat_template_kwargs, so
 *                        the CLI's hybrid-thinking fallback path is tested.
 *
 * IMPORTANT: the CLI is spawned with ASYNC execFile, never spawnSync - the
 * mock server runs in THIS process, so blocking the event loop (as spawnSync
 * does) would deadlock the CLI's requests against the mock.
 *
 * Usage: node scripts/verifier-functional-test.mjs   (npm run test:verifier)
 */

import { createServer } from 'node:http'
import { execFile, spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = join(HERE, '..', 'skills', 'llm-as-verifier', 'scripts', 'llm-verifier.mjs')
const LETTERS = 'ABCDEFGHIJKLMNOPQRST'

let pass = 0
let fail = 0
function ok(cond, msg) {
  if (cond) { pass++; console.log('  [PASS] ' + msg) }
  else { fail++; console.log('  [FAIL] ' + msg) }
}
function near(a, b, eps) { return Math.abs(a - b) <= (eps || 0.001) }

// ---------------------------------------------------------------------------
// Mock OpenAI-compatible verifier server
// ---------------------------------------------------------------------------

function rewardLetter(q) {
  // NOTE: avoid marker values landing exactly on .5 boundaries (e.g. q with
  // q*19 = 8.5): JS Math.round is half-up while Python round is banker's, so
  // Node and Python could disagree on such a value. The chosen test markers
  // (0.1..0.9) all avoid that.
  const v = 1 + Math.round(q * 19)
  return LETTERS[20 - v] // A -> value 20 -> index 0; T -> value 1 -> index 19
}

function startMock() {
  const requests = []
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      let payload = {}
      try { payload = JSON.parse(body) } catch { /* malformed: empty payload */ }
      const prompt = (payload.messages && payload.messages[0] && payload.messages[0].content) || ''
      const hybrid = !!(payload.chat_template_kwargs)
      requests.push({ hybrid, prompt })

      const isProgress = prompt.includes('<c1>')
      const endsA = /<score_A>\s*$/.test(prompt)
      const endsB = /<score_B>\s*$/.test(prompt)

      const failM = prompt.match(/VFAIL=([0-9]{3})/)
      if (failM) {
        res.writeHead(parseInt(failM[1], 10), { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'mock failure ' + failM[1] }))
        return
      }
      if (prompt.includes('VREJECT_HYBRID=1') && hybrid) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'hybrid thinking unsupported (mock)' }))
        return
      }
      const slowM = prompt.match(/VSLOW=([0-9]+)/)
      const reply = () => {
        let top = []
        let token = 'A'
        if (isProgress) {
          const qM = prompt.match(/VPROG=([0-9.]+)/g)
          const q = qM ? parseFloat(qM[qM.length - 1].split('=')[1]) : 0.5
          const idx = Math.max(0, Math.min(19, Math.round(q * 19)))
          token = LETTERS[idx]
          top = [{ token, logprob: 0, bytes: null }]
        } else {
          const distM = prompt.match(/VDIST=([A-T]:[0-9.]+(?:,[A-T]:[0-9.]+)*)/)
          if (distM) {
            top = distM[1].split(',').map((kv) => {
              const [t, p] = kv.split(':')
              return { token: t, logprob: Math.log(parseFloat(p)), bytes: null }
            })
            token = top.reduce((m, x) => (x.logprob > m.logprob ? x : m)).token
          } else {
            // Which slot is being scored? Split on the trajectory B header:
            // everything before is slot A's candidate, after is slot B's.
            const [aPart, bPart] = prompt.split('**Trajectory B:**')
            const text = endsB ? (bPart || '') : (aPart || prompt)
            const qM = text.match(/VSCORE=([0-9.]+)/)
            const q = qM ? parseFloat(qM[1]) : 0.5
            token = rewardLetter(q)
            top = [{ token, logprob: 0, bytes: null }]
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          id: 'chatcmpl-mock',
          object: 'chat.completion',
          created: 1,
          model: payload.model || 'mock',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: token },
            finish_reason: 'stop',
            logprobs: {
              content: [{ token, logprob: top[0].logprob, bytes: null, top_logprobs: top }]
            }
          }]
        }))
      }
      if (slowM) setTimeout(reply, parseInt(slowM[1], 10))
      else reply()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      resolve({
        url: 'http://127.0.0.1:' + port + '/v1',
        requests,
        close: () => server.close()
      })
    })
  })
}

// ---------------------------------------------------------------------------
// CLI runner (async: never block the event loop the mock lives on)
// ---------------------------------------------------------------------------

async function run(args, extraEnv, input) {
  const env = Object.assign({}, process.env, {
    LLM_VERIFIER_URL: mock.url,
    LLM_VERIFIER_MODEL: 'mock-model',
    LLM_VERIFIER_API_KEY: 'test-key'
  }, extraEnv || {})
  try {
    const { stdout, stderr } = await execFileP('node', [CLI].concat(args), { env, input, timeout: 20000 })
    return { status: 0, stdout, stderr }
  } catch (e) {
    // Promisified execFile sets error.code to the child's exit code on a
    // non-zero exit; guard against non-numeric codes (e.g. maxBuffer) so
    // status comparisons stay meaningful.
    const code = typeof e.code === 'number' ? e.code : 1
    return { status: code, stdout: (e.stdout || ''), stderr: (e.stderr || '') }
  }
}

function tmpDir() { return mkdtempSync(join(tmpdir(), 'llmv-test-')) }

// Run the CLI with stdin fed through a real pipe (execFile 'input' never
// closes the child's stdin, so the CLI's readFileSync(0) would block).
async function runStdin(args, stdinText) {
  const env = Object.assign({}, process.env, {
    LLM_VERIFIER_URL: mock.url,
    LLM_VERIFIER_MODEL: 'mock-model',
    LLM_VERIFIER_API_KEY: 'test-key'
  })
  return new Promise((resolve) => {
    const child = spawn('node', [CLI].concat(args), { env, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (code) => resolve({ status: code, stdout, stderr }))
    child.on('error', () => resolve({ status: 1, stdout: '', stderr: 'spawn error' }))
    child.stdin.write(stdinText)
    child.stdin.end()
  })
}

let mock

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function main() {
  mock = await startMock()
  const T = tmpDir()
  try {
    await runTests(T)
  } finally {
    mock.close()
    rmSync(T, { recursive: true, force: true })
  }
}

async function runTests(T) {
  const cand = (name, content) => writeFileSync(join(T, name), content)

  console.log('=== [verifier] functional tests against mock logprob server ===')

  // 1. self-check stays token-free and green
  const sc = await run(['--self-check'])
  ok(sc.status === 0, '--self-check exits 0')

  // 2. score: single-token scale mapping is exact ((v-1)/19)
  cand('high.txt', 'Solution\nVSCORE=1.0')
  let r = await run(['score', '--candidate', join(T, 'high.txt'), '--k', '1'])
  ok(r.status === 0, 'score exits 0')
  let j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(near(j.composite, 1.0), 'score VSCORE=1.0 -> composite 1.0 (got ' + j.composite + ')')
  ok(j.decision === 'pass', 'decision pass at 1.0')

  cand('low.txt', 'Solution\nVSCORE=0.0')
  r = await run(['score', '--candidate', join(T, 'low.txt'), '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(near(j.composite, 0.0), 'score VSCORE=0.0 -> composite 0.0 (got ' + j.composite + ')')
  ok(j.decision === 'fail', 'decision fail at 0.0')

  cand('mid.txt', 'Solution\nVSCORE=0.5')
  r = await run(['score', '--candidate', join(T, 'mid.txt'), '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(near(j.composite, 10 / 19), 'score VSCORE=0.5 -> composite 10/19 (got ' + j.composite + ')')

  // 3. score: expectation over a real distribution (VDIST)
  cand('dist.txt', 'Solution\nVDIST=A:0.5,T:0.5')
  r = await run(['score', '--candidate', join(T, 'dist.txt'), '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(near(j.composite, 0.5), 'score VDIST A:0.5/T:0.5 -> expectation 0.5 (got ' + j.composite + ')')

  cand('dist2.txt', 'Solution\nVDIST=A:0.75,T:0.25')
  r = await run(['score', '--candidate', join(T, 'dist2.txt'), '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(near(j.composite, 0.75), 'score VDIST A:0.75/T:0.25 -> expectation 0.75 (got ' + j.composite + ')')

  // 4. score: K repeats are averaged deterministically
  r = await run(['score', '--candidate', join(T, 'high.txt'), '--k', '3'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(near(j.composite, 1.0), 'score K=3 repeats averaged -> 1.0 (got ' + j.composite + ')')

  // 5. compare: directed rewards + Bradley-Terry preference
  const dir2 = join(T, 'pair')
  mkdirSync(dir2)
  writeFileSync(join(dir2, 'a.txt'), 'Solution A\nVSCORE=0.9')
  writeFileSync(join(dir2, 'b.txt'), 'Solution B\nVSCORE=0.1')
  r = await run(['compare', '--candidates', dir2, '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { ra: NaN, rb: NaN, preference: NaN }
  const ra = Math.round(0.9 * 19) / 19
  const rb = Math.round(0.1 * 19) / 19
  ok(near(j.ra, ra), 'compare ra matches hand-computed ' + ra.toFixed(4) + ' (got ' + j.ra + ')')
  ok(near(j.rb, rb), 'compare rb matches hand-computed ' + rb.toFixed(4) + ' (got ' + j.rb + ')')
  const pref = 1 / (1 + Math.exp(-(ra - rb)))
  ok(near(j.preference, pref), 'compare preference = sigmoid(ra-rb) (got ' + j.preference + ')')

  // 6. compare is DIRECTED: swapping file order flips the rewards
  r = await run(['compare', '--candidates', join(dir2, 'b.txt') + ',' + join(dir2, 'a.txt'), '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { ra: NaN, rb: NaN }
  ok(near(j.ra, rb) && near(j.rb, ra), 'compare directed: swapped order swaps ra/rb')

  // 7. rank: PPT selects the best candidate, cost is O(Nk)
  const dir5 = join(T, 'pool')
  mkdirSync(dir5)
  const scores = [0.9, 0.7, 0.5, 0.3, 0.1]
  ;['a', 'b', 'c', 'd', 'e'].forEach((n, i) => writeFileSync(join(dir5, n + '.txt'), 'Candidate ' + n + '\nVSCORE=' + scores[i]))
  r = await run(['rank', '--candidates', dir5, '--k', '1', '--pivots', '2', '--seed', '0'])
  j = r.status === 0 ? JSON.parse(r.stdout) : {}
  ok(r.status === 0, 'rank exits 0')
  ok(j.strategy === 'probabilistic-pivot-tournament', 'rank strategy named')
  ok(j.poolSize === 5 && j.pivotCount === 2, 'poolSize 5, pivotCount 2')
  ok(j.pairCount === 5 + 3 * 2 + 1, 'pairCount = ring(5) + nonpivot(3)*pivots(2) + pivot-pivot(1) = 12 (got ' + j.pairCount + ')')
  ok(j.ranked && j.ranked[0].label === 'a.txt', 'rank winner is the VSCORE=0.9 candidate (got ' + (j.ranked && j.ranked[0].label) + ')')

  // 7b. rank API cost matches pairCount x criteria x k x 2 slots end-to-end
  const beforeRank = mock.requests.length
  await run(['rank', '--candidates', dir5, '--k', '1', '--pivots', '2', '--seed', '0'])
  const rankCalls = mock.requests.length - beforeRank
  // 12 pairs x 3 criteria x 1 repeat x 2 slots (A and B) = 72 verifier calls
  ok(rankCalls === 12 * 3 * 1 * 2, 'rank API cost = pairs x criteria x k x 2 slots (got ' + rankCalls + ')')

  // 8. rank determinism + winner robustness across seeds
  const seed0 = JSON.stringify(JSON.parse((await run(['rank', '--candidates', dir5, '--k', '1', '--pivots', '2', '--seed', '0'])).stdout))
  const seed0b = JSON.stringify(JSON.parse((await run(['rank', '--candidates', dir5, '--k', '1', '--pivots', '2', '--seed', '0'])).stdout))
  ok(seed0 === seed0b, 'rank deterministic for same seed')
  for (const s of [1, 2, 3, 7]) {
    const jj = JSON.parse((await run(['rank', '--candidates', dir5, '--k', '1', '--pivots', '2', '--seed', String(s)])).stdout)
    ok(jj.ranked[0].label === 'a.txt', 'rank winner stable across seed ' + s)
  }

  // 9. rank with pivots=1
  r = await run(['rank', '--candidates', dir5, '--k', '1', '--pivots', '1', '--seed', '0'])
  j = r.status === 0 ? JSON.parse(r.stdout) : {}
  ok(j.pivotCount === 1 && j.pairCount === 5 + 4, 'pivots=1 -> pairCount 9')

  // 10. progress: rising trend + inverted scale
  const dirP = join(T, 'steps')
  mkdirSync(dirP)
  writeFileSync(join(dirP, '01.txt'), 'read task\nVPROG=0.2')
  writeFileSync(join(dirP, '02.txt'), 'implement\nVPROG=0.5')
  writeFileSync(join(dirP, '03.txt'), 'verified\nVPROG=0.9')
  r = await run(['progress', '--steps', dirP, '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { steps: [], trend: '', suggestedAbandonPoint: 'x' }
  ok(near(j.steps[0].progress, 4 / 19), 'progress step1 idx=round(0.2*19)=4 -> 4/19 (got ' + j.steps[0].progress + ')')
  ok(near(j.steps[2].progress, 17 / 19), 'progress step3 idx=round(0.9*19)=17 -> 17/19 (got ' + j.steps[2].progress + ')')
  ok(j.trend === 'rising', 'progress trend rising')
  ok(j.suggestedAbandonPoint === null, 'no abandon for rising run')

  // 11. progress: hopeless start triggers abandon
  const dirQ = join(T, 'steps2')
  mkdirSync(dirQ)
  writeFileSync(join(dirQ, '01.txt'), 'wrong path\nVPROG=0.01')
  writeFileSync(join(dirQ, '02.txt'), 'still wrong\nVPROG=0.6')
  r = await run(['progress', '--steps', dirQ, '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { suggestedAbandonPoint: 'x' }
  ok(j.suggestedAbandonPoint === '01.txt', 'abandon point set on hopeless first step (got ' + j.suggestedAbandonPoint + ')')

  // 12. hybrid-thinking fallback: first call rejected, retry succeeds
  cand('hybrid.txt', 'Solution\nVREJECT_HYBRID=1\nVSCORE=0.9')
  r = await run(['score', '--candidate', join(T, 'hybrid.txt'), '--k', '1'])
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(r.status === 0 && near(j.composite, 17 / 19), 'hybrid fallback path works (got composite ' + j.composite + ')')
  ok(mock.requests.some((q) => q.hybrid) && mock.requests.some((q) => !q.hybrid), 'mock saw both hybrid and plain requests')

  // 13. API error propagates
  cand('err.txt', 'Solution\nVFAIL=500')
  r = await run(['score', '--candidate', join(T, 'err.txt'), '--k', '1'])
  ok(r.status === 1 && /verifier API error 500/.test(r.stderr), 'HTTP 500 -> exit 1 with verifier API error')

  // 14. timeout
  cand('slow.txt', 'Solution\nVSLOW=2500')
  r = await run(['score', '--candidate', join(T, 'slow.txt'), '--k', '1', '--timeout', '400'])
  ok(r.status === 1 && /timed out/.test(r.stderr), 'VSLOW + --timeout 400 -> timed out error')

  // 15. CLI arg validation
  r = await run(['rank', '--k', '0', '--candidates', dir5])
  ok(r.status === 2, '--k 0 rejected (exit 2)')
  r = await run(['score', '--bogus'])
  ok(r.status === 2, 'unknown flag rejected (exit 2)')
  r = await run(['score'])
  ok(r.status === 1, 'score without --candidate -> exit 1')
  r = await run(['score', '--candidate', '/nonexistent/x.txt', '--k', '1'])
  ok(r.status === 1, 'missing candidate file -> exit 1')
  r = await run(['rank', '--candidates', join(T, 'nope'), '--k', '1'])
  ok(r.status === 1, 'missing candidates dir -> exit 1')
  r = await run(['--rubric', '/nonexistent/rubric.json', 'score', '--candidate', join(T, 'high.txt'), '--k', '1'])
  ok(r.status === 1, 'missing rubric -> exit 1')

  // 16. --out writes the result file
  const outPath = join(T, 'result.json')
  r = await run(['score', '--candidate', join(T, 'high.txt'), '--k', '1', '--out', outPath])
  ok(r.status === 0 && existsSync(outPath), '--out writes result file')
  ok(JSON.parse(readFileSync(outPath, 'utf8')).composite === 1, 'out file contains valid result')

  // 17. stdin candidate
  r = await runStdin(['score', '--candidate', '-', '--k', '1'], 'Solution via stdin VSCORE=0.5')
  j = r.status === 0 ? JSON.parse(r.stdout) : { composite: NaN }
  ok(r.status === 0 && near(j.composite, 10 / 19), 'stdin candidate scored correctly (got ' + j.composite + ')')

  console.log('')
  console.log('=== [verifier] ' + pass + ' passed, ' + fail + ' failed ===')
  if (fail !== 0) process.exit(1)
}

main().catch((e) => {
  console.error('verifier functional test harness error: ' + (e && e.message))
  process.exit(1)
})
