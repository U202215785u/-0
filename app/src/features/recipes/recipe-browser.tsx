import { useMemo, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { TAG_DIMENSION_LIST, type TagDimensionKey } from '../../catalog/tags'
import {
  DIFFICULTIES,
  DURATION_BUCKETS,
  countForDifficulty,
  countForDuration,
  countForTag,
  emptyFilters,
  filterRecipes,
  hasActiveFilters,
  type RecipeFilters,
} from './recipe-filters'

type TagSelection = Record<TagDimensionKey, string[]>

function toggleTag(selection: TagSelection, dimension: TagDimensionKey, tag: string): TagSelection {
  const current = selection[dimension]
  return {
    ...selection,
    [dimension]: current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
  }
}

export function RecipeBrowser({ catalog, chooseOnly = false }: { catalog: Recipe[]; chooseOnly?: boolean }) {
  const [filters, setFilters] = useState<RecipeFilters>(emptyFilters)
  const recipes = useMemo(() => filterRecipes(catalog, filters), [catalog, filters])
  const active = hasActiveFilters(filters)
  const clearAll = () => setFilters(emptyFilters())

  const tagGroup = (dimension: (typeof TAG_DIMENSION_LIST)[number]) => (
    <fieldset className="filter-group" key={dimension.key}>
      <legend>{dimension.label}</legend>
      <div className="filter-chips">
        {dimension.tags.map((tag) => {
          const pressed = filters.tagSelections[dimension.key].includes(tag)
          const count = countForTag(catalog, filters, dimension.key, tag)
          return <button key={tag} type="button" className="filter-chip" aria-pressed={pressed} disabled={!pressed && count === 0}
            onClick={() => setFilters((current) => ({ ...current, tagSelections: toggleTag(current.tagSelections, dimension.key, tag) }))}>
            {tag}<span className="chip-count">{count}</span>
          </button>
        })}
      </div>
    </fieldset>
  )

  return <main className="recipe-browser">
    <header>{chooseOnly && <a className="back-link" href="#/choose">返回点菜</a>}<p className="eyebrow">{chooseOnly ? '点菜模式' : '家庭菜谱'}</p><h1>{chooseOnly ? '选菜' : '今天吃什么'}</h1><p className="subtitle">{chooseOnly ? '只选想吃的菜，不做其他修改。' : '搜索菜名、食材或标签，再用下面的筛选收窄范围。'}</p></header>
    <div className="browse-filters">
      <label className="search-field">搜索食谱<input aria-label="搜索食谱" role="searchbox" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="搜菜名、食材或标签" /></label>
      {TAG_DIMENSION_LIST.map(tagGroup)}
      <fieldset className="filter-group">
        <legend>难度</legend>
        <div className="filter-chips">
          {DIFFICULTIES.map((difficulty) => {
            const pressed = filters.difficulty === difficulty
            const count = countForDifficulty(catalog, filters, difficulty)
            return <button key={difficulty} type="button" className="filter-chip" aria-pressed={pressed} disabled={!pressed && count === 0}
              onClick={() => setFilters((current) => ({ ...current, difficulty: pressed ? undefined : difficulty }))}>
              {difficulty}<span className="chip-count">{count}</span>
            </button>
          })}
        </div>
      </fieldset>
      <fieldset className="filter-group">
        <legend>用时</legend>
        <div className="filter-chips">
          {DURATION_BUCKETS.map((bucket) => {
            const pressed = filters.duration === bucket.key
            const count = countForDuration(catalog, filters, bucket.key)
            return <button key={bucket.key} type="button" className="filter-chip" aria-pressed={pressed} disabled={!pressed && count === 0}
              onClick={() => setFilters((current) => ({ ...current, duration: pressed ? undefined : bucket.key }))}>
              {bucket.label}<span className="chip-count">{count}</span>
            </button>
          })}
        </div>
      </fieldset>
      {active && <button type="button" className="clear-filters" onClick={clearAll}>清除全部筛选</button>}
    </div>
    {!chooseOnly && <p className="import-link"><a href="#/import">导入点菜码</a></p>}
    <p className="result-count">共找到 {recipes.length} 道{active && <button type="button" className="result-clear" onClick={clearAll}>清除筛选</button>}</p>
    <section className="recipe-grid" aria-label="食谱列表">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><a href={chooseOnly ? `#/choose/recipes/${recipe.id}` : `#/recipes/${recipe.id}`} className="recipe-card-title"><h2>{recipe.title}</h2></a><div className="recipe-card-meta">{recipe.durationMinutes !== undefined && <span>{recipe.durationMinutes} 分钟</span>}{recipe.difficulty && <span>{recipe.difficulty}</span>}{recipe.baseServings !== undefined && <span>适合 {recipe.baseServings} 人</span>}</div>{recipe.tags?.map((tag) => <span className="tag" key={tag}>{tag}</span>)}<p className="recipe-card-action"><a className="button-link" href={chooseOnly ? `#/choose/recipes/${recipe.id}` : `#/recipes/${recipe.id}`}>查看做法</a></p></article>)}</section>
    {recipes.length === 0 && <div className="empty-state"><p>没有找到匹配的食谱。</p>{active && <button type="button" onClick={clearAll}>清除筛选后再看看</button>}</div>}
  </main>
}