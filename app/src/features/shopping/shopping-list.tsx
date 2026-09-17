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
  const [message, setMessage] = useState('')
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
  const checkedCount = rows.filter((row) => states.get(row.id)?.checked).length
  const totalCount = rows.length
  const done = totalCount > 0 && checkedCount === totalCount
  const categories = [...new Set(rows.map((row) => row.category))]
  const toggle = async (id: string) => {
    const next = { id, checked: !states.get(id)?.checked }
    setSaved((current) => [...current.filter((item) => item.id !== id), next])
    setMessage('')
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
    setSaved((current) => [...current.filter((entry) => entry.id !== item.id), item])
    setManual('')
    setMessage('已添加' + label)
    try { await appDb.shopping.put(item) } catch { /* optimistic; next load reconciles */ }
  }
  const clearBought = async () => {
    const bought = saved.filter((item) => item.checked && !item.manualLabel)
    if (bought.length === 0) return
    const ids = bought.map((item) => item.id)
    setSaved((current) => current.filter((item) => !ids.includes(item.id)))
    setMessage('已清除已购项目')
    try { await appDb.shopping.bulkDelete(ids) } catch { /* reconcile on reload */ }
  }
  return <main className="shopping-list"><header><a className="back-link" href="#/">返回找菜</a><p className="eyebrow">家庭菜谱</p><h1>购物清单</h1><p className="subtitle">根据周计划自动生成，勾选即记录。</p></header>
    {!hydrated && <p role="status">正在读取购物清单</p>}
    {loadError && <p role="alert">读取购物清单失败，请重试 <button type="button" onClick={() => setReload((value) => value + 1)}>重试</button></p>}
    {hydrated && !loadError && <>
    {totalCount > 0 && <section className="shopping-progress"><div className="progress-row"><span>待购 {totalCount - checkedCount}</span><span>已购 {checkedCount}</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={checkedCount} aria-label="采购进度"><div className="progress-fill" style={{ width: `${totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100)}%` }} /></div>{done && <p className="progress-done">全部买齐啦 🎉</p>}</section>}
    {totalCount === 0 ? <section className="empty-state"><p>清单还是空的。</p><p>先去<a href="#/planner">安排周计划</a>，这里会自动生成购物清单。</p><a className="button-link" href="#/planner">去安排周菜单</a></section> : <>{categories.map((category) => <section key={category} className="shopping-category"><h2>{category}</h2><ul>{rows.filter((row) => row.category === category).map((row) => <li key={row.id}><label className="shopping-row"><input type="checkbox" aria-label={row.label} checked={Boolean(states.get(row.id)?.checked)} onChange={() => void toggle(row.id)} /> <span>{row.label}</span>{!row.manual && row.amount !== undefined && <small> {row.amount} {row.unit ?? ''}</small>}</label></li>)}</ul></section>)}</>}
    <form className="manual-form" onSubmit={(event) => { event.preventDefault(); void addManual() }}><label>添加一项<input aria-label="添加一项" value={manual} onChange={(event) => setManual(event.target.value)} placeholder="比如：保鲜袋" /></label><button type="submit">添加</button></form>
    {checkedCount > 0 && <button type="button" className="clear-bought" onClick={() => void clearBought()}>清除已购项目</button>}
    {message && <p role="status">{message}</p>}
    </>}
  </main>
}