import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Recipe } from '../src/catalog/types';
import { estimateNutrition } from '../src/domain/nutrition';

export type NutritionRegenerationResult = {
  updated: string[];
  removed: string[];
  untouched: number;
};

/** 对 catalog/recipes 下每道菜重算营养（幂等：数值未变的内容不重写文件）。返回变更摘要。 */
export function regenerateCatalogNutrition(inputDir: string): NutritionRegenerationResult {
  const updated: string[] = [];
  const removed: string[] = [];
  let untouched = 0;

  for (const entry of readdirSync(inputDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filename = join(inputDir, entry.name);
    const recipe = JSON.parse(readFileSync(filename, 'utf8')) as Recipe;
    const next = estimateNutrition(recipe);

    if (recipe.nutrition === undefined && next === undefined) {
      untouched++;
      continue;
    }
    if (recipe.nutrition !== undefined && next !== undefined && JSON.stringify(recipe.nutrition) === JSON.stringify(next)) {
      untouched++;
      continue;
    }

    if (next === undefined) {
      delete recipe.nutrition;
      removed.push(entry.name);
    } else {
      recipe.nutrition = next;
      updated.push(entry.name);
    }
    writeFileSync(filename, `${JSON.stringify(recipe, null, 2)}\n`);
  }

  return { updated, removed, untouched };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const inputDir = resolve(process.argv[2] ?? 'catalog/recipes');
  const result = regenerateCatalogNutrition(inputDir);
  console.log(`营养重算完成：更新 ${result.updated.length} 道，移除 ${result.removed.length} 道，未变动 ${result.untouched} 道。`);
  if (result.removed.length > 0) {
    console.log('已移除营养（食材无可换算份量，不做猜测）：');
    for (const name of result.removed.slice(0, 20)) console.log(`  - ${name}`);
    if (result.removed.length > 20) console.log(`  …等 ${result.removed.length} 道`);
  }
}