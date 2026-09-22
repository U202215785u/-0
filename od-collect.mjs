// Collect final deliverables for an OpenDesign project: preview URL, file list, standalone HTML export.
// Usage: node od-collect.mjs <projectId>
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [, , projectId] = process.argv;
const BASE = "http://127.0.0.1:7542";
const OUT_DIR = new URL("./od-output/", import.meta.url);

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

await mkdir(OUT_DIR, { recursive: true });

// 1. File list first (to find the main artifact HTML)
const files = await get(`/api/projects/${projectId}/files`);
const all = files.files ?? [];
const rows = all.map((f) => `${f.path}\t${f.size}`).sort();
console.log(`FILE_COUNT=${rows.length}`);
console.log(rows.join("\n"));
await writeFile(new URL("./project-files.txt", OUT_DIR), `# ${projectId}\n${rows.join("\n")}\n`, "utf8");

// 2. Preview URL (main artifact file)
const mainHtml = all.find((f) => f.kind === "html" || f.path.endsWith(".html")) ?? all.find((f) => f.path === "index.html");
const fileQ = mainHtml ? `?file=${encodeURIComponent(mainHtml.path)}` : "";
const preview = await get(`/api/projects/${projectId}/preview-url${fileQ}`);
console.log(`PREVIEW_URL=${preview.url}`);
console.log(`PREVIEW_FILE=${preview.file ?? ""}`);

// 3. Standalone HTML export
try {
  const res = await fetch(`${BASE}/api/projects/${projectId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: "jiayan-prototype.html", format: "html" }),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const outFile = new URL("./jiayan-prototype.html", OUT_DIR);
  await writeFile(outFile, buf);
  console.log(`HTML_EXPORT=${outFile.pathname} bytes=${buf.length} status=${res.status}`);
} catch (err) {
  console.log(`HTML_EXPORT_ERR=${err.message}`);
}

// 4. State recap
const state = JSON.parse(await readFile(new URL("./od-design-run.json", import.meta.url), "utf8"));
console.log(`PROJECT_ID=${state.projectId}`);