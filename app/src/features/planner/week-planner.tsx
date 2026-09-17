import { useEffect, useMemo, useRef, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb, type MealSlot } from '../../db/app-db'
import { summarizeNutrition } from '../../domain/menu'
import { useIsMobile } from '../../hooks/use-is-mobile'
import { dateFor, days, normalizeSlots, shortDateText, weekdayIndex } from './planner-utils'

const mainMeals = [{ key: 'lunch', label: '午餐' }, { key: 'dinner', label: '晚餐' }] as const
const extraMeals = [{ key: 'breakfast', label: '早餐' }, { key: 'snack', label: '零食' }] as const

async function migrateSlots(records: MealSlot[], token: number, current: (token: number) => boolean) {
  const normalized = normalizeSlots(records)
  if (normalized.legacyIds.length === 0) return normalized
  const canonicalIds = new Set(records.map((record) => record.id))
  const retained = new Map(normalized.slots.map((slot) => [slot.id, slot]))
  await appDb.transaction('rw', appDb.plans, async () => {
    if (!current(token)) throw new Error('stale planner load')
    for (const slot of normalized.slots) {
      if (!current(token)) throw new Error('stale planner load')
      const existing = await appDb.plans.get(slot.id)
      if (!existing || canonicalIds.has(slot.id)) {
        await appDb.plans.put(slot)
      } else {
        retained.set(slot.id, existing)
      }
    }
    if (!current(token)) throw new Error('stale planner load')
    for (const id of normalized.legacyIds) {
      await appDb.plans.delete(id)
    }
  })
  return { ...normalized, slots: normalized.slots.map((slot) => retained.get(slot.id) ?? slot) }
}

function ServingsControl({ slot, onUpdate, disabled }: { slot: MealSlot; onUpdate: (next: MealSlot) => void; disabled: boolean }) {
  const step = (delta: number) => { const next = Math.max(1, slot.servings + delta); if (next !== slot.servings) onUpdate({ ...slot, servings: next }) }
  return <div className="inline-stepper"><button type="button" aria-label="减少份数" onClick={() => step(-1)} disabled={disabled || slot.servings <= 1}>−</button><span aria-label="份数">{slot.servings} 人份</span><button type="button" aria-label="增加份数" onClick={() => step(1)} disabled={disabled}>＋</button></div>
}

