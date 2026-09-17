import { useMemo, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { filterRecipes } from './recipe-filters'

export function RecipeBrowser({ catalog, chooseOnly = false }: { catalog: Recipe[]; chooseOnly?: boolean }) {
  const [query, setQuery] = useState('')
  const tags = [...new Set(catalog.flatMap((recipe) => recipe.tags ?? []))]
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const recipes = useMemo(() => filterRecipes(catalog, query, selectedTags), [catalog, query, selectedTags])
  return <main className="recipe-browser"><header><p className="eyebrow">{chooseOnly ? '点菜模式' : '家庭菜谱'}</p><h1>{chooseOnly ? '选菜' : '今天吃什么'}</h1><p className="subtitle">{chooseOnly ? '只选想吃的菜，不做其他修改。' : '搜索菜名、食材或标签，安排今天的一餐。'}</p><label>搜索食谱<input aria-label="搜索食谱" role="searchbox" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜菜名、食材或标签" /></label></header>
    <div className="filters" aria-label="烹饪方式">{tags.map((tag) => <button key={tag} type="button" aria-pressed={selectedTags.includes(tag)} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</button>)}</div>
    {!chooseOnly && <p className="import-link"><a href="#/import">导入点菜码</a></p>}
    <section className="recipe-grid" aria-label="食谱列表">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><a href={chooseOnly ? `#/choose/recipes/${recipe.id}` : `#/recipes/${recipe.id}`} className="recipe-card-title"><h2>{recipe.title}</h2></a><div className="recipe-card-meta">{recipe.durationMinutes !== undefined && <span>{recipe.durationMinutes} 分钟</span>}{recipe.difficulty && <span>{recipe.difficulty}</span>}{recipe.baseServings !== undefined && <span>适合 {recipe.baseServings} 人</span>}</div>{recipe.tags?.map((tag) => <span className="tag" key={tag}>{tag}</span>)}<p className="recipe-card-action"><a className="button-link" href={chooseOnly ? `#/choose/recipes/${recipe.id}` : `#/recipes/${recipe.id}`}>查看做法</a></p></article>)}</section>
    {recipes.length === 0 && <p className="empty-state">没有找到匹配的食谱，换个关键词试试。</p>}
  </main>
}