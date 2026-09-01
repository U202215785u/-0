import catalog from './generated/catalog.json'
import type { Recipe } from './catalog/types'
import { RecipeBrowser } from './features/recipes/recipe-browser'
import { RecipeDetail } from './features/recipes/recipe-detail'

export function App() {
  const id = window.location.hash.match(/^#\/recipes\/(.+)$/)?.[1]
  const recipe = (catalog as Recipe[]).find((item) => item.id === id)
  return recipe ? <RecipeDetail recipe={recipe} /> : <RecipeBrowser catalog={catalog as Recipe[]} />
}
