import { useState } from 'react'
import { encodeSelection } from '../../domain/share-code'
import { appDb } from '../../db/app-db'

export function ChooseMode({ wantedRecipeIds, catalog = [], onClearWanted, onSwitchToCook }: {
  wantedRecipeIds: string[];
  catalog?: { id: string; title: string }[];
  onClearWanted?: () => Promise<void> | void;
  onSwitchToCook?: () => void;
}) {
  const [copyMessage, setCopyMessage] = useState('')
  const [clearing, setClearing] = useState(false)
  const titles = wantedRecipeIds.map((id) => catalog.find((recipe) => recipe.id === id)?.title ?? id)
  const code = encodeSelection(wantedRecipeIds)
  const shareCode = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: code }); return } catch { /* user cancelled or failed */ }
    }
    // fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(code)
      setCopyMessage('已复制点菜码')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      try { document.execCommand('copy') } catch { /* clipboard unavailable */ }
      document.body.removeChild(textarea)
      setCopyMessage('已复制点菜码')
    }
  }
  const clearWanted = async () => {
    setClearing(true)
    try {
      await appDb.wanted.clear()
      await onClearWanted?.()
    } finally { setClearing(false) }
  }
  return <main className="choose-mode"><header><p className="eyebrow">点菜模式</p><h1>你来点菜</h1><p className="subtitle">只选择想吃的菜，不修改食谱和菜单。</p></header>
    <nav className="actions" aria-label="点菜导航"><a className="button-link" href="#/choose/recipes">去找菜</a>{onSwitchToCook && <button type="button" onClick={onSwitchToCook}>切换做饭模式</button>}</nav>
    <section><h2>想吃的菜 <span className="count-badge">{wantedRecipeIds.length} 道</span></h2>{titles.length ? <ul className="wanted-list">{titles.map((title, index) => <li key={`${wantedRecipeIds[index]}-${index}`}>{title}</li>)}</ul> : <p>还没有想吃的菜，先去找菜吧。</p>}{titles.length > 0 && <button type="button" className="clear-wanted" disabled={clearing} onClick={() => void clearWanted()}>{clearing ? '正在清空' : '清空想吃'}</button>}</section>
    <section className="code-section"><h2>发给做饭设备</h2><p>复制下面的点菜码，粘贴发给做饭的人。</p><label>点菜码<textarea aria-label="点菜码" value={code} readOnly rows={4} /></label><div className="share-actions"><button type="button" className="copy-code" onClick={() => void shareCode()}>分享 / 复制</button>{copyMessage && <span role="status">{copyMessage}</span>}</div></section>
  </main>
}