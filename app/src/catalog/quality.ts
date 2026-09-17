import type { Recipe } from './types';

export type QualityIssueCode =
  | 'minimum-count'
  | 'duplicate-id'
  | 'missing-source-author'
  | 'missing-source-url'
  | 'missing-duration'
  | 'missing-difficulty'
  | 'english-execution-field';

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

export function getCatalogQualityIssues(catalog: Recipe[], minimumCount = 50): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (catalog.length < minimumCount) {
    issues.push({ code: 'minimum-count', detail: `catalog has ${catalog.length} recipes, expected at least ${minimumCount}` });
  }

  const seen = new Set<string>();
  for (const recipe of catalog) {
    if (seen.has(recipe.id)) issues.push({ code: 'duplicate-id', recipeId: recipe.id });
    seen.add(recipe.id);
    if (!recipe.sourceUrl?.trim()) issues.push({ code: 'missing-source-url', recipeId: recipe.id });
    if (!recipe.author?.trim()) issues.push({ code: 'missing-source-author', recipeId: recipe.id });
    if (recipe.durationMinutes === undefined) issues.push({ code: 'missing-duration', recipeId: recipe.id });
    if (recipe.difficulty === undefined) issues.push({ code: 'missing-difficulty', recipeId: recipe.id });
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