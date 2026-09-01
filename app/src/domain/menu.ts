import type { Recipe } from '../catalog/types'
import type { MealSlot } from '../db/app-db'
import { scaleIngredients } from './servings'

export type ShoppingItem = {
  id: string
  label: string
  category: string
  amount?: number
  unit?: string
}

export type NutritionSummary = {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  missingRecipeIds: string[]
}

export function createShoppingItems(plan: MealSlot[], catalog: Recipe[]): ShoppingItem[] {
  const grouped = new Map<string, ShoppingItem>()

  for (const slot of plan) {
    const recipe = catalog.find((item) => item.id === slot.recipeId)
    if (!recipe) continue

    for (const ingredient of scaleIngredients(recipe, slot.servings)) {
      if (ingredient.pantry) continue

      const summable = typeof ingredient.amount === 'number' && ingredient.unit !== undefined
      const key = summable
        ? `${ingredient.mergeKey ?? ingredient.name}|${ingredient.unit}`
        : `${slot.id}|${ingredient.name}`
      const existing = grouped.get(key)

      if (existing) {
        existing.amount = (existing.amount ?? 0) + (ingredient.amount ?? 0)
      } else {
        grouped.set(key, {
          id: key,
          label: ingredient.name,
          category: ingredient.category ?? '其他',
          amount: ingredient.amount,
          unit: ingredient.unit,
        })
      }
    }
  }

  return [...grouped.values()]
}

export function summarizeNutrition(plan: MealSlot[], catalog: Recipe[]): NutritionSummary {
  const summary: NutritionSummary = {
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    missingRecipeIds: [],
  }
  const missing = new Set<string>()

  for (const slot of plan) {
    const recipe = catalog.find((item) => item.id === slot.recipeId)
    if (!recipe?.nutrition) {
      missing.add(slot.recipeId)
      continue
    }

    const multiplier = recipe.baseServings ? slot.servings / recipe.baseServings : 1
    summary.kcal += (recipe.nutrition.kcal ?? 0) * multiplier
    summary.proteinG += (recipe.nutrition.proteinG ?? 0) * multiplier
    summary.carbsG += (recipe.nutrition.carbsG ?? 0) * multiplier
    summary.fatG += (recipe.nutrition.fatG ?? 0) * multiplier
  }

  summary.missingRecipeIds = [...missing]
  return summary
}
