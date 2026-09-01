import { useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { appDb } from '../../db/app-db'
import { decodeSelection } from '../../domain/share-code'

export function ImportSelection({ catalog }: { catalog: Recipe[] }) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const importCode = async () => {
    if (pending) return
    setPending(true)
    try {
      const ids = [...new Set(decodeSelection(text).recipeIds.filter((id) => catalog.some((recipe) => recipe.id === id)))].sort()
      if (!ids.length) throw new Error('没有识别到本地食谱')
      await appDb.imports.put({ id: `import-${ids.join('|')}`, recipeIds: ids })
      setMessage(`已收到：${ids.map((id) => catalog.find((recipe) => recipe.id === id)?.title).join('、')}`)
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '点菜码无效'); setMessage('') }
    finally { setPending(false) }
  }
  return <main className="import-selection"><header><a href="#/recipes">返回找菜</a><h1>导入点菜</h1><p>导入后会放进收件箱，不会自动写入周计划。</p></header><label>点菜码<textarea aria-label="点菜码" value={text} onChange={(event) => setText(event.target.value)} rows={5} /></label><button type="button" disabled={pending} onClick={() => void importCode()}>{pending ? '正在导入' : '导入'}</button>{message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}</main>
}
