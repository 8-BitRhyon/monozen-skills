#!/usr/bin/env node
// work: a small stateful execution harness. Zero dependencies.
// State lives in .work/state.json; GOAL.md, STATE.md, and VERIFY.md are
// generated views. The CLI is the only writer.

import { mkdir, readFile, writeFile, rm, mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const PHASES = new Set(["goal", "plan", "execute", "verify", "deliver", "blocked"]);
const HELP = `work: stateful execution harness

Usage:
  work init "<goal>" [--accept "..."] [--scope "..."] [--exclude "..."]
  work status [--json]
  work goal --outcome "..." [--accept "..."] [--scope "..."] [--exclude "..."]
  work phase <goal|plan|execute|verify|deliver|blocked>
  work task add --task "..." [--id T1] [--files "a,b"] [--verify "cmd"]
  work task start|done <id>
  work task block <id> --reason "..."
  work verify -- <command>
  work decide "<decision>" [--why "..."]
  work block "<reason>"
  work unblock
  work next
  work metrics
  work render
  work --self-test

State: .work/state.json (gitignored). Views: .work/GOAL.md, STATE.md, VERIFY.md.
`;

function parseArgs(argv) {
  const out = { _: [], rest: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") {
      out.rest = argv.slice(i + 1);
      break;
    }
    if (arg.startsWith("--")) {
      const [key, inline] = arg.slice(2).split("=", 2);
      let value = inline;
      if (value === undefined) {
        if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
          value = argv[i + 1];
          i += 1;
        } else {
          value = true;
        }
      }
      if (out[key] === undefined) out[key] = value;
      else if (Array.isArray(out[key])) out[key].push(value);
      else out[key] = [out[key], value];
    } else {
      out._.push(arg);
    }
  }
  return out;
}

function list(value) {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter((item) => item !== true);
}

function statePath(dir) {
  return join(dir, ".work", "state.json");
}

async function load(dir) {
  const path = statePath(dir);
  if (!existsSync(path)) throw new Error(`No work state at ${path}. Run: work init "<goal>"`);
  return JSON.parse(await readFile(path, "utf8"));
}

function nextAction(state) {
  if (state.phase === "blocked") {
    return state.blockers.length ? `resolve blocker: ${state.blockers.at(-1).reason}` : "work unblock";
  }
  if (state.phase === "goal") return 'define acceptance criteria, then: work phase plan';
  if (state.phase === "plan") {
    if (!state.plan.length) return 'add tasks: work task add --task "..." --verify "..."';
    const task = state.plan.find((item) => item.status !== "done");
    return task ? `start ${task.id}: ${task.task}` : "work phase execute";
  }
  if (state.phase === "execute") {
    const active = state.plan.find((item) => item.status === "in_progress");
    if (active) return `finish ${active.id}, then: work verify -- ${active.verify || "<command>"}`;
    const pending = state.plan.find((item) => item.status === "pending");
    if (pending) return `start ${pending.id}: ${pending.task}`;
    if (state.plan.length) return `work verify -- ${state.plan.at(-1).verify || "<command>"}`;
    return 'add tasks: work task add --task "..." --verify "..."';
  }
  if (state.phase === "verify") {
    const last = state.evidence.at(-1);
    if (last && last.result === "fail") return `diagnose ${last.command}, record work decide, fix, then verify again`;
    if (last && last.result === "pass") return "work phase deliver";
    const task = state.plan.at(-1);
    return `work verify -- ${task && task.verify ? task.verify : "<command>"}`;
  }
  if (state.phase === "deliver") return "report what changed, evidence, and residual risks";
  return "work status";
}

