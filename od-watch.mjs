// Poll an OpenDesign run until terminal, then dump final state + project files.
// Usage: node od-watch.mjs <runId> <projectId> [pollMs]
import { readFile, writeFile, appendFile } from "node:fs/promises";

const [, , runId, projectId, pollMsRaw] = process.argv;
const pollMs = Number(pollMsRaw ?? 12000);
const BASE = "http://127.0.0.1:7542";
const LOG = new URL("./od-design-run.log", import.meta.url);
const FINAL = new URL("./od-design-run-final.json", import.meta.url);

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

let lastStatus = null;
const startedAt = Date.now();
while (true) {
  let status;
  try {
    status = await get(`/api/runs/${runId}`);
  } catch (err) {
    await appendFile(LOG, `[${new Date().toISOString()}] POLL_ERR ${err.message}\n`);
    await new Promise((r) => setTimeout(r, pollMs));
    continue;
  }
  const { status: state, updatedAt, terminalAt, error, errorCode, failureCategory } = status;
  const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  if (state !== lastStatus) {
    await appendFile(LOG, `[${new Date().toISOString()}] ${elapsedMin}min status=${state} updatedAt=${new Date(updatedAt).toISOString()}\n`);
    lastStatus = state;
  } else if (state === "running" && Date.now() - updatedAt > 300000) {
    await appendFile(LOG, `[${new Date().toISOString()}] WARN running but stale ${Math.round((Date.now() - updatedAt) / 1000)}s since updatedAt\n`);
  }
  if (["succeeded", "failed", "canceled"].includes(state)) {
    await appendFile(LOG, `[${new Date().toISOString()}] TERMINAL status=${state} error=${error ?? ""} errorCode=${errorCode ?? ""} failure=${failureCategory ?? ""}\n`);
    try {
      const files = await get(`/api/projects/${projectId}/files`);
      const rows = (files.files ?? []).map((f) => `${f.path}\t${f.size}\t${f.kind ?? ""}`).sort();
      await appendFile(LOG, `FILES_BEGIN\n${rows.join("\n")}\nFILES_END\n`);
      await writeFile(FINAL, JSON.stringify({ runId, projectId, status: status, files: files.files ?? [] }, null, 2), "utf8");
    } catch (err) {
      await appendFile(LOG, `FILES_ERR ${err.message}\n`);
    }
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, pollMs));
}