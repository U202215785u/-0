import { describe, expect, it } from 'vitest'
import type { Recipe } from '../catalog/types'
import type { MealSlot } from '../db/app-db'
import { createShoppingItems, summarizeNutrition } from './menu'

const catalog: Recipe[] = [
  {
    id: 'dish-a', title: 'Dish A', baseServings: 2,
    ingredients: [
      { name: '葱', mergeKey: 'green-onion', amount: 10, unit: 'g' },
      { name: '盐', amount: 1, unit: 'g', pantry: true },
      { name: '油', amount: 1, unit: 'ml' },
    ], steps: [{ text: 'cook' }],
    nutrition: { kcal: 100, proteinG: 2, carbsG: 3, fatG: 4 },
  },
  {
    id: 'dish-b', title: 'Dish B', baseServings: 2,
    ingredients: [
      { name: '小葱', mergeKey: 'green-onion', amount: 30, unit: 'g' },
      { name: '油', amount: 2, unit: 'tbsp' },
    ], steps: [{ text: 'cook' }],
    nutrition: { kcal: 50 },
  },
]

const plan: MealSlot[] = [
  { id: 'slot-a', date: '2026-09-01', meal: 'dinner', recipeId: 'dish-a', servings: 4 },
  { id: 'slot-b', date: '2026-09-02', meal: 'lunch', recipeId: 'dish-b', servings: 2 },
]

describe('createShoppingItems', () => {
  it('merges equal keys and units while excluding pantry items', () => {
    expect(createShoppingItems(plan, catalog)).toEqual([
      { id: 'green-onion|g', label: '葱', category: '其他', unit: 'g', amount: 50 },
      { id: '油|ml', label: '油', category: '其他', unit: 'ml', amount: 2 },
      { id: '油|tbsp', label: '油', category: '其他', unit: 'tbsp', amount: 2 },
    ])
  })

  it('keeps nonsummable ingredients distinct', () => {
    const nonsummable = [{ ...catalog[0], ingredients: [{ name: '适量酱油' }] }]
    expect(createShoppingItems([
      { ...plan[0], recipeId: 'dish-a' }, { ...plan[1], id: 'slot-c', recipeId: 'dish-a' },
    ], nonsummable)).toHaveLength(2)
  })

  it('merges equal-key numeric ingredients without a unit', () => {
    const unitlessCatalog: Recipe[] = [
      { ...catalog[0], ingredients: [{ name: '葱', mergeKey: 'green-onion', amount: 2 }] },
      { ...catalog[1], ingredients: [{ name: '小葱', mergeKey: 'green-onion', amount: 2 }] },
    ]
    const unitlessPlan = plan.map((slot) => ({ ...slot, servings: 2 }))
    expect(createShoppingItems(unitlessPlan, unitlessCatalog)).toEqual([
      { id: 'green-onion|<undefined>', label: '葱', category: '其他', unit: undefined, amount: 4 },
    ])
  })
})

describe('summarizeNutrition', () => {
  it('scales and sums known nutrition and lists unknown recipes', () => {
    expect(summarizeNutrition([...plan, { ...plan[0], id: 'missing', recipeId: 'tea-egg' }], catalog))
      .toEqual({ kcal: 250, proteinG: 4, carbsG: 6, fatG: 8, missingRecipeIds: ['tea-egg'] })
  })
})
