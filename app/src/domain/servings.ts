import type { Ingredient, Recipe } from '../catalog/types'

export function scaleIngredients(recipe: Recipe, targetServings: number): Ingredient[] {
  if (!recipe.baseServings) return recipe.ingredients

  const ratio = targetServings / recipe.baseServings
  return recipe.ingredients.map((item) =>
    item.amount === undefined ? item : { ...item, amount: roundAmount(item.amount * ratio) },
  )
}

function roundAmount(value: number): number {
  return Math.round(value * 100) / 100
}