async function render(dir, state) {
  const work = join(dir, ".work");
  await mkdir(join(work, "logs"), { recursive: true });

  const acceptance = state.goal.acceptance.length
    ? state.goal.acceptance.map((item) => `- [ ] ${item}`).join("\n")
    : "- [ ] Define at least one acceptance criterion";
  const goal = `# Goal

Generated from \`.work/state.json\`. Do not edit by hand.

## Outcome

${state.goal.outcome}

## Scope

${state.goal.scope.length ? state.goal.scope.map((item) => `- ${item}`).join("\n") : "- None"}

## Exclusions

${state.goal.exclusions.length ? state.goal.exclusions.map((item) => `- ${item}`).join("\n") : "- None"}

## Acceptance Criteria

${acceptance}

## Constraints

${state.goal.constraints.length ? state.goal.constraints.map((item) => `- ${item}`).join("\n") : "- None"}

## Risks

${state.goal.risks.length ? state.goal.risks.map((item) => `- ${item}`).join("\n") : "- None"}
`;

  const tasks = state.plan.length
    ? state.plan.map((item) => `| ${item.id} | ${item.task} | ${item.status} | ${item.verify || ""} |`).join("\n")
    : "| - | No tasks yet | - | - |";
  const decisions = state.decisions.length
    ? state.decisions.map((item) => `- ${item.at.slice(0, 10)}: ${item.decision}${item.why ? ` (${item.why})` : ""}`).join("\n")
    : "- None";
  const blockers = state.blockers.length
    ? state.blockers.map((item) => `- ${item.reason}`).join("\n")
    : "- None";
  const stateView = `# State

Generated from \`.work/state.json\`. Do not edit by hand.

- Phase: ${state.phase}
- Updated: ${state.updatedAt}
- Project: ${state.project}

## Plan

| ID | Task | Status | Verify |
|---|---|---|---|
${tasks}

## Decisions

${decisions}

## Blockers

${blockers}

## Next

${nextAction(state)}
`;

  const evidence = state.evidence.length
    ? state.evidence.map((item) => `| ${item.at} | ${item.command.replace(/\|/g, "\\|")} | ${item.result} | ${String(item.summary).replace(/\|/g, "\\|")} |`).join("\n")
    : "| - | No verification runs yet | - | - |";
  const verifyView = `# Verification

Generated from \`.work/state.json\`. Do not edit by hand.

| At | Command | Result | Summary |
|---|---|---|---|
${evidence}

## Residual Risks

${state.goal.risks.length ? state.goal.risks.map((item) => `- ${item}`).join("\n") : "- None recorded"}
`;

  await writeFile(join(work, "GOAL.md"), goal);
  await writeFile(join(work, "STATE.md"), stateView);
  await writeFile(join(work, "VERIFY.md"), verifyView);
}

async function save(dir, state) {
  state.updatedAt = new Date().toISOString();
  await mkdir(join(dir, ".work", "logs"), { recursive: true });
  await writeFile(statePath(dir), `${JSON.stringify(state, null, 2)}\n`);
  await render(dir, state);
}

function findTask(state, id) {
  const task = state.plan.find((item) => item.id === id);
  if (!task) throw new Error(`Unknown task: ${id}`);
  return task;
}

async function init(dir, flags) {
  const outcome = flags._.join(" ").trim() || String(flags.outcome || "").trim();
  if (!outcome) throw new Error('Goal required: work init "<goal>"');
  const state = {
    version: 1,
    project: basename(dir),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phase: "goal",
    goal: {
      outcome,
      scope: list(flags.scope),
      exclusions: list(flags.exclude),
      acceptance: list(flags.accept),
      constraints: list(flags.constraint),
      risks: list(flags.risk),
    },
    plan: [],
    decisions: [],
    blockers: [],
    evidence: [],
    metrics: { iterations: 0, verifies: 0, failures: 0, humanInterventions: 0, firstPass: null },
  };
  await mkdir(join(dir, ".work", "logs"), { recursive: true });
  await writeFile(join(dir, ".work", ".gitignore"), "*\n");
  await save(dir, state);
  console.log(`initialized ${statePath(dir)}`);
  console.log(`phase: goal`);
  console.log(`next: ${nextAction(state)}`);
}

async function status(dir, flags) {
  const state = await load(dir);
  if (flags.json) {
    console.log(JSON.stringify({ ...state, next: nextAction(state) }, null, 2));
    return;
  }
  const done = state.plan.filter((item) => item.status === "done").length;
  const passed = state.evidence.filter((item) => item.result === "pass").length;
  const failed = state.evidence.filter((item) => item.result === "fail").length;
  console.log(`phase: ${state.phase}`);
  console.log(`goal: ${state.goal.outcome}`);
  console.log(`tasks: ${done}/${state.plan.length} done`);
  console.log(`evidence: ${state.evidence.length} (${passed} pass, ${failed} fail)`);
  console.log(`blockers: ${state.blockers.length}`);
  console.log(`next: ${nextAction(state)}`);
}

