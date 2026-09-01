import { useEffect, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { scaleIngredients } from '../../domain/servings'
import { appDb } from '../../db/app-db'

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.baseServings ?? 1)
  const [favorite, setFavorite] = useState(false)
  const [wanted, setWanted] = useState(false)
  useEffect(() => { void Promise.all([appDb.favorites.get(recipe.id), appDb.wanted.get(recipe.id)]).then(([f, w]) => { setFavorite(Boolean(f)); setWanted(Boolean(w)) }) }, [recipe.id])
  const toggle = async (kind: 'favorite' | 'wanted') => { const table = kind === 'favorite' ? appDb.favorites : appDb.wanted; const active = kind === 'favorite' ? favorite : wanted; if (active) await table.delete(recipe.id); else await table.put({ recipeId: recipe.id }); kind === 'favorite' ? setFavorite(!active) : setWanted(!active) }
  return <main className="recipe-detail"><a href="#/">返回食谱</a><h1>{recipe.title}</h1><div className="actions"><button type="button" onClick={() => void toggle('favorite')}>{favorite ? '已收藏' : '收藏'}</button><button type="button" onClick={() => void toggle('wanted')}>{wanted ? '已想吃' : '想吃'}</button><button type="button">开始烹饪</button><button type="button">加入菜单</button></div><dl>{recipe.author && <><dt>作者</dt><dd>{recipe.author}</dd></>}{recipe.durationMinutes && <><dt>时长</dt><dd>{recipe.durationMinutes} 分钟</dd></>}{recipe.sourceUrl && <><dt>来源</dt><dd><a href={recipe.sourceUrl}>来源链接</a></dd></>}</dl><section><h2>食材</h2><label>份数<input aria-label="份数" type="number" min="1" step="1" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label><ul>{scaleIngredients(recipe, servings).map((item, index) => <li key={`${item.name}-${index}`}>{item.amount !== undefined ? `${item.amount} ${item.unit ?? ''}` : item.quantityText ?? ''} {item.name}</li>)}</ul></section><section><h2>营养</h2>{recipe.nutrition ? <p>{recipe.nutrition.kcal ? `${recipe.nutrition.kcal} 千卡` : '暂无估算'}</p> : <p>暂无估算</p>}</section><section><h2>步骤</h2><ol>{recipe.steps.map((step, index) => <li key={index}>{step.text}</li>)}</ol></section></main>
}
