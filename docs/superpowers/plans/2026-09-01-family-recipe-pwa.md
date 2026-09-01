# Family Recipe PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first family recipe PWA that supports cooking from a curated catalog, weekly meal planning, a minimal shopping list, and text-based dish selection handoff.

**Architecture:** React routes render recipe browse, detail, guided cooking, planning, shopping, and choosing-device experiences from a generated static catalog. IndexedDB stores only per-device selections and progress. A Node build script validates externally maintained canonical recipe records before it emits the catalog consumed by the PWA.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Dexie, Zod, Vitest, React Testing Library, Playwright, vite-plugin-pwa, Lucide.

## Global Constraints

- Do not add a backend, accounts, cloud sync, AI, web scraping, or in-app recipe editing.
- The app must remain useful without network access after installation.
- Recipe content is source-based and read-only in the app. Never invent a quantity, step, nutrition value, source, or author.
- A recipe needs only title, ingredients, and steps. All other catalog fields are optional.
- Serving scaling applies only when `baseServings`, numeric amounts, and units are present.
- The shopping list excludes pantry staples by default and merges only equal ingredient keys with equal units.
- Household use does not require authentication or security-heavy features.
- Before visual polish, retry installation of the reviewed Apple/HIG design skill requested by the user. Do not represent it as installed until the installer succeeds.
- The existing library has one complete `.cook` recipe and 53 source-index records. A source-index record must not be displayed as a complete cookable recipe until its public recipe data is curated into the canonical format.

---

## Proposed File Structure

- `app/package.json`: application scripts and dependencies.
- `app/vite.config.ts`: Vite, test, and PWA configuration.
- `app/src/catalog/types.ts`: public TypeScript catalog contracts.
- `app/src/catalog/schema.ts`: Zod schema and parsing helpers.
- `app/catalog/recipes/*.json`: curator-maintained canonical recipe records, outside the app UI.
- `app/scripts/build-catalog.ts`: validates records and emits `app/src/generated/catalog.json`.
- `app/src/domain/servings.ts`: deterministic serving scaling.
- `app/src/domain/menu.ts`: meal plan, nutrition, and shopping-list pure functions.
- `app/src/domain/share-code.ts`: human-readable selection code encoder and decoder.
- `app/src/db/app-db.ts`: Dexie schema for local device state.
- `app/src/features/*`: small, route-focused UI modules.
- `app/src/test/*`: Vitest setup and fixture catalog.
- `app/e2e/*`: Playwright flows for responsive, offline, and persistence behavior.

All application paths and commands below are relative to `app/` unless a path
begins with `../`. This keeps the existing `docs/`, `outputs/`, and `work/`
deliverables untouched.

### Task 1: Scaffold the PWA and test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/app.tsx`, `src/styles/app.css`
- Create: `src/test/setup.ts`, `src/test/smoke.test.tsx`

**Interfaces:**
- Produces `App` and `npm run dev`, `npm run test`, `npm run build`, and `npm run e2e` commands used by all later tasks.

- [ ] **Step 1: Initialize the Vite React TypeScript project and install dependencies**

Run:

```powershell
npm create vite@latest app -- --template react-ts
Set-Location app
npm install react-router-dom dexie zod lucide-react
npm install -D vite-plugin-pwa vitest jsdom tsx @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
npx playwright install chromium
```

- [ ] **Step 2: Configure tests and PWA output**

Implement the essential Vite settings:

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate', manifest: { name: '家宴', short_name: '家宴', display: 'standalone' } }),
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
});
```

Add these scripts to `package.json` before running any test command:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Write and run a failing smoke test**

```tsx
// src/test/smoke.test.tsx
import { render, screen } from '@testing-library/react';
import { App } from '../app';

it('renders the recipe-first home screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '找菜' })).toBeInTheDocument();
});
```

Run: `npm run test -- src/test/smoke.test.tsx`

Expected: FAIL because `App` does not exist yet.

- [ ] **Step 4: Implement the smallest app shell and make the test pass**

```tsx
// src/app.tsx
export function App() {
  return <main><h1>找菜</h1></main>;
}
```

Run: `npm run test -- src/test/smoke.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: Vite produces a `dist/` directory without TypeScript errors.

