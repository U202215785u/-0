import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Recipe } from './types'
import { getCatalogQualityIssues, assertCatalogQuality } from './quality'

function loadGeneratedCatalog(): Recipe[] {
  return JSON.parse(readFileSync(resolve('src/generated/catalog.json'), 'utf8')) as Recipe[]
}

function validRecipe(index: number): Recipe {
  return {
    id: `菜-${index}`,
    title: `家常菜${index}`,
    ingredients: [{ name: '鸡蛋', amount: 1, unit: '个', category: '蛋豆制品' }],
    steps: [{ text: '将鸡蛋打散，炒熟后装盘。', ingredientNames: ['鸡蛋'] }],
    baseServings: 2,
    sourceUrl: `https://example.com/recipes/${index}`,
    author: '公开作者',
    tags: ['快手菜'],
    durationMinutes: 20,
    difficulty: '简单',
  }
}

describe('catalog quality gate', () => {
  it('accepts a complete Chinese catalog and supports a ten-recipe spot check', () => {
    const catalog = Array.from({ length: 50 }, (_, index) => validRecipe(index))

    expect(getCatalogQualityIssues(catalog)).toEqual([])
    expect(catalog.slice(0, 10).every((recipe) => getCatalogQualityIssues([recipe], 1).length === 0)).toBe(true)
    expect(() => assertCatalogQuality(catalog)).not.toThrow()
  })

  it('reports missing recipe count, source metadata, and English execution fields', () => {
    const issues = getCatalogQualityIssues([{ ...validRecipe(1), title: 'English dish', author: undefined, sourceUrl: undefined }], 50)

    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'minimum-count',
      'missing-source-author',
      'missing-source-url',
      'english-execution-field',
    ]))
  })

  it('flags recipes that repeat a title or reuse the same source page', () => {
    const recipeA = validRecipe(1)
    const duplicateTitle = { ...validRecipe(2), title: recipeA.title }
    const duplicateSource = { ...validRecipe(3), sourceUrl: recipeA.sourceUrl }

    expect(getCatalogQualityIssues([recipeA, duplicateTitle, duplicateSource], 1).map((issue) => issue.code))
      .toEqual(expect.arrayContaining(['duplicate-title', 'duplicate-source-url']))
  })

  it('flags tag vocabulary, dimension, and count violations', () => {
    const unknown = { ...validRecipe(1), tags: ['神秘标签'] }
    const twoMethods = { ...validRecipe(2), tags: ['烤', '炒'] }
    const tooMany = { ...validRecipe(3), tags: ['炒', '主食', '家常菜', '快手菜', '素菜'] }

    const issues = getCatalogQualityIssues([unknown, twoMethods, tooMany], 1)
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['unknown-tag', 'tag-dimension-overflow', 'too-many-tags']))
  })

  it('builds the cookable catalog only from canonical recipe files', () => {
    const catalog = loadGeneratedCatalog()

    expect(catalog.length).toBeGreaterThanOrEqual(1)
    expect(catalog.every((recipe) => recipe.id && recipe.title && recipe.sourceUrl && recipe.author)).toBe(true)
    expect(catalog.every((recipe) => getCatalogQualityIssues([recipe], 1).length === 0)).toBe(true)
  })

  it('flags nutrition estimates whose macros contradict the declared calories', () => {
    const mismatched = {
      ...validRecipe(1),
      nutrition: { kcal: 300, proteinG: 10, carbsG: 60, fatG: 30, basis: 'per-serving' as const, quantityCoverage: 1 },
    }
    const zeroWithCoverage = {
      ...validRecipe(2),
      nutrition: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, basis: 'per-serving' as const, quantityCoverage: 0.9 },
    }

    expect(getCatalogQualityIssues([mismatched, zeroWithCoverage], 1).map((issue) => issue.code))
      .toEqual(expect.arrayContaining(['nutrition-macro-mismatch', 'nutrition-zero-kcal']))
  })
})
