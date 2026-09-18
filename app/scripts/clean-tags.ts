// 标签数据整改：
//   --report  只统计/抽样，不写文件
//   --apply   把清洗后的 tags 写回 app/catalog/recipes/*.json（保持 2-space 序列化）
// 用法：npx tsx scripts/clean-tags.ts [--report|--apply] [filterId]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveRecipeTags, getRecipeTagIssues } from '../src/catalog/tags';
import type { Recipe } from '../src/catalog/types';

const recipesDir = join(import.meta.dirname, '..', 'catalog', 'recipes');
const modes = process.argv.slice(2).filter((arg) => arg.startsWith('--'));
const mode = modes.includes('--apply') ? 'apply' : 'report';
const keepMethods = modes.includes('--keep-methods');
const onlyId = process.argv.slice(2).find((arg) => arg && !arg.startsWith('--'));

const files = readdirSync(recipesDir).filter((name) => name.endsWith('.json'));
const report: { id: string; title: string; before: string[]; after: string[]; removed: string[]; added: string[] }[] = [];
let rewritten = 0;
let gateFailures = 0;

for (const name of files.sort()) {
  const filePath = join(recipesDir, name);
  const recipe = JSON.parse(readFileSync(filePath, 'utf8')) as Recipe;
  if (onlyId && recipe.id !== onlyId) continue;
  const before = recipe.tags ?? [];
  const after = resolveRecipeTags(recipe, { pruneMethods: !keepMethods });
  report.push({
    id: recipe.id,
    title: recipe.title,
    before,
    after,
    removed: before.filter((tag) => !after.includes(tag)),
    added: after.filter((tag) => !before.includes(tag)),
  });
  if (before.join('|') !== after.join('|')) {
    rewritten++;
    if (mode === 'apply') {
      recipe.tags = after;
      writeFileSync(filePath, `${JSON.stringify(recipe, null, 2)}\n`, 'utf8');
    }
  }
}

const changed = report.filter((item) => item.removed.length || item.added.length);
console.log(`recipes: ${report.length}, would-rewrite: ${changed.length}${mode === 'apply' ? ' (applied)' : ''}`);

const removedCount = new Map<string, number>();
const addedCount = new Map<string, number>();
for (const item of changed) {
  for (const tag of item.removed) removedCount.set(tag, (removedCount.get(tag) ?? 0) + 1);
  for (const tag of item.added) addedCount.set(tag, (addedCount.get(tag) ?? 0) + 1);
}
console.log('removed:', [...removedCount.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(' '));
console.log('added:', [...addedCount.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(' '));

// 门禁预演：清洗后是否还有体系问题
for (const item of report) {
  const issues = getRecipeTagIssues({ ...({ id: item.id, title: item.title }) as Recipe, tags: item.after });
  if (issues.length) { gateFailures++; console.log(`GATE item ${item.id} ${item.title}: ${issues.map((i) => i.code).join(',')}`); }
}
console.log(`post-clean gate issues: ${gateFailures}`);

const sample = changed.filter((item) => item.id === onlyId || !onlyId).slice(0, 30);
for (const item of sample) {
  const ops = [...item.removed.map((t) => `-${t}`), ...item.added.map((t) => `+${t}`)].join(' ');
  if (ops) console.log(`  ${item.title}: [${item.before.join('/')}] -> [${item.after.join('/')}]  (${ops})`);
}