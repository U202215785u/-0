import catalog from './generated/catalog.json'
import type { Recipe } from './catalog/types'
import { RecipeBrowser } from './features/recipes/recipe-browser'
import { RecipeDetail } from './features/recipes/recipe-detail'
import { useSyncExternalStore } from 'react'

function subscribeToHash(callback: () => void) { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback) }
function getHash() { return window.location.hash }

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => '')
  const id = hash.match(/^#\/recipes\/(.+)$/)?.[1]
  const recipe = (catalog as Recipe[]).find((item) => item.id === id)
  return recipe ? <RecipeDetail recipe={recipe} /> : <RecipeBrowser catalog={catalog as Recipe[]} />
}
