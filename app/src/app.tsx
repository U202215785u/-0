import catalog from './generated/catalog.json'
import type { Recipe } from './catalog/types'
import { RecipeBrowser } from './features/recipes/recipe-browser'
import { RecipeDetail } from './features/recipes/recipe-detail'
import { useSyncExternalStore } from 'react'
import { CookingMode } from './features/cooking/cooking-mode'
import { WeekPlanner } from './features/planner/week-planner'
import { ShoppingList } from './features/shopping/shopping-list'
import { ChooseMode } from './features/choose/choose-mode'
import { ImportSelection } from './features/import/import-selection'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { appDb } from './db/app-db'

function subscribeToHash(callback: () => void) { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback) }
function getHash() { return window.location.hash }

function AppNavigation() {
  return <nav aria-label="主导航" className="app-navigation">
    <a href="#/">找菜</a>
    <a href="#/planner">周计划</a>
    <a href="#/shopping">采购</a>
  </nav>
}

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => '')
  const id = hash.match(/^#\/recipes\/(.+)$/)?.[1]
  const cookId = hash.match(/^#\/recipes\/([^/]+)\/cook$/)?.[1]
  const recipe = (catalog as Recipe[]).find((item) => item.id === id)
  const cookingRecipe = (catalog as Recipe[]).find((item) => item.id === cookId)
  const chooseRecipeId = hash.match(/^#\/choose\/recipes\/([^/]+)$/)?.[1]
  const chooseRecipe = (catalog as Recipe[]).find((item) => item.id === chooseRecipeId)
  const planner = hash.match(/^#\/planner(?:\?recipeId=([^&]+))?$/)
  const [wantedIds, setWantedIds] = useState<string[]>([])
  const [plans, setPlans] = useState<import('./db/app-db').MealSlot[]>([])
  const [routeError, setRouteError] = useState(false)
  const [routeReload, setRouteReload] = useState(0)
  const generation = useRef(0)
  useEffect(() => {
    const token = ++generation.current
    let active = true
    setRouteError(false)
    void Promise.all([appDb.wanted.toArray(), appDb.plans.toArray()]).then(([wanted, nextPlans]) => {
      if (!active || token !== generation.current) return
      setWantedIds(wanted.map((item) => item.recipeId)); setPlans(nextPlans)
    }).catch(() => { if (active && token === generation.current) setRouteError(true) })
    return () => { active = false }
  }, [hash, routeReload])
  if (routeError) return <main><h1>读取本地状态失败</h1><p role="alert">暂时无法读取点菜和周计划状态。</p><button type="button" onClick={() => setRouteReload((value) => value + 1)}>重试</button></main>
  if (hash === '#/choose') return <ChooseMode wantedRecipeIds={wantedIds} catalog={catalog as Recipe[]} />
  if (chooseRecipe) return <RecipeDetail recipe={chooseRecipe} chooseOnly />
  if (hash === '#/choose/recipes') return <RecipeBrowser catalog={catalog as Recipe[]} chooseOnly />
  const withNavigation = (view: ReactNode) => <><AppNavigation />{view}</>
  if (hash === '#/shopping') return withNavigation(<ShoppingList catalog={catalog as Recipe[]} plan={plans} />)
  if (hash === '#/import') return withNavigation(<ImportSelection catalog={catalog as Recipe[]} />)
  if (planner) return withNavigation(<WeekPlanner catalog={catalog as Recipe[]} initialRecipeId={planner[1] ? decodeURIComponent(planner[1]) : undefined} />)
  if (cookingRecipe) return withNavigation(<CookingMode recipe={cookingRecipe} targetServings={cookingRecipe.baseServings ?? 1} />)
  return withNavigation(recipe ? <RecipeDetail recipe={recipe} /> : <RecipeBrowser catalog={catalog as Recipe[]} />)
}
