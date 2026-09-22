// Drive OpenDesign daemon (via web proxy at :7542) to create a project and start a design run.
// Usage: node od-drive.mjs
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const BASE = "http://127.0.0.1:7542";
const BRIEF_PATH = new URL("./od-design-brief.md", import.meta.url);
const STATE_PATH = new URL("./od-design-run.json", import.meta.url);

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path}: ${text.slice(0, 500)}`);
  }
  return json;
}

const brief = await readFile(BRIEF_PATH, "utf8");

// 1. Create project
const projectId = randomUUID();
const created = await api("/api/projects", {
  method: "POST",
  body: JSON.stringify({
    id: projectId,
    name: "家宴 · 家庭菜谱 PWA 原型",
    skillId: null,
    designSystemId: "default",
    skipDiscoveryBrief: true,
    metadata: { kind: "prototype", intent: "mobile-app", fidelity: "high-fidelity" },
    pendingPrompt: brief,
  }),
});
const { project, conversationId } = created;
console.log(`PROJECT_ID=${project.id}`);
console.log(`PROJECT_NAME=${project.name}`);
console.log(`CONVERSATION_ID=${conversationId}`);

// 2. Start run
const clientRequestId = randomUUID();
const runCreated = await api("/api/runs", {
  method: "POST",
  body: JSON.stringify({
    projectId: project.id,
    conversationId,
    clientRequestId,
    agentId: "deepseek-harness",
    sessionMode: "design",
    designSystemId: "default",
    message: brief,
    currentPrompt: brief,
  }),
});
const { runId } = runCreated;
console.log(`RUN_ID=${runId}`);
if (runCreated.strategyTask) console.log(`STRATEGY_TASK=${JSON.stringify(runCreated.strategyTask)}`);

await writeFile(STATE_PATH, JSON.stringify({
  projectId: project.id,
  conversationId,
  runId,
  name: project.name,
  clientRequestId,
  briefPath: "od-design-brief.md",
}, null, 2), "utf8");
console.log(`STATE=${STATE_PATH}`);