import { useMemo, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { filterRecipes } from './recipe-filters'

export function RecipeBrowser({ catalog }: { catalog: Recipe[] }) {
  const [query, setQuery] = useState('')
  const tags = [...new Set(catalog.flatMap((recipe) => recipe.tags ?? []))]
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const recipes = useMemo(() => filterRecipes(catalog, query, selectedTags), [catalog, query, selectedTags])
  return <main className="recipe-browser"><header><p className="eyebrow">家庭食谱</p><h1>找菜</h1><label>搜索食谱<input aria-label="搜索食谱" role="searchbox" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜菜名、食材或标签" /></label></header><div className="filters" aria-label="烹饪方式">{tags.map((tag) => <button key={tag} type="button" aria-pressed={selectedTags.includes(tag)} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</button>)}</div><section className="recipe-grid" aria-label="食谱列表">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><a href={`#/recipes/${recipe.id}`}><h2>{recipe.title}</h2></a>{recipe.tags?.map((tag) => <span className="tag" key={tag}>{tag}</span>)}{recipe.durationMinutes && <p>{recipe.durationMinutes} 分钟</p>}</article>)}</section>{recipes.length === 0 && <p>没有找到匹配的食谱</p>}</main>
}
