import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseRecipe } from '../src/catalog/schema';
import { assertCatalogQuality } from '../src/catalog/quality';
import type { Recipe } from '../src/catalog/types';

export function buildCatalog(inputDir: string): Recipe[] {
  return readdirSync(inputDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const filename = join(inputDir, entry.name);
      let contents: unknown;
      try {
        contents = JSON.parse(readFileSync(filename, 'utf8'));
      } catch (error) {
        throw new Error(`Failed to parse ${entry.name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }

      try {
        return parseRecipe(contents);
      } catch (error) {
        throw new Error(`Failed to validate ${entry.name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const inputDir = resolve(process.argv[2] ?? 'catalog/recipes');
  const outputFile = resolve(process.argv[3] ?? 'src/generated/catalog.json');
  const catalog = buildCatalog(inputDir);
  const minimumCount = Number(process.env.MIN_CATALOG ?? 50);
  assertCatalogQuality(catalog, minimumCount);
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, `${JSON.stringify(catalog, null, 2)}\n`);
}
