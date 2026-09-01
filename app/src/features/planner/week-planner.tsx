import { useEffect, useMemo, useRef, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb, type MealSlot } from '../../db/app-db'
import { summarizeNutrition } from '../../domain/menu'

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const meals = [{ key: 'lunch', label: '午餐' }, { key: 'dinner', label: '晚餐' }] as const

export function formatLocalDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function dateFor(dayIndex: number, baseDate = new Date()) { const monday = new Date(baseDate); const offset = (baseDate.getDay() + 6) % 7; monday.setDate(baseDate.getDate() - offset + dayIndex); return formatLocalDate(monday) }

export function normalizeSlots(records: MealSlot[]) {
  const bySlot = new Map<string, MealSlot>()
  const legacyIds: string[] = []
  for (const record of records) {
    const canonicalId = `${record.date}-${record.meal}`
    if (record.id !== canonicalId) legacyIds.push(record.id)
    bySlot.set(canonicalId, { ...record, id: canonicalId })
  }
  return { slots: [...bySlot.values()], legacyIds }
}

async function migrateSlots(records: MealSlot[], token: number, current: (token: number) => boolean) {
  const normalized = normalizeSlots(records)
  if (normalized.legacyIds.length === 0) return normalized
  const canonicalIds = new Set(records.map((record) => record.id))
  await appDb.transaction('rw', appDb.plans, async () => {
    if (!current(token)) throw new Error('stale planner load')
    for (const slot of normalized.slots) {
      if (!current(token)) throw new Error('stale planner load')
      const existing = await appDb.plans.get(slot.id)
      if (!existing || canonicalIds.has(slot.id)) await appDb.plans.put(slot)
    }
    if (!current(token)) throw new Error('stale planner load')
    for (const id of normalized.legacyIds) {
      await appDb.plans.delete(id)
    }
  })
  return normalized
}

export function WeekPlanner({ catalog, initialRecipeId }: { catalog: Recipe[]; initialRecipeId?: string }) {
  const [slots, setSlots] = useState<MealSlot[]>([])
  const [expanded, setExpanded] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState(initialRecipeId && catalog.some((item) => item.id === initialRecipeId) ? initialRecipeId : catalog[0]?.id ?? '')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [errorKind, setErrorKind] = useState<'load' | 'save'>('load')
  const [errorMessage, setErrorMessage] = useState('')
  const [failedSlot, setFailedSlot] = useState<MealSlot | null>(null)
  const generation = useRef(0)
  const begin = () => ++generation.current
  const current = (token: number) => generation.current === token

  useEffect(() => {
    setSelectedRecipeId((value) => initialRecipeId && catalog.some((item) => item.id === initialRecipeId)
      ? initialRecipeId
      : catalog.some((item) => item.id === value) ? value : catalog[0]?.id ?? '')
  }, [initialRecipeId, catalog])

  const load = async () => {
    const token = begin()
    setStatus('loading'); setErrorKind('load'); setErrorMessage(''); setFailedSlot(null)
    try {
      const records = await appDb.plans.toArray()
      if (!current(token)) return
      const normalized = await migrateSlots(records, token, current)
      if (current(token)) { setSlots(normalized.slots); setStatus('ready') }
    } catch {
      if (current(token)) { setStatus('error'); setErrorKind('load'); setErrorMessage('读取周计划失败，请重试') }
    }
  }
  useEffect(() => { void load(); return () => { generation.current += 1 } }, [])

  const summary = useMemo(() => summarizeNutrition(slots, catalog), [slots, catalog])
  const saveSlot = async (slot: MealSlot) => {
    const token = begin()
    setStatus('saving'); setErrorKind('save'); setErrorMessage(''); setFailedSlot(null)
    try {
      await appDb.plans.put(slot)
      if (current(token)) { setSlots((value) => [...value.filter((item) => item.id !== slot.id), slot]); setStatus('ready') }
    } catch {
      if (current(token)) { setFailedSlot(slot); setErrorKind('save'); setErrorMessage('保存周计划失败，请重试'); setStatus('error') }
    }
  }
  const add = (dayIndex: number, meal: MealSlot['meal']) => { const recipe = catalog.find((item) => item.id === selectedRecipeId); if (!recipe || status !== 'ready') return; void saveSlot({ id: `${dateFor(dayIndex)}-${meal}`, date: dateFor(dayIndex), meal, recipeId: recipe.id, servings: recipe.baseServings ?? 1 }) }
  const disabled = status !== 'ready' || catalog.length === 0 || !catalog.some((item) => item.id === selectedRecipeId)
  const retry = () => errorKind === 'save' && failedSlot ? void saveSlot(failedSlot) : void load()

  return <main className="week-planner"><header><a href="#/recipes">返回食谱</a><h1>周计划</h1><p>本周菜单与营养概览</p></header>
    {status === 'loading' && <p role="status">正在读取周计划</p>}{status === 'saving' && <p role="status">正在保存周计划</p>}{status === 'error' && <p role="alert">{errorMessage} <button type="button" onClick={retry}>{errorKind === 'save' ? '重试保存' : '重试'}</button></p>}{catalog.length === 0 && <p role="alert">暂无可用食谱</p>}
    <label>菜单食谱<select aria-label="菜单食谱" value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)} disabled={disabled}>{catalog.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></label>
    <section className="nutrition-summary"><h2>营养汇总</h2><p>{summary.kcal} 千卡 · 蛋白质 {summary.proteinG} 克 · 碳水 {summary.carbsG} 克 · 脂肪 {summary.fatG} 克</p>{summary.missingRecipeIds.length > 0 && <p role="status">部分食谱暂无营养数据</p>}</section>
    <button type="button" onClick={() => setExpanded(!expanded)} disabled={status !== 'ready'}>{expanded ? '收起早餐和零食' : '展开早餐和零食'}</button>
    <div className="planner-grid">{days.map((day, dayIndex) => <section key={day} className="planner-day"><h2>{day}</h2>{[...meals, ...(expanded ? [{ key: 'breakfast', label: '早餐' }, { key: 'snack', label: '零食' }] as const : [])].map((meal) => { const slot = slots.find((item) => item.date === dateFor(dayIndex) && item.meal === meal.key); const recipe = catalog.find((item) => item.id === slot?.recipeId); const selected = catalog.find((item) => item.id === selectedRecipeId); return <div className="planner-slot" key={meal.key}><h3>{day}{meal.label}</h3>{recipe ? <p>{recipe.title}</p> : <p>未安排</p>}<button type="button" aria-label={`添加到${day}${meal.label}`} onClick={() => add(dayIndex, meal.key)} disabled={disabled}>添加{selected?.title ?? '食谱'}</button></div>})}</section>)}</div>
  </main>
}
