import { describe, expect, it } from 'vitest'
import type { Recipe } from '../catalog/types'
import { estimateNutrition, gramsFor, nutritionKeys, resolveProfile } from './nutrition'

const base: Recipe = {
  id: 'test',
  title: '测试菜',
  baseServings: 2,
  ingredients: [],
  steps: [{ text: '做熟' }],
}

function recipe(ingredients: Recipe['ingredients'], baseServings?: number): Recipe {
  return { ...base, ingredients, baseServings }
}

describe('resolveProfile', () => {
  it('prefers mergeKey profile and falls back to name-category approximation', () => {
    expect(resolveProfile({ name: '五花肉', mergeKey: 'pork-belly' }).profile?.kcal).toBe(508)
    expect(resolveProfile({ name: '神秘森林蘑菇', mergeKey: 'forest-mushroom' }).profile?.kcal).toBe(40)
    expect(resolveProfile({ name: '完全未知的东西' }).profile).toBeUndefined()
  })

  it('dispatches finer forms by name before mergeKey', () => {
    expect(resolveProfile({ name: '米饭', mergeKey: 'rice' }).profile?.kcal).toBe(130)
    expect(resolveProfile({ name: '大米', mergeKey: 'rice' }).profile?.kcal).toBe(364)
    expect(resolveProfile({ name: '腐竹', mergeKey: 'tofu-skin' }).profile?.kcal).toBe(445)
    expect(resolveProfile({ name: '千张', mergeKey: 'tofu-skin' }).profile?.kcal).toBe(250)
  })
})

describe('gramsFor unit conversion', () => {
  it('handles gram, millilitre, jin and liang', () => {
    expect(gramsFor({ name: '肉', amount: 200, unit: '克' })).toBe(200)
    expect(gramsFor({ name: '五花肉', amount: 2, unit: '斤' })).toBe(1000)
    expect(gramsFor({ name: '五花肉', amount: 3, unit: '两' })).toBe(150)
    expect(gramsFor({ name: '生抽', mergeKey: 'soy-sauce', amount: 10, unit: '毫升' })).toBeCloseTo(11.5)
    expect(gramsFor({ name: '排骨', amount: 500, unit: '克（约2小块）' })).toBe(500)
  })

  it('converts spoon and bowl units with food density', () => {
    expect(gramsFor({ name: '食用油', mergeKey: 'cooking-oil', amount: 2, unit: '汤匙' })).toBeCloseTo(27.6)
    expect(gramsFor({ name: '盐', mergeKey: 'salt', amount: 1, unit: '茶匙' })).toBeCloseTo(6)
    expect(gramsFor({ name: '米饭', mergeKey: 'rice', amount: 1, unit: '碗' })).toBe(150)
  })

  it('converts count units with per-food piece weight', () => {
    expect(gramsFor({ name: '鸡蛋', mergeKey: 'egg', amount: 2, unit: '个' })).toBe(100)
    expect(gramsFor({ name: '香蕉', amount: 3, unit: '根' })).toBeUndefined() // no profile count
  })

  it('parses embedded units and fractions in the name', () => {
    expect(gramsFor({ name: '大匙生抽', mergeKey: 'soy-sauce', amount: 1 })).toBeCloseTo(17.25)
    expect(gramsFor({ name: '/4小匙盐', mergeKey: 'salt', amount: 1 })).toBeCloseTo(1.5)
    expect(gramsFor({ name: '/4个嫩南瓜', mergeKey: 'pumpkin', amount: 1 })).toBeCloseTo(375)
    expect(gramsFor({ name: '半勺老抽', mergeKey: 'dark-soy-sauce', amount: 1 })).toBeCloseTo(5.9)
    expect(gramsFor({ name: '小半汤勺老抽', mergeKey: 'dark-soy-sauce', amount: 1 })).toBeCloseTo(7.08)
    expect(gramsFor({ name: '2根葱', mergeKey: 'scallion', amount: 2 })).toBe(60)
    // 名称内嵌的整数通常只是重复 amount，不额外乘数量
    expect(gramsFor({ name: '3个鸡蛋', mergeKey: 'egg', amount: 2 })).toBe(100)
    expect(gramsFor({ name: '15毫升蜂蜜', mergeKey: 'honey', amount: 15 })).toBeCloseTo(21.3)
  })

  it('prefers an explicit weight embedded in the name over count units', () => {
    expect(gramsFor({ name: '共1.5千克鸡腿', mergeKey: 'chicken', amount: 12, unit: '只' })).toBeCloseTo(1500)
    expect(gramsFor({ name: '约500克鱿鱼', mergeKey: 'squid', amount: 1, unit: '条' })).toBeCloseTo(425)
    expect(gramsFor({ name: '800克羊肉', mergeKey: 'lamb' })).toBe(800)
  })

  it('never invents grams for quantityText or missing amounts', () => {
    expect(gramsFor({ name: '盐', quantityText: '适量' })).toBeUndefined()
    expect(gramsFor({ name: '酱油' })).toBeUndefined()
  })
})

