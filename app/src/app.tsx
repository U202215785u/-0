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

const NAV_ITEMS = [
  { href: '#/', label: '找菜', icon: '🍽️', match: /^#\/$|^#\/recipes(\/|$)/ },
  { href: '#/choose', label: '点菜', icon: '💬', match: /^#\/choose/ },
  { href: '#/planner', label: '周计划', icon: '📅', match: /^#\/planner/ },
  { href: '#/shopping', label: '采购', icon: '🛒', match: /^#\/shopping/ },
] as const

function AppNavigation({ hash }: { hash: string }) {
  const items = NAV_ITEMS.map((item) => {
    const active = item.match.test(hash)
    const className = ['nav-link', active ? 'active' : ''].filter(Boolean).join(' ')
    return <a key={item.href} className={className} href={item.href} data-icon={item.icon} aria-current={active ? 'page' : undefined}>{item.label}</a>
  })
  return <>
    <nav aria-label="主导航" className="app-navigation">{items}<a className="nav-link" href="#/import">导入点菜码</a></nav>
    <nav aria-label="底部导航" className="bottom-navigation">{items}</nav>
    <div className="bottom-navigation-spacer" aria-hidden="true" />
  </>
}

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => '')
  const id = hash.match(/^#\/recipes\/(.+?)(?:\/|\?|$)/)?.[1]
  const cookMatch = hash.match(/^#\/recipes\/([^/]+)\/cook(?:\?servings=(\d+))?$/)
  const cookId = cookMatch?.[1]
  const cookServings = cookMatch?.[2]
  const recipe = (catalog as Recipe[]).find((item) => item.id === id)
  const cookingRecipe = (catalog as Recipe[]).find((item) => item.id === cookId)
  const chooseRecipeId = hash.match(/^#\/choose\/recipes\/([^/]+)$/)?.[1]
  const chooseRecipe = (catalog as Recipe[]).find((item) => item.id === chooseRecipeId)
  const planner = hash.match(/^#\/planner(?:\?recipeId=([^&]+))?$/)
  const [wantedIds, setWantedIds] = useState<string[]>([])
  const [plans, setPlans] = useState<import('./db/app-db').MealSlot[]>([])
  const [routeError, setRouteError] = useState(false)
  const [routeReload, setRouteReload] = useState(0)
  const [mode, setMode] = useState<'cook' | 'choose' | null>(null)
  const generation = useRef(0)
  useEffect(() => {
    const token = ++generation.current
    let active = true
    setRouteError(false)
    void Promise.all([appDb.wanted.toArray(), appDb.plans.toArray(), appDb.settings.get('mode')]).then(([wanted, nextPlans, settings]) => {
      if (!active || token !== generation.current) return
      setWantedIds(wanted.map((item) => item.recipeId)); setPlans(nextPlans); setMode(settings?.value ?? 'cook')
    }).catch(() => { if (active && token === generation.current) setRouteError(true) })
    return () => { active = false }
  }, [hash, routeReload])

  const persistMode = async (next: 'cook' | 'choose') => {
    setMode(next)
    try { await appDb.settings.put({ key: 'mode', value: next }) } catch { /* local-only preference */ }
  }
  const refreshWanted = async () => {
    try { setWantedIds((await appDb.wanted.toArray()).map((item) => item.recipeId)) } catch { setRouteError(true) }
  }
  if (routeError) return <main><h1>读取本地状态失败</h1><p role="alert">暂时无法读取点菜和周计划状态。</p><button type="button" onClick={() => setRouteReload((value) => value + 1)}>重试</button></main>
  if (hash === '#/choose') return <ChooseMode wantedRecipeIds={wantedIds} catalog={catalog as Recipe[]} onClearWanted={refreshWanted} onSwitchToCook={() => void persistMode('cook')} />
  if (chooseRecipe) return <RecipeDetail recipe={chooseRecipe} chooseOnly />
  if (hash === '#/choose/recipes') return <RecipeBrowser catalog={catalog as Recipe[]} chooseOnly />
  const withNavigation = (view: ReactNode) => <><AppNavigation hash={hash} />{view}</>
  if (hash === '#/shopping') return withNavigation(<ShoppingList catalog={catalog as Recipe[]} plan={plans} />)
  if (hash === '#/import') return withNavigation(<ImportSelection catalog={catalog as Recipe[]} />)
  if (planner) return withNavigation(<WeekPlanner catalog={catalog as Recipe[]} initialRecipeId={planner[1] ? decodeURIComponent(planner[1]) : undefined} />)
  if (cookingRecipe) return withNavigation(<CookingMode recipe={cookingRecipe} targetServings={cookServings ? Math.max(1, Number(cookServings)) : cookingRecipe.baseServings ?? 2} />)
  if (hash === '' && mode === 'choose') return <ChooseMode wantedRecipeIds={wantedIds} catalog={catalog as Recipe[]} onClearWanted={refreshWanted} onSwitchToCook={() => void persistMode('cook')} />
  return withNavigation(recipe ? <RecipeDetail recipe={recipe} /> : <RecipeBrowser catalog={catalog as Recipe[]} />)
}