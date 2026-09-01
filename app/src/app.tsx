import catalog from './generated/catalog.json'
import type { Recipe } from './catalog/types'
import { RecipeBrowser } from './features/recipes/recipe-browser'
import { RecipeDetail } from './features/recipes/recipe-detail'
import { useSyncExternalStore } from 'react'
import { CookingMode } from './features/cooking/cooking-mode'
import { WeekPlanner } from './features/planner/week-planner'

function subscribeToHash(callback: () => void) { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback) }
function getHash() { return window.location.hash }

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => '')
  const id = hash.match(/^#\/recipes\/(.+)$/)?.[1]
  const cookId = hash.match(/^#\/recipes\/([^/]+)\/cook$/)?.[1]
  const recipe = (catalog as Recipe[]).find((item) => item.id === id)
  const cookingRecipe = (catalog as Recipe[]).find((item) => item.id === cookId)
  const planner = hash.match(/^#\/planner(?:\?recipeId=([^&]+))?$/)
  if (planner) return <WeekPlanner catalog={catalog as Recipe[]} initialRecipeId={planner[1] ? decodeURIComponent(planner[1]) : undefined} />
  if (cookingRecipe) return <CookingMode recipe={cookingRecipe} targetServings={cookingRecipe.baseServings ?? 1} />
  return recipe ? <RecipeDetail recipe={recipe} /> : <RecipeBrowser catalog={catalog as Recipe[]} />
}
