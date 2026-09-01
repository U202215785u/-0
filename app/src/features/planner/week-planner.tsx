import { useEffect, useMemo, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb, type MealSlot } from '../../db/app-db'
import { summarizeNutrition } from '../../domain/menu'

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const meals = [{ key: 'lunch', label: '午餐' }, { key: 'dinner', label: '晚餐' }] as const
const dateFor = (dayIndex: number) => { const date = new Date(); const monday = new Date(date); const offset = (date.getDay() + 6) % 7; monday.setDate(date.getDate() - offset + dayIndex); return monday.toISOString().slice(0, 10) }

export function WeekPlanner({ catalog }: { catalog: Recipe[] }) {
  const [slots, setSlots] = useState<MealSlot[]>([])
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { void appDb.plans.toArray().then(setSlots) }, [])
  const summary = useMemo(() => summarizeNutrition(slots, catalog), [slots, catalog])
  const add = async (recipe: Recipe, dayIndex: number, meal: MealSlot['meal']) => {
    const slot: MealSlot = { id: `${dateFor(dayIndex)}-${meal}-${recipe.id}`, date: dateFor(dayIndex), meal, recipeId: recipe.id, servings: recipe.baseServings ?? 1 }
    await appDb.plans.put(slot)
    setSlots((current) => [...current.filter((item) => item.id !== slot.id), slot])
  }
  return <main className="week-planner"><header><a href="#/recipes">返回食谱</a><h1>周计划</h1><p>本周菜单与营养概览</p></header>
    <section className="nutrition-summary"><h2>营养汇总</h2><p>{summary.kcal} 千卡 · 蛋白质 {summary.proteinG} 克 · 碳水 {summary.carbsG} 克 · 脂肪 {summary.fatG} 克</p>{summary.missingRecipeIds.length > 0 && <p role="status">部分食谱暂无营养数据</p>}</section>
    <button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? '收起早餐和零食' : '展开早餐和零食'}</button>
    <div className="planner-grid">{days.map((day, dayIndex) => <section key={day} className="planner-day"><h2>{day}</h2>{[...meals, ...(expanded ? [{ key: 'breakfast', label: '早餐' }, { key: 'snack', label: '零食' }] as const : [])].map((meal) => { const slot = slots.find((item) => item.date === dateFor(dayIndex) && item.meal === meal.key); const recipe = catalog.find((item) => item.id === slot?.recipeId); const actionName = `添加到${day}${meal.label}`; return <div className="planner-slot" key={meal.key}><h3>{day}{meal.label}</h3>{recipe ? <p>{recipe.title}</p> : <p>未安排</p>}<button type="button" aria-label={actionName} onClick={() => void add(catalog[0], dayIndex, meal.key)}>添加{catalog[0]?.title ?? '食谱'}</button></div>})}</section>)}</div>
    </main>
}
