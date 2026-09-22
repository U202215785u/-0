// Upgrade the OpenDesign 家宴 prototype to embed the FULL real recipe catalog.
// Reads app/src/generated/catalog.json (1193 recipes) and rewrites the RAW data
// block inside the OpenDesign project artifact, keeping OpenDesign's design/layout.
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const CATALOG = "C:/Users/15387/Documents/Codex/2026-08-31/new-chat-2/app/src/generated/catalog.json";
const ARTIFACT = "C:/Users/15387/Documents/Codex/2026-08-31/dsh/od-repo/.od/projects/7279a609-8925-4c2d-b120-62d3b87c9ac2/jiayan-recipes-pwa.html";
const OUT_COPY = new URL("./od-output/jiayan-prototype.html", import.meta.url);
const PINYIN_PRO = "C:/Users/15387/Documents/Codex/2026-08-31/new-chat-2/app/node_modules/pinyin-pro";

const { pinyin } = require(PINYIN_PRO);
const isHan = (ch) => /\p{Script=Han}/u.test(ch);
const pinyinOf = (text) => {
  const parts = [];
  for (const ch of String(text)) {
    parts.push(isHan(ch) ? pinyin(ch, { toneType: "none" }).trim() : ch.toLowerCase());
  }
  return parts.join("");
};
const initialsOf = (text) => {
  const out = [];
  let prev = "";
  for (const ch of String(text)) {
    const py = isHan(ch) ? pinyin(ch, { toneType: "none" }).trim() : ch.toLowerCase();
    if (!prev || py[0] !== prev[0] || !isHan(ch)) {
      if (py) out.push(py[0]);
    }
    prev = py;
  }
  return out.join("");
};
// simpler & robust initials: first letter of every Han syllable + latin chars
const initialsOf2 = (text) => {
  let out = "";
  for (const ch of String(text)) {
    if (isHan(ch)) {
      const py = pinyin(ch, { toneType: "none" }).trim();
      if (py) out += py[0];
    } else if (/[a-z0-9]/.test(ch.toLowerCase())) {
      out += ch.toLowerCase();
    }
  }
  return out;
};

const METHOD_PRIORITY = ["炒", "煮", "烤", "蒸", "煎", "炸", "凉拌", "炖"];
const TITLE_METHOD = [
  ["炒", "炒"], ["煮", "煮"], ["烤", "烤"], ["蒸", "蒸"], ["煎", "煎"],
  ["炸", "炸"], ["凉拌", "凉拌"], ["拌", "凉拌"], ["焖", "炖"], ["卤", "炖"],
  ["烧", "炖"], ["烩", "炖"], ["汤", "煮"], ["羹", "煮"], ["粥", "煮"],
];
function methodOf(r) {
  const tags = r.tags ?? [];
  for (const m of METHOD_PRIORITY) if (tags.includes(m)) return m;
  if (tags.includes("烧焖")) return "炖";
  for (const [ch, m] of TITLE_METHOD) if (r.title.includes(ch)) return m;
  return "家常";
}
const CATEGORY_MAP = {
  "蔬菜": "veg", "肉类": "meat", "水产": "sea",
  "豆制品": "tofu", "菌菇": "mush", "调味料": "pantry",
};
function shopCatOf(i) {
  if (i.pantry) return "pantry";
  return CATEGORY_MAP[i.category] ?? "other";
}
function groupOf(i) {
  return i.pantry || i.category === "调味料" ? 3 : 1;
}
const DOMAIN_LABEL = {
  "xiachufang.com": "下厨房", "meishij.net": "美食杰", "douguo.com": "豆果美食",
  "haochu123.com": "好厨", "foodty.com": "美食天下", "360doc.com": "360doc",
  "zhihu.com": "知乎", "weibo.com": "微博",
};
function sourceLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return DOMAIN_LABEL[host] ?? host;
  } catch { return "互联网菜谱"; }
}

const catalog = JSON.parse(await readFile(CATALOG, "utf8"));
console.log(`catalog: ${catalog.length} recipes`);

const rows = catalog.map((r) => {
  const time = r.durationMinutes ??
    (r.steps ?? []).reduce((a, s) => a + (s.timerSeconds ? Math.max(1, Math.round(s.timerSeconds / 60)) : 0), 0) ??
    0;
  const n = r.nutrition ?? {};
  const kcal = typeof n.kcal === "number" && Number.isFinite(n.kcal) ? n.kcal : null;
  const p = typeof n.proteinG === "number" && Number.isFinite(n.proteinG) ? n.proteinG : null;
  const c = typeof n.carbsG === "number" && Number.isFinite(n.carbsG) ? n.carbsG : null;
  const f = typeof n.fatG === "number" && Number.isFinite(n.fatG) ? n.fatG : null;
  const lean = (r.tags ?? []).includes("减脂高蛋白");
  const title = r.title;
  const ing = (r.ingredients ?? []).map((i) => [
    i.name,
    typeof i.amount === "number" && Number.isFinite(i.amount) ? i.amount : null,
    i.quantityText ?? i.unit ?? "",
    groupOf(i),
    shopCatOf(i),
  ]);
  const steps = (r.steps ?? []).map((s) => [
    s.text,
    s.timerSeconds && s.timerSeconds > 0 ? Math.max(1, Math.round(s.timerSeconds / 60)) : 0,
    [],
  ]);
  const src = r.author ? [sourceLabel(r.sourceUrl), r.author] : null;
  return [
    r.id, title, pinyinOf(title), initialsOf2(title), [],
    methodOf(r), r.tags ?? [], time, kcal, p, c, f, lean, ing, steps, src,
  ];
});

const js = (v) => JSON.stringify(v);
const rawLiteral = rows.map((r) => {
  const row = [
    r[0], r[1], r[2], r[3], [],
    r[5], r[6], r[7] ?? 0, r[8], r[9], r[10], r[11], r[12],
    r[13], // [[name, qty|null, unit, group, shopCat], ...]
    r[14], // [[text, timerMin, [ing names]], ...]
    r[15], // [sourceLabel, author] | null
  ];
  return js(row);
}).join(",\n");

const html = await readFile(ARTIFACT, "utf8");
const START = html.indexOf("const RAW = [");
const END = html.indexOf("\nconst RECIPES = RAW.map(");
if (START < 0 || END <= START) throw new Error("RAW block markers not found");
const newHtml =
  html.slice(0, START) +
  "const RAW = [\n" + rawLiteral + "\n];\n\n" +
  html.slice(END);

// Patch: extended methods + accurate counts + comment
const patched = newHtml
  .replace('const METHODS = ["炒", "炖", "蒸", "煮", "烤", "凉拌"];',
    'const METHODS = ["炒", "炖", "蒸", "煮", "烤", "凉拌", "煎", "炸"];')
  .replaceAll("菜谱库 1190 道 · 只读", "菜谱库 1193 道 · 只读")
  .replaceAll("菜谱库 1190 道", "菜谱库 1193 道")
  .replace("原型内置其中 19 道作为样本。", "原型内置全部 1193 道：直接来自 app/src/generated/catalog.json（只读真实目录）。");

await writeFile(ARTIFACT, patched, "utf8");
await mkdir(new URL("./od-output/", import.meta.url), { recursive: true });
await copyFile(ARTIFACT, OUT_COPY);

console.log(`DONE: artifact now ${(patched.length / 1024 / 1024).toFixed(1)} MB, ${rows.length} recipes embedded`);
console.log(`OUT: ${ARTIFACT}`);
console.log(`OUT: ${OUT_COPY.pathname}`);