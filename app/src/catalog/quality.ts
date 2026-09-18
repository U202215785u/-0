import type { Recipe } from './types';
import { getRecipeTagIssues } from './tags';

export type QualityIssueCode =
  | 'minimum-count'
  | 'duplicate-id'
  | 'duplicate-title'
  | 'duplicate-source-url'
  | 'missing-source-author'
  | 'missing-source-url'
  | 'missing-duration'
  | 'missing-difficulty'
  | 'english-execution-field'
  | 'unknown-tag'
  | 'duplicate-tag'
  | 'tag-dimension-overflow'
  | 'too-many-tags'
  | 'nutrition-macro-mismatch'
  | 'nutrition-zero-kcal';

export type QualityIssue = {
  code: QualityIssueCode;
  recipeId?: string;
  detail?: string;
};

const ENGLISH_PATTERN = /[A-Za-z]/;

function isEnglishText(value: string): boolean {
  return ENGLISH_PATTERN.test(value);
}

function executionFieldIssues(recipe: Recipe): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const push = (detail: string) => issues.push({ code: 'english-execution-field', recipeId: recipe.id, detail });

  if (isEnglishText(recipe.title)) push('title');
  recipe.ingredients.forEach((ingredient, index) => {
    if (isEnglishText(ingredient.name)) push(`ingredients[${index}].name`);
    if (ingredient.quantityText !== undefined && isEnglishText(ingredient.quantityText)) push(`ingredients[${index}].quantityText`);
    if (ingredient.unit !== undefined && isEnglishText(ingredient.unit)) push(`ingredients[${index}].unit`);
  });
  recipe.steps.forEach((step, index) => {
    if (isEnglishText(step.text)) push(`steps[${index}].text`);
  });
  recipe.tags?.forEach((tag, index) => {
    if (isEnglishText(tag)) push(`tags[${index}]`);
  });
  if (recipe.difficulty !== undefined && isEnglishText(recipe.difficulty)) push('difficulty');
  return issues;
}

function nutritionIssues(recipe: Recipe): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const nutrition = recipe.nutrition;
  if (!nutrition) return issues;

  const kcal = nutrition.kcal;
  const proteinG = nutrition.proteinG;
  const carbsG = nutrition.carbsG;
  const fatG = nutrition.fatG;
  if (kcal === 0 && (nutrition.quantityCoverage ?? 0) > 0 && proteinG !== undefined && carbsG !== undefined && fatG !== undefined) {
    issues.push({ code: 'nutrition-zero-kcal', recipeId: recipe.id, detail: 'coverage > 0 but 0 kcal estimate' });
  }
  if (kcal !== undefined && kcal > 0 && proteinG !== undefined && carbsG !== undefined && fatG !== undefined) {
    const fromMacros = proteinG * 4 + carbsG * 4 + fatG * 9;
    if (Math.abs(fromMacros - kcal) / kcal > 0.35) {
      issues.push({
        code: 'nutrition-macro-mismatch',
        recipeId: recipe.id,
        detail: `macro sum ${Math.round(fromMacros)} kcal vs declared ${Math.round(kcal)} kcal`,
      });
    }
  }
  return issues;
}

export function getCatalogQualityIssues(catalog: Recipe[], minimumCount = 50): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (catalog.length < minimumCount) {
    issues.push({ code: 'minimum-count', detail: `catalog has ${catalog.length} recipes, expected at least ${minimumCount}` });
  }

  const seen = new Set<string>();
  const titles = new Map<string, string>();
  const sources = new Map<string, string>();
  for (const recipe of catalog) {
    if (seen.has(recipe.id)) issues.push({ code: 'duplicate-id', recipeId: recipe.id });
    seen.add(recipe.id);
    const existingTitle = recipe.title.trim() && titles.get(recipe.title.trim());
    if (existingTitle !== undefined) issues.push({ code: 'duplicate-title', recipeId: recipe.id, detail: `title "${recipe.title}" also used by ${existingTitle}` });
    if (recipe.title.trim()) titles.set(recipe.title.trim(), recipe.id);
    if (recipe.sourceUrl?.trim()) {
      const existingSource = sources.get(recipe.sourceUrl.trim());
      if (existingSource !== undefined) issues.push({ code: 'duplicate-source-url', recipeId: recipe.id, detail: `source ${recipe.sourceUrl} also used by ${existingSource}` });
      else sources.set(recipe.sourceUrl.trim(), recipe.id);
    }
    if (!recipe.sourceUrl?.trim()) issues.push({ code: 'missing-source-url', recipeId: recipe.id });
    if (!recipe.author?.trim()) issues.push({ code: 'missing-source-author', recipeId: recipe.id });
    if (recipe.durationMinutes === undefined) issues.push({ code: 'missing-duration', recipeId: recipe.id });
    if (recipe.difficulty === undefined) issues.push({ code: 'missing-difficulty', recipeId: recipe.id });
    for (const issue of getRecipeTagIssues(recipe)) {
      issues.push({
        code: issue.code,
        recipeId: recipe.id,
        detail: issue.detail ?? issue.tag,
      });
    }
    issues.push(...nutritionIssues(recipe));
    issues.push(...executionFieldIssues(recipe));
  }

  return issues;
}

export function assertCatalogQuality(catalog: Recipe[], minimumCount = 50): void {
  const issues = getCatalogQualityIssues(catalog, minimumCount);
  if (issues.length === 0) return;
  const summary = issues
    .map((issue) => `${issue.code}${issue.recipeId ? ` ${issue.recipeId}` : ''}${issue.detail ? ` (${issue.detail})` : ''}`)
    .join('\n  - ');
  throw new Error(`Catalog quality gate failed:\n  - ${summary}`);
}