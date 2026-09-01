import { useEffect, useMemo, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb, type MealSlot } from '../../db/app-db'
import { summarizeNutrition } from '../../domain/menu'

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const meals = [{ key: 'lunch', label: '午餐' }, { key: 'dinner', label: '晚餐' }] as const
export function formatLocalDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function dateFor(dayIndex: number, baseDate = new Date()) { const monday = new Date(baseDate); const offset = (baseDate.getDay() + 6) % 7; monday.setDate(baseDate.getDate() - offset + dayIndex); return formatLocalDate(monday) }

export function WeekPlanner({ catalog, initialRecipeId }: { catalog: Recipe[]; initialRecipeId?: string }) {
  const [slots, setSlots] = useState<MealSlot[]>([])
  const [expanded, setExpanded] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState(initialRecipeId && catalog.some((item) => item.id === initialRecipeId) ? initialRecipeId : catalog[0]?.id ?? '')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const load = async () => { setStatus('loading'); setErrorMessage(''); try { setSlots(await appDb.plans.toArray()); setStatus('ready') } catch { setStatus('error'); setErrorMessage('读取周计划失败，请重试') } }
  useEffect(() => { let active = true; void appDb.plans.toArray().then((value) => { if (active) { setSlots(value); setStatus('ready') } }).catch(() => { if (active) { setStatus('error'); setErrorMessage('读取周计划失败，请重试') } }); return () => { active = false } }, [])
  const summary = useMemo(() => summarizeNutrition(slots, catalog), [slots, catalog])
  const add = async (dayIndex: number, meal: MealSlot['meal']) => { const recipe = catalog.find((item) => item.id === selectedRecipeId); if (!recipe || status !== 'ready') return; const slot: MealSlot = { id: `${dateFor(dayIndex)}-${meal}`, date: dateFor(dayIndex), meal, recipeId: recipe.id, servings: recipe.baseServings ?? 1 }; setStatus('saving'); try { await appDb.plans.put(slot); setSlots((current) => [...current.filter((item) => item.id !== slot.id), slot]); setStatus('ready') } catch { setStatus('error'); setErrorMessage('保存周计划失败，请重试') } }
  const disabled = status !== 'ready' || catalog.length === 0
  return <main className="week-planner"><header><a href="#/recipes">返回食谱</a><h1>周计划</h1><p>本周菜单与营养概览</p></header>
    {status === 'loading' && <p role="status">正在读取周计划</p>}{status === 'saving' && <p role="status">正在保存周计划</p>}{status === 'error' && <p role="alert">{errorMessage} <button type="button" onClick={() => void load()}>重试</button></p>}{catalog.length === 0 && <p role="alert">暂无可用食谱</p>}
    <label>菜单食谱<select aria-label="菜单食谱" value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)} disabled={disabled}>{catalog.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></label>
    <section className="nutrition-summary"><h2>营养汇总</h2><p>{summary.kcal} 千卡 · 蛋白质 {summary.proteinG} 克 · 碳水 {summary.carbsG} 克 · 脂肪 {summary.fatG} 克</p>{summary.missingRecipeIds.length > 0 && <p role="status">部分食谱暂无营养数据</p>}</section>
    <button type="button" onClick={() => setExpanded(!expanded)} disabled={status !== 'ready'}>{expanded ? '收起早餐和零食' : '展开早餐和零食'}</button>
    <div className="planner-grid">{days.map((day, dayIndex) => <section key={day} className="planner-day"><h2>{day}</h2>{[...meals, ...(expanded ? [{ key: 'breakfast', label: '早餐' }, { key: 'snack', label: '零食' }] as const : [])].map((meal) => { const slot = slots.find((item) => item.date === dateFor(dayIndex) && item.meal === meal.key); const recipe = catalog.find((item) => item.id === slot?.recipeId); const selected = catalog.find((item) => item.id === selectedRecipeId); return <div className="planner-slot" key={meal.key}><h3>{day}{meal.label}</h3>{recipe ? <p>{recipe.title}</p> : <p>未安排</p>}<button type="button" aria-label={`添加到${day}${meal.label}`} onClick={() => void add(dayIndex, meal.key)} disabled={disabled}>添加{selected?.title ?? '食谱'}</button></div>})}</section>)}</div>
    </main>
}
