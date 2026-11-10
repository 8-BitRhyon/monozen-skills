#!/usr/bin/env node

import { createServer } from "node:http";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const OVERLAY_PATH = resolve(HERE, "overlay.js");
const HOST = "127.0.0.1";
const SEVERITIES = new Set(["blocking", "important", "suggestion"]);
const STATUSES = new Set(["pending", "resolved", "dismissed"]);
const MAX_BODY = 256 * 1024;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--self-test" || arg === "--help") out[arg.slice(2)] = true;
    else if (arg.startsWith("--")) {
      out[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function text(res, code, body, type) {
  res.writeHead(code, {
    "content-type": type,
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readAll(file) {
  try {
    const raw = await readFile(file, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function appendRecord(file, record) {
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
}

async function updateRecord(file, id, patch) {
  const records = await readAll(file);
  const index = records.findIndex((item) => item.id === id);
  if (index < 0) return null;
  records[index] = { ...records[index], ...patch, id, updatedAt: new Date().toISOString() };
  const tmp = `${file}.tmp`;
  await writeFile(tmp, `${records.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");
  await rename(tmp, file);
  return records[index];
}

function validate(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return ["body must be a JSON object"];
  if (typeof input.comment !== "string" || !input.comment.trim()) errors.push("comment is required");
  if (typeof input.selector !== "string" || !input.selector.trim()) errors.push("selector is required");
  if (input.severity !== undefined && !SEVERITIES.has(input.severity)) errors.push("severity must be blocking, important, or suggestion");
  if (input.status !== undefined && !STATUSES.has(input.status)) errors.push("status must be pending, resolved, or dismissed");
  return errors;
}

function buildRecord(input) {
  return {
    schemaVersion: "1.0",
    id: `ann_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`,
    url: String(input.url || ""),
    route: String(input.route || "/"),
    selector: String(input.selector),
    selectorChain: Array.isArray(input.selectorChain) ? input.selectorChain.slice(0, 6) : [],
    boundingBox: input.boundingBox || null,
    textSnippet: String(input.textSnippet || "").slice(0, 200),
    computedStyles: input.computedStyles && typeof input.computedStyles === "object" ? input.computedStyles : {},
    comment: input.comment.trim().slice(0, 2000),
    severity: input.severity || "important",
    status: "pending",
    timestamp: new Date().toISOString(),
    source: input.source || null,
  };
}

function createHandler(file, overlaySource) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "600",
      });
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${HOST}`);

    try {
      if (req.method === "GET" && url.pathname === "/health") {
        json(res, 200, { ok: true, file });
        return;
      }

      if (req.method === "GET" && url.pathname === "/overlay.js") {
        text(res, 200, overlaySource, "application/javascript; charset=utf-8");
        return;
      }

      if (req.method === "GET" && url.pathname === "/annotations") {
        const status = url.searchParams.get("status");
        if (status && !STATUSES.has(status)) {
          json(res, 400, { error: "invalid status filter" });
          return;
        }
        const records = await readAll(file);
        json(res, 200, { annotations: status ? records.filter((item) => item.status === status) : records });
        return;
      }

      if (req.method === "POST" && url.pathname === "/annotations") {
        let input;
        try {
          input = JSON.parse(await readBody(req));
        } catch (error) {
          json(res, 400, { error: `invalid JSON: ${error.message}` });
          return;
        }
        const errors = validate(input);
        if (errors.length) {
          json(res, 422, { error: "invalid annotation", errors });
          return;
        }
        const record = buildRecord(input);
        await appendRecord(file, record);
        json(res, 201, { annotation: record });
        return;
      }

      const patchMatch = url.pathname.match(/^\/annotations\/([^/]+)$/);
      if (req.method === "PATCH" && patchMatch) {
        let input;
        try {
          input = JSON.parse(await readBody(req));
        } catch (error) {
          json(res, 400, { error: `invalid JSON: ${error.message}` });
          return;
        }
        if (!STATUSES.has(input.status)) {
          json(res, 422, { error: "status must be pending, resolved, or dismissed" });
          return;
        }
        const record = await updateRecord(file, decodeURIComponent(patchMatch[1]), { status: input.status });
        if (!record) {
          json(res, 404, { error: "annotation not found" });
          return;
        }
        json(res, 200, { annotation: record });
        return;
      }

      json(res, 404, { error: "not found" });
    } catch (error) {
      json(res, 500, { error: error.message });
    }
  };
}

function listen(handler, port) {
  const server = createServer(handler);
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, () => resolvePromise(server));
  });
}

async function runSelfTest() {
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

  const tmp = await mkdtemp(join(tmpdir(), "design-loop-"));
  const file = join(tmp, "annotations.jsonl");
  const overlaySource = await readFile(OVERLAY_PATH, "utf8");
  const server = await listen(createHandler(file, overlaySource), 0);
  const base = `http://${HOST}:${server.address().port}`;

  try {
    const health = await fetch(`${base}/health`);
    check(health.status === 200, "GET /health returns 200");

    const overlay = await fetch(`${base}/overlay.js`);
    const overlayBody = await overlay.text();
    check(overlay.status === 200 && overlayBody.includes("__designLoopOverlay"), "GET /overlay.js serves the overlay");

    const post = await fetch(`${base}/annotations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: "http://localhost:8788/",
        route: "/",
        selector: "[data-testid=\"hero-cta\"]",
        selectorChain: [{ type: "testid", value: "[data-testid=\"hero-cta\"]", stability: 0.95 }],
        boundingBox: { x: 10, y: 20, width: 120, height: 44, viewportWidth: 1440, viewportHeight: 900, dpr: 2 },
        textSnippet: "Start",
        computedStyles: { display: "inline-flex" },
        comment: "CTA is clipped on mobile",
        severity: "blocking",
      }),
    });
    const created = await post.json();
    check(post.status === 201 && created.annotation.status === "pending", "POST /annotations stores a pending annotation");

    const pending = await fetch(`${base}/annotations?status=pending`).then((item) => item.json());
    check(pending.annotations.length === 1, "GET /annotations?status=pending returns the new annotation");

    const rejected = await fetch(`${base}/annotations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ comment: "", selector: "" }),
    });
    check(rejected.status === 422, "POST /annotations rejects an empty comment and selector");

    const patched = await fetch(`${base}/annotations/${encodeURIComponent(created.annotation.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    check(patched.status === 200, "PATCH /annotations/:id updates status");

    const after = await fetch(`${base}/annotations?status=pending`).then((item) => item.json());
    check(after.annotations.length === 0, "resolved annotations leave the pending queue");

    const raw = await readFile(file, "utf8");
    const lines = raw.trim().split("\n");
    check(lines.length === 1 && JSON.parse(lines[0]).status === "resolved", "JSONL holds one updated record");
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolvePromise) => server.close(resolvePromise));
    await rm(tmp, { recursive: true, force: true });
  }

  console.log(`design-loop collector self-test: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node collector.mjs [--file .design/annotations.jsonl] [--port 4748] [--self-test]");
    return;
  }
  if (args["self-test"]) {
    await runSelfTest();
    return;
  }

  const file = resolve(args.file || ".design/annotations.jsonl");
  const port = Number(args.port || 4748);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("[annotate] invalid --port");
    process.exit(2);
  }

  const overlaySource = await readFile(OVERLAY_PATH, "utf8");
  const server = await listen(createHandler(file, overlaySource), port);
  console.log(`[annotate] listening on http://${HOST}:${port}`);
  console.log(`[annotate] writing ${file}`);
  console.log(`[annotate] inject: const s=document.createElement("script");s.src="http://${HOST}:${port}/overlay.js";document.head.append(s);`);
}

main().catch((error) => {
  console.error(`[annotate] ${error.message}`);
  process.exit(1);
});
