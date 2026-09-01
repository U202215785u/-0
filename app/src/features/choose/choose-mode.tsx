import { encodeSelection } from '../../domain/share-code'

export function ChooseMode({ wantedRecipeIds, catalog = [] }: { wantedRecipeIds: string[]; catalog?: { id: string; title: string }[] }) {
  const titles = wantedRecipeIds.map((id) => catalog.find((recipe) => recipe.id === id)?.title ?? id)
  const code = encodeSelection(wantedRecipeIds)
  return <main className="choose-mode"><header><p className="eyebrow">点菜模式</p><h1>你来点菜</h1><p>只选择想吃的菜，不修改食谱和菜单。</p></header><nav className="actions" aria-label="点菜导航"><a className="button-link" href="#/choose/recipes">去找菜</a><a className="button-link" href="#/">切换做饭模式</a></nav><section><h2>想吃的菜</h2>{titles.length ? <ul>{titles.map((title, index) => <li key={`${wantedRecipeIds[index]}-${index}`}>{title}</li>)}</ul> : <p>还没有想吃的菜，先去找菜吧。</p>}</section><section><h2>发给做饭设备</h2><label>点菜码<textarea aria-label="点菜码" value={code} readOnly rows={4} /></label></section></main>
}
