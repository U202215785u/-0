import { useEffect, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb } from '../../db/app-db'
import { decodeSelection } from '../../domain/share-code'

type InboxRecord = { id: string; recipeIds: string[] }

export function ImportSelection({ catalog }: { catalog: Recipe[] }) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [inbox, setInbox] = useState<InboxRecord[]>([])
  const [inboxError, setInboxError] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setInboxError(false)
    void appDb.imports.toArray().then((records) => { if (active) setInbox(records) }).catch(() => { if (active) setInboxError(true) })
    return () => { active = false }
  }, [reload])

  const importCode = async () => {
    if (pending) return
    setPending(true)
    try {
      const ids = [...new Set(decodeSelection(text).recipeIds.filter((id) => catalog.some((recipe) => recipe.id === id)))].sort()
      if (!ids.length) throw new Error('没有识别到本地食谱')
      const record = { id: `import-${ids.join('|')}`, recipeIds: ids }
      await appDb.imports.put(record)
      setMessage(`已收到：${ids.map((id) => catalog.find((recipe) => recipe.id === id)?.title).join('、')}`)
      setError('')
      setInbox((current) => [...current.filter((entry) => entry.id !== record.id), record])
    } catch (cause) { setError(cause instanceof Error ? cause.message : '点菜码无效'); setMessage('') }
    finally { setPending(false) }
  }
  const clearInbox = async () => {
    setInbox([])
    try { await appDb.imports.clear() } catch { setInboxError(true) }
  }
  return <main className="import-selection"><header><a className="back-link" href="#/">返回找菜</a><p className="eyebrow">家庭菜谱</p><h1>导入点菜</h1><p className="subtitle">导入后会放进收件箱，不会自动写入周计划。</p></header>
    <section><h2>粘贴点菜码</h2><label>点菜码<textarea aria-label="点菜码" value={text} onChange={(event) => setText(event.target.value)} rows={5} placeholder="家宴点菜: {...}" /></label><button type="button" disabled={pending} onClick={() => void importCode()}>{pending ? '正在导入' : '导入'}</button>{message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}</section>
    <section><h2>收件箱</h2>{inboxError && <p role="alert">读取收件箱失败 <button type="button" onClick={() => setReload((value) => value + 1)}>重试</button></p>}{inbox.length === 0 && !inboxError && <p>还没有收到的点菜。</p>}
      {inbox.map((record) => <div className="inbox-entry" key={record.id}><ul>{record.recipeIds.map((id) => { const recipe = catalog.find((item) => item.id === id); return <li key={id}>{recipe ? <a href={`#/recipes/${recipe.id}`}>{recipe.title}</a> : id}</li> })}</ul></div>)}
      {inbox.length > 0 && <button type="button" className="clear-inbox" onClick={() => void clearInbox()}>清空收件箱</button>}
    </section>
  </main>
}