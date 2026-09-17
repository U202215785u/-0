import { useEffect, useRef, useState } from 'react'
import type { Ingredient, Recipe } from '../../catalog/types'
import { scaleIngredients } from '../../domain/servings'
import { appDb } from '../../db/app-db'

const CATEGORY_ORDER = ['肉类', '水产', '蔬菜', '菌菇', '豆制品', '蛋类', '米面主食', '干货', '调味料', '乳制品', '其他']

function groupIngredients(ingredients: Ingredient[]): { category: string; items: Ingredient[] }[] {
  const groups = new Map<string, Ingredient[]>()
  for (const item of ingredients) {
    const category = item.category ?? '其他'
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category)!.push(item)
  }
  return CATEGORY_ORDER.filter((category) => groups.has(category))
    .map((category) => ({ category, items: groups.get(category)! }))
    .concat([...groups.entries()].filter(([category]) => !CATEGORY_ORDER.includes(category)).map(([category, items]) => ({ category, items })))
}

function recipeAmountText(item: Ingredient): string {
  if (item.amount !== undefined) return `${item.amount} ${item.unit ?? ''}`.trim()
  return item.quantityText ?? ''
}

export function RecipeDetail({ recipe, chooseOnly = false }: { recipe: Recipe; chooseOnly?: boolean }) {
  const initial = 2
  const [servings, setServings] = useState(initial)
  const [input, setInput] = useState(String(initial))
  const [favorite, setFavorite] = useState(false)
  const [wanted, setWanted] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'pending' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const invalid = useRef(false)
  const load = () => {
    setStatus('loading'); setFavorite(false); setWanted(false); setErrorMessage('')
    void Promise.all([appDb.favorites.get(recipe.id), appDb.wanted.get(recipe.id)]).then(([f, w]) => { setFavorite(Boolean(f)); setWanted(Boolean(w)); setStatus('ready') }).catch(() => setStatus('error'))
  }
  useEffect(() => {
    let active = true
    void Promise.all([appDb.favorites.get(recipe.id), appDb.wanted.get(recipe.id)]).then(([f, w]) => { if (active) { setFavorite(Boolean(f)); setWanted(Boolean(w)); setStatus('ready') } }).catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [recipe.id])
  const toggle = async (kind: 'favorite' | 'wanted') => {
    if (status !== 'ready') return
    const table = kind === 'favorite' ? appDb.favorites : appDb.wanted
    const active = kind === 'favorite' ? favorite : wanted
    setStatus('pending')
    try {
      if (active) await table.delete(recipe.id)
      else await table.put({ recipeId: recipe.id })
      if (kind === 'favorite') setFavorite(!active)
      else setWanted(!active)
      setErrorMessage(''); setStatus('ready')
    } catch { setErrorMessage('保存失败，请重试'); setStatus('ready') }
  }
  const changeServings = (value: string) => { setInput(value); const n = Number(value); if (value && Number.isInteger(n) && n > 0 && Number.isFinite(n)) { invalid.current = false; setServings(n) } else invalid.current = true }
  const stepServings = (delta: number) => { const next = Math.max(1, servings + delta); setServings(next); setInput(String(next)); invalid.current = false }
  const nutrition = recipe.nutrition
  const hasNutrition = nutrition && Object.values(nutrition).some((value) => value !== undefined)
  const scaled = scaleIngredients(recipe, servings)
  const groups = groupIngredients(scaled)
  const backHref = chooseOnly ? '#/choose' : '#/'
  const backLabel = chooseOnly ? '返回点菜' : '返回食谱'
  return <main className="recipe-detail">
    <header><a className="back-link" href={backHref}>{backLabel}</a><p className="eyebrow">{chooseOnly ? '点菜模式' : '家庭菜谱'}</p><h1>{recipe.title}</h1></header>
    {status === 'loading' && <p role="status">正在读取状态</p>}{status === 'pending' && <p role="status">正在保存</p>}{status === 'error' && <p role="alert">状态读取失败 <button type="button" onClick={load}>重试</button></p>}{errorMessage && <p role="alert">{errorMessage}</p>}
    <dl className="recipe-metrics">{recipe.durationMinutes !== undefined && <div><dt>时长</dt><dd>{recipe.durationMinutes} 分钟</dd></div>}{recipe.difficulty && <div><dt>难度</dt><dd>{recipe.difficulty}</dd></div>}{recipe.baseServings !== undefined && <div><dt>适用</dt><dd>{recipe.baseServings} 人份</dd></div>}{recipe.tags && recipe.tags.length > 0 && <div><dt>标签</dt><dd>{recipe.tags.join('、')}</dd></div>}</dl>
    <div className="actions">{!chooseOnly && <button type="button" disabled={status !== 'ready'} onClick={() => void toggle('favorite')}>{favorite ? '已收藏' : '收藏'}</button>}<button type="button" disabled={status !== 'ready'} onClick={() => void toggle('wanted')}>{wanted ? '已想吃' : '想吃'}</button>{!chooseOnly && <><a className="button-link" href={`#/recipes/${recipe.id}/cook?servings=${servings}`}>开始烹饪</a><a className="button-link" href={`#/planner?recipeId=${encodeURIComponent(recipe.id)}`}>加入菜单</a></>}</div>
    <section className="servings-stepper"><h2>份数</h2><div className="stepper"><button type="button" aria-label="减少份数" onClick={() => stepServings(-1)} disabled={servings <= 1}>−</button><input aria-label="份数" type="number" min="1" step="1" value={input} onChange={(event) => changeServings(event.target.value)} onBlur={() => { invalid.current = false; setInput(String(servings)) }} /><button type="button" aria-label="增加份数" onClick={() => stepServings(1)}>＋</button></div>{recipe.baseServings && <p className="stepper-hint">按 {recipe.baseServings} 人份菜谱缩放</p>}</section>
    {groups.map((group) => <section key={group.category} className="ingredient-group"><h2>{group.category}</h2><ul>{group.items.map((item, index) => <li key={`${item.name}-${index}`}>{recipeAmountText(item) ? `${recipeAmountText(item)} ${item.name}` : item.name}</li>)}</ul></section>)}
    <section><h2>营养</h2>{hasNutrition ? <dl className="nutrition-grid"><div><dt>热量</dt><dd>{nutrition.kcal !== undefined ? `${nutrition.kcal} 千卡` : '未提供'}</dd></div><div><dt>蛋白质</dt><dd>{nutrition.proteinG !== undefined ? `${nutrition.proteinG} 克` : '未提供'}</dd></div><div><dt>碳水</dt><dd>{nutrition.carbsG !== undefined ? `${nutrition.carbsG} 克` : '未提供'}</dd></div><div><dt>脂肪</dt><dd>{nutrition.fatG !== undefined ? `${nutrition.fatG} 克` : '未提供'}</dd></div></dl> : <p>暂无估算</p>}</section>
    <section><h2>步骤</h2><ol className="step-list">{recipe.steps.map((step, index) => <li key={index}>{step.text}{step.timerSeconds !== undefined && <span className="step-timer-chip">{Math.floor(step.timerSeconds / 60)} 分 {step.timerSeconds % 60} 秒</span>}</li>)}</ol></section>
    {recipe.author && <p className="source-line">作者：{recipe.author}</p>}
    {recipe.sourceUrl && <p className="source-line">来源：<a href={recipe.sourceUrl}>来源链接</a></p>}
    {recipe.sourceNote && <p className="source-note">{recipe.sourceNote}</p>}
  </main>
}