### Task 2: Define and validate the curated recipe format

**Files:**
- Create: `src/catalog/types.ts`, `src/catalog/schema.ts`
- Create: `src/catalog/schema.test.ts`
- Create: `catalog/recipes/README.md`

**Interfaces:**
- Produces `Recipe`, `Ingredient`, `Step`, and `parseRecipe(input)`.
- Later tasks consume `Recipe[]` only, never raw curator files.

- [ ] **Step 1: Write failing schema tests for required and optional fields**

```ts
import { parseRecipe } from './schema';

it('accepts a minimal recipe without author, source, nutrition, or servings', () => {
  expect(parseRecipe({ id: 'tea-egg', title: '茶叶蛋', ingredients: [{ name: '鸡蛋' }], steps: [{ text: '煮熟。' }] }).title).toBe('茶叶蛋');
});

it('rejects a record without ingredients', () => {
  expect(() => parseRecipe({ id: 'bad', title: '空菜', steps: [{ text: '无' }] })).toThrow();
});
```

- [ ] **Step 2: Run the schema tests to verify failure**

Run: `npm run test -- src/catalog/schema.test.ts`

Expected: FAIL because `parseRecipe` is not defined.

- [ ] **Step 3: Implement the canonical types and Zod parser**

```ts
export type Ingredient = { name: string; mergeKey?: string; amount?: number; unit?: string; quantityText?: string; category?: string; pantry?: boolean };
export type Step = { text: string; timerSeconds?: number; ingredientNames?: string[] };
export type Recipe = { id: string; title: string; ingredients: Ingredient[]; steps: Step[]; baseServings?: number; sourceUrl?: string; author?: string; nutrition?: { kcal?: number; proteinG?: number; carbsG?: number; fatG?: number }; tags?: string[]; durationMinutes?: number };
```

Require `id`, `title`, a non-empty ingredient array, and a non-empty step array. Keep every other field optional. Reject non-positive numeric amounts, base servings, and timers.

- [ ] **Step 4: Re-run schema tests**