async function phase(dir, flags) {
  const state = await load(dir);
  const next = flags._[0];
  if (!PHASES.has(next)) throw new Error(`Phase must be one of: ${[...PHASES].join(", ")}`);
  if (next === "deliver") {
    if (state.blockers.length) throw new Error("Cannot deliver with open blockers");
    const last = state.evidence.at(-1);
    if (!last || last.result !== "pass") throw new Error("Cannot deliver without a passing work verify");
  }
  state.phase = next;
  await save(dir, state);
  console.log(`phase: ${next}`);
  console.log(`next: ${nextAction(state)}`);
}

async function task(dir, flags) {
  const state = await load(dir);
  const action = flags._[0];
  if (action === "add") {
    if (!flags.task) throw new Error("work task add --task \"...\"");
    const id = String(flags.id || `T${state.plan.length + 1}`);
    if (state.plan.some((item) => item.id === id)) throw new Error(`Task already exists: ${id}`);
    state.plan.push({
      id,
      task: String(flags.task),
      files: list(flags.files),
      verify: String(flags.verify || ""),
      status: "pending",
      startedAt: null,
      doneAt: null,
    });
    await save(dir, state);
    console.log(`added ${id}: ${flags.task}`);
    return;
  }
  const id = flags._[1];
  if (!id) throw new Error(`Task id required: work task ${action} <id>`);
  const item = findTask(state, id);
  if (action === "start") {
    item.status = "in_progress";
    item.startedAt = new Date().toISOString();
    state.phase = "execute";
  } else if (action === "done") {
    item.status = "done";
    item.doneAt = new Date().toISOString();
    if (state.plan.every((entry) => entry.status === "done")) state.phase = "verify";
  } else if (action === "block") {
    item.status = "blocked";
    state.blockers.push({ at: new Date().toISOString(), reason: String(flags.reason || "blocked") });
    state.phase = "blocked";
  } else {
    throw new Error(`Unknown task action: ${action}`);
  }
  await save(dir, state);
  console.log(`${id}: ${item.status}`);
  console.log(`next: ${nextAction(state)}`);
}

async function verify(dir, flags) {
  const state = await load(dir);
  const command = flags.rest.join(" ").trim() || String(flags.command || "").trim();
  if (!command) throw new Error("Command required: work verify -- <command>");
  const at = Date.now();
  const logRel = join(".work", "logs", `verify-${at}.log`);
  const result = spawnSync("sh", ["-c", command], { cwd: dir, encoding: "utf8", timeout: 600000 });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  await mkdir(join(dir, ".work", "logs"), { recursive: true });
  await writeFile(join(dir, logRel), `${output || "(no output)"}\n`);

  const passed = result.status === 0;
  const first = state.evidence.length === 0;
  const summary = (output.split("\n").filter(Boolean).at(-1) || (passed ? "passed" : "failed")).slice(0, 500);
  state.evidence.push({
    at: new Date(at).toISOString(),
    command,
    result: passed ? "pass" : "fail",
    exitCode: result.status === null ? 124 : result.status,
    summary,
    log: logRel,
  });
  state.metrics.verifies += 1;
  state.metrics.iterations += 1;
  if (!passed) state.metrics.failures += 1;
  const allDone = state.plan.length > 0 && state.plan.every((item) => item.status === "done");
  if (first && allDone) state.metrics.firstPass = passed;
  state.phase = passed && allDone ? "verify" : "execute";
  await save(dir, state);

  console.log(`${passed ? "PASS" : "FAIL"}: ${command}`);
  console.log(`log: ${logRel}`);
  console.log(`next: ${nextAction(state)}`);
  if (!passed) process.exitCode = 1;
}

async function decide(dir, flags) {
  const state = await load(dir);
  const decision = flags._.join(" ").trim();
  if (!decision) throw new Error('Decision required: work decide "<decision>" --why "..."');
  state.decisions.push({ at: new Date().toISOString(), decision, why: String(flags.why || "") });
  if (state.phase === "blocked" && state.blockers.length === 0) state.phase = "execute";
  await save(dir, state);
  console.log(`decision recorded: ${decision}`);
}

async function block(dir, flags) {
  const state = await load(dir);
  const reason = flags._.join(" ").trim() || String(flags.reason || "").trim();
  if (!reason) throw new Error('Reason required: work block "<reason>"');
  state.blockers.push({ at: new Date().toISOString(), reason });
  state.phase = "blocked";
  await save(dir, state);
  console.log(`blocked: ${reason}`);
}

