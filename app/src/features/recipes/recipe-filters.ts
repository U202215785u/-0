import type { Recipe } from '../../catalog/types'

export function filterRecipes(catalog: Recipe[], query: string, tags: string[]) {
  const needle = query.trim().toLocaleLowerCase()
  return catalog.filter((recipe) => matchesQuery(recipe, needle) && tags.every((tag) => recipe.tags?.includes(tag)))
}

function matchesQuery(recipe: Recipe, needle: string) {
  if (!needle) return true
  return [recipe.title, ...recipe.ingredients.map((item) => item.name), ...(recipe.tags ?? [])].join(' ').toLocaleLowerCase().includes(needle)
}