Run: `npm run test -- src/catalog/schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Document curator rules**

Write `catalog/recipes/README.md` with these rules: preserve source facts, do not fill missing amounts, use `quantityText` for nonnumeric quantities, use a stable `mergeKey` only for equivalent grocery items, and do not mark a source-index entry cookable until it has ingredients and steps.

### Task 3: Build the static catalog without fabricating incomplete recipes

**Files:**
- Create: `scripts/build-catalog.ts`, `scripts/build-catalog.test.ts`
- Create: `src/generated/catalog.json` (generated, do not edit manually)
- Create: `catalog/recipes/beef-chow-fun.json` from the existing complete public Cooklang source only
- Modify: `package.json`

**Interfaces:**
- Produces `buildCatalog(inputDir): Recipe[]` and a checked-in generated JSON catalog.
- Later UI imports `catalog.json` and never parses `.cook`, Markdown, or external pages at runtime.

- [ ] **Step 1: Write a failing builder test**

```ts
it('sorts valid recipes and reports the file that fails validation', () => {
  expect(buildCatalog(fixtureDir).map(recipe => recipe.id)).toEqual(['a', 'b']);
  expect(() => buildCatalog(invalidFixtureDir)).toThrow(/invalid.json/);
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test -- scripts/build-catalog.test.ts`

Expected: FAIL because `buildCatalog` is not defined.

- [ ] **Step 3: Implement the build script and package command**

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function buildCatalog(inputDir: string): Recipe[] {
  return readJsonFiles(inputDir)
    .map(file => parseRecipe(file.contents))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

function readJsonFiles(inputDir: string): Array<{ contents: unknown }> {
  return readdirSync(inputDir)
    .filter(name => name.endsWith('.json'))
    .map(name => ({ contents: JSON.parse(readFileSync(join(inputDir, name), 'utf8')) }));
}
```

Add `"build:catalog": "tsx scripts/build-catalog.ts"` and change the build script to `"build": "npm run build:catalog && tsc -b && vite build"`. If a record is only a source index, keep it outside `catalog/recipes/`; do not create placeholder cooking steps.

- [ ] **Step 4: Curate only the existing full `beef-chow-fun.cook` record**

Transcribe only fields explicitly present in `../outputs/advanced-home-cooking-library/recipes/chinese/stir-fry/beef-chow-fun.cook`. Keep its source URL and fidelity note if present; omit unknown nutrition and author fields.

- [ ] **Step 5: Verify generator behavior**

Run: `npm run test -- scripts/build-catalog.test.ts; npm run build:catalog`

Expected: tests PASS and `src/generated/catalog.json` contains only validated cookable recipes.

### Task 4: Implement serving scaling and local persistence primitives

**Files:**
- Create: `src/domain/servings.ts`, `src/domain/servings.test.ts`
- Create: `src/db/app-db.ts`, `src/db/app-db.test.ts`

**Interfaces:**
- Produces `scaleIngredients(recipe, targetServings): Ingredient[]`.
- Produces `appDb` tables: `settings`, `favorites`, `wanted`, `plans`, `shopping`, `imports`.

- [ ] **Step 1: Write failing serving tests**

```ts
it('scales numeric quantities and preserves textual quantities', () => {
  expect(scaleIngredients(recipeForTwo, 4)).toMatchObject([{ name: '鱼', amount: 2 }, { name: '盐', quantityText: '适量' }]);
});

it('does not scale a recipe without base servings', () => {
  expect(scaleIngredients(recipeWithoutBase, 4)).toEqual(recipeWithoutBase.ingredients);
});
```

- [ ] **Step 2: Implement `scaleIngredients`**

```ts
export function scaleIngredients(recipe: Recipe, targetServings: number): Ingredient[] {
  if (!recipe.baseServings) return recipe.ingredients;
  const ratio = targetServings / recipe.baseServings;
  return recipe.ingredients.map(item => item.amount === undefined ? item : { ...item, amount: roundAmount(item.amount * ratio) });
}

function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}
```

- [ ] **Step 3: Write and run a failing Dexie persistence test**

```ts
it('keeps device mode and favorite IDs across a database reopen', async () => {
  await appDb.settings.put({ key: 'mode', value: 'choose' });
  await appDb.favorites.put({ recipeId: 'beef-chow-fun' });
  expect(await appDb.settings.get('mode')).toMatchObject({ value: 'choose' });
});
```

Run: `npm run test -- src/db/app-db.test.ts`

Expected: FAIL because `appDb` is not defined.

- [ ] **Step 4: Define the database schema before re-running persistence tests**

```ts
export class AppDb extends Dexie {
  settings!: Table<{ key: 'mode'; value: 'cook' | 'choose' }, string>;
  favorites!: Table<{ recipeId: string }, string>;
  wanted!: Table<{ recipeId: string }, string>;
  plans!: Table<MealSlot, string>;
  shopping!: Table<ShoppingState, string>;
  imports!: Table<{ id: string; recipeIds: string[] }, string>;

  constructor() {
    super('family-recipe');
    this.version(1).stores({ settings: 'key', favorites: 'recipeId', wanted: 'recipeId', plans: 'id, date, meal', shopping: 'id', imports: 'id' });
  }
}

export const appDb = new AppDb();

export type MealSlot = { id: string; date: string; meal: 'lunch' | 'dinner' | 'breakfast' | 'snack'; recipeId: string; servings: number };
export type ShoppingState = { id: string; checked: boolean; manualLabel?: string };
```

- [ ] **Step 5: Re-run serving and persistence tests**

Run: `npm run test -- src/domain/servings.test.ts src/db/app-db.test.ts`

Expected: PASS.

### Task 5: Implement pure weekly-menu, nutrition, shopping, and sharing logic

**Files:**
- Create: `src/domain/menu.ts`, `src/domain/menu.test.ts`
- Create: `src/domain/share-code.ts`, `src/domain/share-code.test.ts`

**Interfaces:**
- Produces `createShoppingItems(plan, catalog)`, `summarizeNutrition(plan, catalog)`, `encodeSelection(ids)`, and `decodeSelection(text)`.
- UI tasks consume these pure functions rather than duplicating logic.

- [ ] **Step 1: Write failing shopping and nutrition tests**

```ts
it('merges only equal merge keys and equal units, and excludes pantry items', () => {
  expect(createShoppingItems(twoDishPlan, catalog)).toEqual([{ mergeKey: 'green-onion', unit: 'g', amount: 40 }]);
});

it('reports recipes without nutrition separately', () => {
  expect(summarizeNutrition(planWithUnknownRecipe, catalog).missingRecipeIds).toEqual(['tea-egg']);
});
```

- [ ] **Step 2: Implement pure aggregation functions**

For shopping, skip `pantry: true`; group by `mergeKey ?? name` plus `unit`; sum only defined numeric amounts. Put nonsummable items in distinct rows. For nutrition, sum known values and return `missingRecipeIds` explicitly.

```ts
export type ShoppingItem = { id: string; label: string; category: string; amount?: number; unit?: string };
export type NutritionSummary = { kcal: number; proteinG: number; carbsG: number; fatG: number; missingRecipeIds: string[] };

export function createShoppingItems(plan: MealSlot[], catalog: Recipe[]): ShoppingItem[] {
  const grouped = new Map<string, ShoppingItem>();
  for (const slot of plan) {
    const recipe = catalog.find(item => item.id === slot.recipeId);
    if (!recipe) continue;
    for (const ingredient of scaleIngredients(recipe, slot.servings)) {
      if (ingredient.pantry) continue;
      const key = ingredient.amount !== undefined && ingredient.unit ? `${ingredient.mergeKey ?? ingredient.name}|${ingredient.unit}` : `${slot.id}|${ingredient.name}`;
      const item = grouped.get(key) ?? { id: key, label: ingredient.name, category: ingredient.category ?? '其他', unit: ingredient.unit, amount: 0 };
      item.amount = ingredient.amount === undefined ? undefined : (item.amount ?? 0) + ingredient.amount;
      grouped.set(key, item);
    }
  }
  return [...grouped.values()];
}

export function summarizeNutrition(plan: MealSlot[], catalog: Recipe[]): NutritionSummary {
  return plan.reduce<NutritionSummary>((summary, slot) => {
    const recipe = catalog.find(item => item.id === slot.recipeId);
    if (!recipe?.nutrition) return { ...summary, missingRecipeIds: [...summary.missingRecipeIds, slot.recipeId] };
    const multiplier = recipe.baseServings ? slot.servings / recipe.baseServings : 1;
    return { ...summary, kcal: summary.kcal + (recipe.nutrition.kcal ?? 0) * multiplier, proteinG: summary.proteinG + (recipe.nutrition.proteinG ?? 0) * multiplier, carbsG: summary.carbsG + (recipe.nutrition.carbsG ?? 0) * multiplier, fatG: summary.fatG + (recipe.nutrition.fatG ?? 0) * multiplier };
  }, { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, missingRecipeIds: [] });
}
```

- [ ] **Step 3: Write failing selection-code tests**

```ts
it('round-trips selected recipe IDs', () => {
  expect(decodeSelection(encodeSelection(['beef-chow-fun']))).toEqual({ recipeIds: ['beef-chow-fun'] });
});

it('rejects unrelated pasted text', () => {
  expect(() => decodeSelection('今晚吃啥')).toThrow('无法识别点菜码');
});
```

- [ ] **Step 4: Implement the readable code format and verify**

Use a stable prefix and JSON payload, for example `家宴点菜: {"recipeIds":["beef-chow-fun"]}`. Decode only that prefix plus valid JSON. Run: `npm run test -- src/domain/menu.test.ts src/domain/share-code.test.ts`

Expected: PASS.

### Task 6: Build recipe-first browse and detail screens

**Files:**
- Create: `src/features/recipes/recipe-browser.tsx`, `src/features/recipes/recipe-detail.tsx`, `src/features/recipes/recipe-filters.ts`
- Create: `src/features/recipes/recipe-browser.test.tsx`, `src/features/recipes/recipe-detail.test.tsx`
- Modify: `src/app.tsx`, `src/styles/app.css`

**Interfaces:**
- Consumes generated `Recipe[]`, `scaleIngredients`, and `appDb` favorite/wanted state.
- Produces browse routes and recipe detail routes with explicit cook, add-to-menu, and want-to-eat actions.

- [ ] **Step 1: Write failing browser tests**

```tsx
it('finds a recipe by title and limits results to a selected cooking method', async () => {
  render(<RecipeBrowser catalog={fixtureCatalog} />);
  await userEvent.type(screen.getByRole('searchbox'), '牛河');
  expect(screen.getByText('干炒牛河')).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement filtered recipe selection**

```ts
export function filterRecipes(catalog: Recipe[], query: string, tags: string[]) {
  const needle = query.trim().toLocaleLowerCase();
  return catalog.filter(recipe => matchesQuery(recipe, needle) && tags.every(tag => recipe.tags?.includes(tag)));
}

function matchesQuery(recipe: Recipe, needle: string): boolean {
  if (!needle) return true;
  return [recipe.title, ...recipe.ingredients.map(item => item.name), ...(recipe.tags ?? [])]
    .join(' ')
    .toLocaleLowerCase()
    .includes(needle);
}
```

- [ ] **Step 3: Write detail tests for optional metadata and servings**

Assert that a source link is absent when `sourceUrl` is absent, that "暂无估算" appears without nutrition, and that a recipe with `baseServings` updates numeric displayed amounts when target servings changes.

- [ ] **Step 4: Implement accessible recipe cards and detail page**

Use semantic links, native range/stepper controls, and visible labels. Show source, author, nutrition, duration, and tags only when supplied. Do not add generated substitute values.

- [ ] **Step 5: Run focused UI tests**

Run: `npm run test -- src/features/recipes/recipe-browser.test.tsx src/features/recipes/recipe-detail.test.tsx`

Expected: PASS.

### Task 7: Build cooking mode and weekly planning views

**Files:**
- Create: `src/features/cooking/cooking-mode.tsx`, `src/features/cooking/cooking-mode.test.tsx`
- Create: `src/features/planner/week-planner.tsx`, `src/features/planner/week-planner.test.tsx`
- Modify: `src/app.tsx`, `src/styles/app.css`

**Interfaces:**
- Consumes recipe detail actions, `appDb.plans`, `summarizeNutrition`, and scaled ingredients.
- Produces the mobile guided cooker and desktop ingredient/step split view; weekly lunch/dinner planning.

- [ ] **Step 1: Write failing guided-cooking tests**

```tsx
it('moves to the next step and starts a step timer when present', async () => {
  render(<CookingMode recipe={recipeWithTimer} targetServings={2} />);
  await userEvent.click(screen.getByRole('button', { name: '完成并继续' }));
  expect(screen.getByText('第 2 步，共 3 步')).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement cooking mode**

Use one active-step state, native buttons for previous/next, a non-autostarting timer only when `timerSeconds` exists, and CSS media queries that reveal the persistent ingredients list on desktop.

- [ ] **Step 3: Write failing weekly-planner tests**

```tsx
it('adds a dish to Wednesday dinner and shows known nutrition totals', async () => {
  render(<WeekPlanner catalog={fixtureCatalog} />);
  await userEvent.click(screen.getByRole('button', { name: '添加到周三晚餐' }));
  expect(screen.getByText('周三晚餐')).toHaveTextContent('干炒牛河');
});
```

- [ ] **Step 4: Implement planner persistence and nutrition summary**

Model each slot as `{ date: 'YYYY-MM-DD', meal: 'lunch' | 'dinner' | 'breakfast' | 'snack', recipeId, servings }`. Display lunch and dinner by default; make breakfast and snack an explicit expansion.

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- src/features/cooking/cooking-mode.test.tsx src/features/planner/week-planner.test.tsx`

Expected: PASS.

### Task 8: Build the minimal shopping list and device-mode handoff

**Files:**
- Create: `src/features/shopping/shopping-list.tsx`, `src/features/shopping/shopping-list.test.tsx`
- Create: `src/features/choose/choose-mode.tsx`, `src/features/choose/choose-mode.test.tsx`
- Create: `src/features/import/import-selection.tsx`, `src/features/import/import-selection.test.tsx`
- Modify: `src/app.tsx`

**Interfaces:**
- Consumes `createShoppingItems`, `encodeSelection`, `decodeSelection`, catalog, and Dexie tables.
- Produces user shopping completion, manual additions, chooser code output, and cooking-device import inbox.

- [ ] **Step 1: Write failing shopping-list interaction tests**

```tsx
it('marks a generated item bought and saves a manual item', async () => {
  render(<ShoppingList catalog={fixtureCatalog} plan={fixturePlan} />);
  await userEvent.click(screen.getByRole('checkbox', { name: /葱/ }));
  await userEvent.type(screen.getByLabelText('添加一项'), '保鲜袋');
  expect(screen.getByText('保鲜袋')).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement the flat grouped list**

Render grocery-category headings and native checkboxes. Keep completed lines after uncompleted rows. Provide exactly one text input and add button for manual items; do not expose pantry inventory.

- [ ] **Step 3: Write failing chooser/import tests**

```tsx
it('creates a share code from wanted dishes and imports recognized dishes', async () => {
  render(<ChooseMode wantedRecipeIds={['beef-chow-fun']} />);
  expect(screen.getByRole('textbox', { name: '点菜码' })).toHaveValue(expect.stringContaining('beef-chow-fun'));
});
```

- [ ] **Step 4: Implement device mode routing**

In `choose` mode, show browse, wanted dishes, and send code only. In `cook` mode, show browse, planner, shopping, settings, and import. Import adds recognized IDs to an inbox; it never automatically writes meal-plan slots.

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- src/features/shopping/shopping-list.test.tsx src/features/choose/choose-mode.test.tsx src/features/import/import-selection.test.tsx`

Expected: PASS.

### Task 9: Finish responsive PWA behavior and regression coverage

**Files:**
- Create: `e2e/recipe-flow.spec.ts`, `e2e/offline.spec.ts`
- Modify: `vite.config.ts`, `src/styles/app.css`, `README.md`

**Interfaces:**
- Validates the production build and complete user workflows across mobile and desktop.

- [ ] **Step 1: Write Playwright flow tests**

```ts
test('mobile user can find a dish, plan it, and mark shopping complete', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: '干炒牛河' }).click();
  await page.getByRole('button', { name: '加入本周菜单' }).click();
  await page.getByRole('link', { name: '采购' }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
});
```

- [ ] **Step 2: Add desktop layout and offline assertions**

At `1440x900`, assert the sidebar and desktop cooking split view are visible. After a successful initial load, use Playwright's offline mode and assert the recipe browse screen still renders from the service-worker cache.

- [ ] **Step 3: Re-attempt the requested Apple/HIG skill installation before visual polish**

Use the approved `skill-installer` workflow to find, inspect, and install a credible Apple/HIG skill. If the platform authorization gateway remains unavailable, document that limitation in the final implementation note and keep the UI restrained, responsive, accessible, and free of fake Apple branding.

- [ ] **Step 4: Run the full verification suite**

Run:

```powershell
npm run build
npm run test
npx playwright test
```

Expected: all commands exit `0`; Playwright covers 390px and 1440px layouts plus offline browse.

- [ ] **Step 5: Update operating documentation**

Document local development, PWA installation, switching a device to choosing mode, sharing/importing a selection code, and adding validated canonical recipe records. State clearly that the source-index entries require curation before they can be cooked inside the app.
