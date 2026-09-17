import type { MealSlot } from '../../db/app-db'

export const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

export function formatLocalDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function dateFor(dayIndex: number, baseDate = new Date()) { const monday = new Date(baseDate); const offset = (baseDate.getDay() + 6) % 7; monday.setDate(baseDate.getDate() - offset + dayIndex); return formatLocalDate(monday) }
export function weekdayIndex(baseDate = new Date()) { return (baseDate.getDay() + 6) % 7 }
export function shortDateText(date: string) { const parts = date.split('-'); return `${Number(parts[1])}/${Number(parts[2])}` }

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