describe('estimateNutrition', () => {
  it('computes per-serving totals from quantified ingredients', () => {
    const n = estimateNutrition(recipe([
      { name: '番茄', amount: 300, unit: '克', mergeKey: 'tomato' },
      { name: '鸡蛋', amount: 100, unit: '克', mergeKey: 'egg' },
      { name: '食用油', amount: 10, unit: '毫升', mergeKey: 'cooking-oil' },
      { name: '盐', quantityText: '适量', mergeKey: 'salt' },
    ]))!
    expect(n.basis).toBe('per-serving')
    expect(n.source).toBe('estimated')
    expect(n.kcal).toBe(143) // (4×7.65 + 4×6.4 + 9×9.65) / 2, 4-4-9 系数折算
    expect(n.proteinG).toBe(7.7)
    expect(n.carbsG).toBe(6.4)
    expect(n.fatG).toBe(9.7)
    expect(n.quantityCoverage).toBe(0.75)
    expect(n.confidence).toBe('low')
    expect(n.missingIngredientNames).toEqual(['盐'])
    expect(n.note).toContain('下限')
    expect(n.calculationVersion).toBe('fooddb-2026-09-18')
  })

  it('is idempotent for the same recipe', () => {
    const input = recipe([{ name: '鸡胸肉', amount: 300, unit: '克', mergeKey: 'chicken-breast' }, { name: '米饭', amount: 200, unit: '克', mergeKey: 'rice' }])
    expect(estimateNutrition(input)).toEqual(estimateNutrition(input))
  })

  it('uses raw vs cooked rice by name', () => {
    expect(estimateNutrition(recipe([{ name: '大米', amount: 200, unit: '克', mergeKey: 'rice' }]))!.kcal).toBe(347)
    expect(estimateNutrition(recipe([{ name: '米饭', amount: 200, unit: '克', mergeKey: 'rice' }]))!.kcal).toBe(126)
  })

  it('returns undefined when nothing is quantified (never guesses)', () => {
    expect(estimateNutrition(recipe([{ name: '鸡肉', quantityText: '适量' }, { name: '盐', quantityText: '少许' }]))).toBeUndefined()
  })

  it('skips junk entries without counting them as missing', () => {
    const n = estimateNutrition(recipe([
      { name: '做法一：', amount: 1, unit: '个' },
      { name: '#主料', amount: 1, unit: '个' },
      { name: '鸡蛋', amount: 100, unit: '克', mergeKey: 'egg' },
    ]))!
    expect(n.quantityCoverage).toBe(1)
    expect(n.missingIngredientNames).toBeUndefined()
  })

  it('marks medium confidence only with full coverage and no approximations', () => {
    expect(estimateNutrition(recipe([{ name: '鸡蛋', amount: 100, unit: '克', mergeKey: 'egg' }]))!.confidence).toBe('medium')
    expect(estimateNutrition(recipe([{ name: '神秘森林蘑菇', amount: 200, unit: '克' }]))!.confidence).toBe('low')
  })

  it('defaults to two servings when baseServings is absent', () => {
    const n = estimateNutrition(recipe([{ name: '鸡蛋', amount: 100, unit: '克', mergeKey: 'egg' }], undefined))!
    expect(n.kcal).toBe(70) // (4×6.3 + 4×0.55 + 9×4.75)
  })

  it('gives no estimate when only zero-calorie items like salt or water are quantified', () => {
    expect(estimateNutrition(recipe([
      { name: '虾', quantityText: '适量', mergeKey: 'shrimp' },
      { name: '盐', amount: 10, unit: '克', mergeKey: 'salt' },
      { name: '清水', amount: 500, unit: '毫升', mergeKey: 'water' },
    ]))).toBeUndefined()
  })

  it('caps deep-frying oil instead of counting the whole pot', () => {
    const n = estimateNutrition(recipe([
      { name: '里脊肉', amount: 200, unit: '克', mergeKey: 'pork' },
      { name: '食用油', amount: 600, unit: '毫升', mergeKey: 'cooking-oil' },
    ]))!
    expect(n.note).toContain('折算')
    expect(n.kcal).toBeLessThan(1200)
    expect(n.fatG).toBeLessThan(60)
  })

  it('treats 鸡翅 by its own piece weight instead of whole chicken', () => {
    const n = estimateNutrition(recipe([{ name: '鸡翅', amount: 12, unit: '个', mergeKey: 'chicken' }]))!
    expect(n.kcal).toBeGreaterThan(400)
    expect(n.kcal).toBeLessThan(600)
  })

  it('keeps a stable nutrient key list', () => {
    expect(nutritionKeys).toEqual(['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'sugarG', 'saturatedFatG', 'sodiumMg'])
  })
})