export function WeekPlanner({ catalog, initialRecipeId }: { catalog: Recipe[]; initialRecipeId?: string }) {
  const isMobile = useIsMobile()
  const [slots, setSlots] = useState<MealSlot[]>([])
  const [expanded, setExpanded] = useState(false)
  const [selectedDay, setSelectedDay] = useState(() => weekdayIndex())
  const [selectedRecipeId, setSelectedRecipeId] = useState(() => initialRecipeId && catalog.some((item) => item.id === initialRecipeId) ? initialRecipeId : catalog[0]?.id ?? '')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [failedSlot, setFailedSlot] = useState<MealSlot | null>(null)
  const [failedAction, setFailedAction] = useState<'save' | 'remove' | null>(null)
  const generation = useRef(0)
  const begin = () => ++generation.current
  const current = (token: number) => generation.current === token

  const applyLoad = (slots: MealSlot[]) => { setSlots(slots); setStatus('ready') }
  const applyLoadError = () => { setStatus('error'); setErrorMessage('读取周计划失败，请重试') }
  const load = async () => {
    const token = begin()
    try {
      const records = await appDb.plans.toArray()
      if (!current(token)) return
      const normalized = await migrateSlots(records, token, current)
      if (current(token)) applyLoad(normalized.slots)
    } catch {
      if (current(token)) applyLoadError()
    }
  }
  useEffect(() => {
    const token = begin()
    void appDb.plans.toArray()
      .then(async (records) => { if (!current(token)) return null; return migrateSlots(records, token, current) })
      .then((normalized) => { if (current(token) && normalized) applyLoad(normalized.slots) })
      .catch(() => { if (current(token)) applyLoadError() })
    return () => { generation.current += 1 }
  }, [])

  const summary = useMemo(() => summarizeNutrition(slots, catalog), [slots, catalog])
  const saveSlot = async (slot: MealSlot) => {
    const token = begin()
    setStatus('saving'); setErrorMessage(''); setFailedSlot(null); setFailedAction(null)
    try {
      await appDb.plans.put(slot)
      if (current(token)) { setSlots((value) => [...value.filter((item) => item.id !== slot.id), slot]); setStatus('ready') }
    } catch {
      if (current(token)) { setFailedSlot(slot); setFailedAction('save'); setErrorMessage('保存周计划失败，请重试'); setStatus('error') }
    }
  }
  const removeSlot = async (slot: MealSlot) => {
    const token = begin()
    setStatus('saving'); setErrorMessage(''); setFailedSlot(null); setFailedAction(null)
    try {
      await appDb.plans.delete(slot.id)
      if (current(token)) { setSlots((value) => value.filter((item) => item.id !== slot.id)); setStatus('ready') }
    } catch {
      if (current(token)) { setFailedSlot(slot); setFailedAction('remove'); setErrorMessage('移除周计划失败，请重试'); setStatus('error') }
    }
  }
  const add = (dayIndex: number, meal: MealSlot['meal']) => { const recipe = catalog.find((item) => item.id === selectedRecipeId); if (!recipe || status !== 'ready') return; void saveSlot({ id: `${dateFor(dayIndex)}-${meal}`, date: dateFor(dayIndex), meal, recipeId: recipe.id, servings: 2 }) }
  const disabled = status !== 'ready' || catalog.length === 0 || !catalog.some((item) => item.id === selectedRecipeId)
  const retry = () => {
    if (failedAction === 'remove' && failedSlot) { setStatus('saving'); void removeSlot(failedSlot) }
    else if (failedAction === 'save' && failedSlot) { setStatus('saving'); void saveSlot(failedSlot) }
    else { setStatus('loading'); void load() }
  }
  const slotAt = (dayIndex: number, meal: MealSlot['meal']) => slots.find((item) => item.date === dateFor(dayIndex) && item.meal === meal)
  const recipeOf = (slot: MealSlot | undefined) => slot && catalog.find((item) => item.id === slot.recipeId)
  const visibleMeals = [...mainMeals, ...(expanded ? extraMeals : [])]

  return <main className="week-planner"><header><a className="back-link" href="#/">返回找菜</a><p className="eyebrow">家庭菜谱</p><h1>周计划</h1><p className="subtitle">安排本周菜单，自动汇总营养。</p></header>
    {status === 'loading' && <p role="status">正在读取周计划</p>}{status === 'saving' && <p role="status">正在保存周计划</p>}{status === 'error' && <p role="alert">{errorMessage} <button type="button" onClick={retry}>重试</button></p>}{catalog.length === 0 && <p role="alert">暂无可用食谱</p>}
    <section className="planner-controls"><label>菜单食谱<select aria-label="菜单食谱" value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)} disabled={disabled}>{catalog.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></label><button type="button" onClick={() => setExpanded(!expanded)} disabled={status !== 'ready'}>{expanded ? '收起早餐和零食' : '展开早餐和零食'}</button></section>
    {isMobile ? (
      <section className="planner-mobile">
        <div className="date-strip" role="tablist" aria-label="选择日期">{days.map((day, dayIndex) => <button key={day} type="button" role="tab" aria-selected={selectedDay === dayIndex} aria-label={`选择${day} ${shortDateText(dateFor(dayIndex))}`} className={selectedDay === dayIndex ? 'active' : ''} onClick={() => setSelectedDay(dayIndex)}><strong>{day}</strong><small>{shortDateText(dateFor(dayIndex))}</small></button>)}</div>
        <div className="day-slots">{visibleMeals.map((meal) => { const slot = slotAt(selectedDay, meal.key); const recipe = recipeOf(slot); const selected = catalog.find((item) => item.id === selectedRecipeId); return <section className="planner-slot-card" key={meal.key}><h3>{meal.label}</h3>{recipe ? <><p className="slot-recipe">{recipe.title}</p><div className="slot-actions"><ServingsControl slot={slot!} onUpdate={(next) => void saveSlot(next)} disabled={status !== 'ready'} /><button type="button" className="remove-button" onClick={() => { if (slot) void removeSlot(slot) }}>移除</button></div></> : <p className="slot-empty">未安排</p>}<div className="slot-actions"><button type="button" aria-label={`添加${meal.label}`} onClick={() => add(selectedDay, meal.key)} disabled={disabled}>添加{selected?.title ?? '食谱'}</button></div></section> }) }</div>
      </section>
    ) : (
      <div className="planner-grid">{days.map((day, dayIndex) => <section key={day} className="planner-day"><h2>{day}</h2>{[...mainMeals, ...(expanded ? extraMeals : [])].map((meal) => { const slot = slotAt(dayIndex, meal.key); const recipe = recipeOf(slot); const selected = catalog.find((item) => item.id === selectedRecipeId); return <div className="planner-slot" key={meal.key}><h3>{day}{meal.label}</h3>{recipe ? <><p>{recipe.title}</p><div className="slot-actions"><ServingsControl slot={slot!} onUpdate={(next) => void saveSlot(next)} disabled={status !== 'ready'} /><button type="button" className="remove-button" aria-label={`移除${day}${meal.label}`} onClick={() => { if (slot) void removeSlot(slot) }}>移除</button></div></> : <p>未安排</p>}<div className="slot-actions"><button type="button" aria-label={`添加到${day}${meal.label}`} onClick={() => add(dayIndex, meal.key)} disabled={disabled}>添加{selected?.title ?? '食谱'}</button></div></div>})}</section>)}</div>
    )}
    <section className="nutrition-summary"><h2>营养汇总</h2>{slots.length === 0 ? <p>安排菜后会自动汇总营养</p> : summary.missingRecipeIds.length === slots.length ? <p>所选食谱暂无营养数据</p> : <><p>{summary.kcal} 千卡 · 蛋白质 {summary.proteinG} 克 · 碳水 {summary.carbsG} 克 · 脂肪 {summary.fatG} 克</p>{summary.missingRecipeIds.length > 0 && <p role="status">部分食谱暂无营养数据</p>}</>}</section>
  </main>
}