import { useEffect, useMemo, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb, type MealSlot, type ShoppingState } from '../../db/app-db'
import { createShoppingItems } from '../../domain/menu'

export function ShoppingList({ catalog, plan }: { catalog: Recipe[]; plan: MealSlot[] }) {
  const generated = useMemo(() => createShoppingItems(plan, catalog), [plan, catalog])
  const [saved, setSaved] = useState<ShoppingState[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [reload, setReload] = useState(0)
  const [manual, setManual] = useState('')
  useEffect(() => {
    let active = true
    setHydrated(false); setLoadError(false)
    void appDb.shopping.toArray().then((items) => { if (active) { setSaved(items); setHydrated(true) } }).catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [reload])
  const states = new Map(saved.map((item) => [item.id, item]))
  const rows = [
    ...generated.map((item) => ({ ...item, manual: false })),
    ...saved.filter((item) => item.manualLabel).map((item) => ({ id: item.id, label: item.manualLabel!, category: '其他', manual: true, amount: undefined, unit: undefined })),
  ].sort((a, b) => Number(Boolean(states.get(a.id)?.checked)) - Number(Boolean(states.get(b.id)?.checked)))
  const categories = [...new Set(rows.map((row) => row.category))]
  const toggle = async (id: string) => {
    const next = { id, checked: !states.get(id)?.checked }
    setSaved((current) => [...current.filter((item) => item.id !== id), next])
    try {
      await appDb.shopping.put(next)
    } catch {
      setSaved((current) => [...current.filter((item) => item.id !== id), { ...next, checked: !next.checked }])
    }
  }
  const addManual = async () => {
    const label = manual.trim()
    if (!label) return
    const item = { id: `manual-${label}`, checked: false, manualLabel: label }
    await appDb.shopping.put(item)
    setSaved((current) => [...current.filter((entry) => entry.id !== item.id), item])
    setManual('')
  }
  return <main className="shopping-list"><header><a href="#/recipes">返回找菜</a><h1>购物清单</h1></header>
    {!hydrated && <p role="status">正在读取购物清单</p>}
    {loadError && <p role="alert">读取购物清单失败，请重试 <button type="button" onClick={() => setReload((value) => value + 1)}>重试</button></p>}
    {hydrated && !loadError && <>
    {rows.length === 0 && <p>清单还是空的</p>}
    {categories.map((category) => <section key={category}><h2>{category}</h2><ul>{rows.filter((row) => row.category === category).map((row) => <li key={row.id}><label><input type="checkbox" aria-label={row.label} checked={Boolean(states.get(row.id)?.checked)} onChange={() => void toggle(row.id)} /> <span>{row.label}</span>{!row.manual && row.amount !== undefined && <small> {row.amount} {row.unit ?? ''}</small>}</label></li>)}</ul></section>)}
    <form onSubmit={(event) => { event.preventDefault(); void addManual() }}><label>添加一项<input aria-label="添加一项" value={manual} onChange={(event) => setManual(event.target.value)} /></label><button type="submit">添加</button></form>
    </>}
  </main>
}
