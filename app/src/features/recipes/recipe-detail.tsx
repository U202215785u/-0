import { useEffect, useState } from 'react'
import type { Recipe } from '../../catalog/types'
import { scaleIngredients } from '../../domain/servings'
import { appDb } from '../../db/app-db'

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const initialServings = recipe.baseServings ?? 1
  const [servings, setServings] = useState(initialServings)
  const [servingsInput, setServingsInput] = useState(String(initialServings))
  const [favorite, setFavorite] = useState(false)
  const [wanted, setWanted] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'pending' | 'error'>('loading')
  useEffect(() => { let active = true; void Promise.all([appDb.favorites.get(recipe.id), appDb.wanted.get(recipe.id)]).then(([f, w]) => { if (active) { setFavorite(Boolean(f)); setWanted(Boolean(w)); setStatus('ready') } }).catch(() => active && setStatus('error')); return () => { active = false } }, [recipe.id])
  const toggle = async (kind: 'favorite' | 'wanted') => { if (status !== 'ready') return; const table = kind === 'favorite' ? appDb.favorites : appDb.wanted; const active = kind === 'favorite' ? favorite : wanted; setStatus('pending'); try { if (active) await table.delete(recipe.id); else await table.put({ recipeId: recipe.id }); kind === 'favorite' ? setFavorite(!active) : setWanted(!active); setStatus('ready') } catch { setStatus('error') } }
  const updateServings = (value: string) => { setServingsInput(value); const parsed = Number(value); if (Number.isInteger(parsed) && parsed > 0 && Number.isFinite(parsed)) setServings(parsed); else if (!value) setServings(servings) }
  const nutrition = recipe.nutrition
  const hasNutrition = nutrition && Object.values(nutrition).some((value) => value !== undefined)
  return <main className="recipe-detail"><a href="#/">返回食谱</a><h1>{recipe.title}</h1>{status === 'loading' && <p role="status">正在读取状态</p>}{status === 'pending' && <p role="status">正在保存</p>}{status === 'error' && <p role="alert">状态保存失败，请稍后重试</p>}<div className="actions"><button type="button" disabled={status !== 'ready'} onClick={() => void toggle('favorite')}>{favorite ? '已收藏' : '收藏'}</button><button type="button" disabled={status !== 'ready'} onClick={() => void toggle('wanted')}>{wanted ? '已想吃' : '想吃'}</button><button type="button">开始烹饪</button><button type="button">加入菜单</button></div><dl>{recipe.author && <><dt>作者</dt><dd>{recipe.author}</dd></>}{recipe.durationMinutes !== undefined && <><dt>时长</dt><dd>{recipe.durationMinutes} 分钟</dd></>}{recipe.sourceUrl && <><dt>来源</dt><dd><a href={recipe.sourceUrl}>来源链接</a></dd></>}{recipe.tags && <><dt>标签</dt><dd>{recipe.tags.join('、')}</dd></>}</dl><section><h2>食材</h2><label>份数<input aria-label="份数" type="number" min="1" step="1" value={servingsInput} onChange={(event) => updateServings(event.target.value)} /></label><ul>{scaleIngredients(recipe, servings).map((item, index) => <li key={`${item.name}-${index}`}>{item.amount !== undefined ? `${item.amount} ${item.unit ?? ''}` : item.quantityText ?? ''} {item.name}</li>)}</ul></section><section><h2>营养</h2>{hasNutrition ? <dl><div><dt>热量</dt><dd>{nutrition.kcal !== undefined ? `${nutrition.kcal} 千卡` : '未提供'}</dd></div><div><dt>蛋白质</dt><dd>{nutrition.proteinG !== undefined ? `蛋白质 ${nutrition.proteinG} 克` : '未提供'}</dd></div><div><dt>碳水</dt><dd>{nutrition.carbsG !== undefined ? `碳水 ${nutrition.carbsG} 克` : '未提供'}</dd></div><div><dt>脂肪</dt><dd>{nutrition.fatG !== undefined ? `脂肪 ${nutrition.fatG} 克` : '未提供'}</dd></div></dl> : <p>暂无估算</p>}</section><section><h2>步骤</h2><ol>{recipe.steps.map((step, index) => <li key={index}>{step.text}</li>)}</ol></section></main>
}
