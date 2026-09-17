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

  it('builds the cookable catalog only from canonical recipe files', () => {
    const catalog = loadGeneratedCatalog()

    expect(catalog.length).toBeGreaterThanOrEqual(1)
    expect(catalog.every((recipe) => recipe.id && recipe.title && recipe.sourceUrl && recipe.author)).toBe(true)
    expect(catalog.every((recipe) => getCatalogQualityIssues([recipe], 1).length === 0)).toBe(true)
  })
})