async function unblock(dir) {
  const state = await load(dir);
  state.blockers.pop();
  state.phase = state.blockers.length ? "blocked" : "execute";
  await save(dir, state);
  console.log(`phase: ${state.phase}`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === "help" || argv[0] === "--help") {
    console.log(HELP);
    return;
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    console.log("work 0.1.0");
    return;
  }
  if (argv[0] === "--self-test") {
    await selfTest();
    return;
  }

  const command = argv[0];
  const flags = parseArgs(argv.slice(1));
  const dir = resolve(String(flags.dir || process.cwd()));

  if (command === "init") return init(dir, flags);
  if (command === "status") return status(dir, flags);
  if (command === "goal") {
    const state = await load(dir);
    if (flags.outcome) state.goal.outcome = String(flags.outcome);
    if (flags.accept) state.goal.acceptance = list(flags.accept);
    if (flags.scope) state.goal.scope = list(flags.scope);
    if (flags.exclude) state.goal.exclusions = list(flags.exclude);
    if (flags.constraint) state.goal.constraints = list(flags.constraint);
    if (flags.risk) state.goal.risks = list(flags.risk);
    await save(dir, state);
    console.log(`goal updated. next: ${nextAction(state)}`);
    return;
  }
  if (command === "phase") return phase(dir, flags);
  if (command === "task") return task(dir, flags);
  if (command === "verify") return verify(dir, flags);
  if (command === "decide") return decide(dir, flags);
  if (command === "block") return block(dir, flags);
  if (command === "unblock") return unblock(dir);
  if (command === "next") {
    const state = await load(dir);
    console.log(nextAction(state));
    return;
  }
  if (command === "metrics") {
    const state = await load(dir);
    console.log(JSON.stringify(state.metrics, null, 2));
    return;
  }
  if (command === "render") {
    const state = await load(dir);
    await save(dir, state);
    console.log("rendered .work/GOAL.md, STATE.md, VERIFY.md");
    return;
  }
  throw new Error(`Unknown command: ${command}. Run: work help`);
}

async function selfTest() {
  const tmp = await mkdtemp(join(tmpdir(), "work-"));
  const run = (args) => spawnSync(process.execPath, [SELF, ...args], { cwd: tmp, encoding: "utf8" });
  let passed = 0;
  let failed = 0;
  const check = (ok, label) => {
    if (ok) {
      passed += 1;
      console.log(`  [pass] ${label}`);
    } else {
      failed += 1;
      console.log(`  [FAIL] ${label}`);
    }
  };

  try {
    let result = run(["init", "Test goal", "--accept", "tests pass"]);
    check(result.status === 0, "init creates state");
    check(existsSync(join(tmp, ".work", "GOAL.md")), "init renders GOAL.md");
    check(existsSync(join(tmp, ".work", ".gitignore")), "state is gitignored");

    const initial = JSON.parse(await readFile(join(tmp, ".work", "state.json"), "utf8"));
    check(initial.phase === "goal" && initial.goal.acceptance[0] === "tests pass", "goal and acceptance persist");

    result = run(["task", "add", "--task", "Implement", "--verify", "true"]);
    check(result.status === 0, "task add succeeds");
    result = run(["task", "start", "T1"]);
    check(result.status === 0, "task start succeeds");
    result = run(["task", "done", "T1"]);
    check(result.status === 0, "task done succeeds");

    result = run(["verify", "--", "false"]);
    check(result.status === 1, "failing verify exits 1");
    let state = JSON.parse(await readFile(join(tmp, ".work", "state.json"), "utf8"));
    check(state.evidence.at(-1).result === "fail" && state.phase === "execute", "failure is recorded and returns to execute");

    result = run(["phase", "deliver"]);
    check(result.status !== 0, "deliver refuses after a failed verify");

    result = run(["verify", "--", "true"]);
    check(result.status === 0, "passing verify exits 0");
    result = run(["phase", "deliver"]);
    check(result.status === 0, "deliver allowed after a pass");

    result = run(["status", "--json"]);
    const summary = JSON.parse(result.stdout);
    check(summary.phase === "deliver" && summary.next.includes("report"), "status JSON exposes phase and next");
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  console.log(`work self-test: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(`work: ${error.message}`);
  process.exit(1);
});
