import { useEffect, useMemo, useState } from 'react'
import { scaleIngredients } from '../../domain/servings'
import type { Recipe } from '../../catalog/types'

export function CookingMode({ recipe, targetServings }: { recipe: Recipe; targetServings: number }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const ingredients = useMemo(() => scaleIngredients(recipe, targetServings), [recipe, targetServings])
  const step = recipe.steps[stepIndex]
  useEffect(() => { setStepIndex(0); setSecondsLeft(null) }, [recipe.id])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft((value) => value === null || value <= 1 ? 0 : value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const next = () => { if (recipe.steps.length === 0) return; setStepIndex((value) => Math.min(value + 1, recipe.steps.length - 1)); setSecondsLeft(null) }
  const previous = () => { setStepIndex((value) => Math.max(value - 1, 0)); setSecondsLeft(null) }
  return <main className="cooking-mode">
    <a href={`#/recipes/${recipe.id}`}>退出烹饪</a>
    <h1>{recipe.title}</h1>
    <div className="cooking-layout">
      <aside className="cooking-ingredients"><h2>食材</h2><ul>{ingredients.map((item, index) => <li key={`${item.name}-${index}`}>{item.amount !== undefined ? `${item.amount} ${item.unit ?? ''}` : item.quantityText ?? ''} {item.name}</li>)}</ul></aside>
      <section className="cooking-step" aria-live="polite">{step ? <><p className="step-count">第 {stepIndex + 1} 步，共 {recipe.steps.length} 步</p><p className="step-text">{step.text}</p>
        {step.timerSeconds !== undefined && <div className="step-timer"><p>{secondsLeft === null ? `${step.timerSeconds} 秒` : `${secondsLeft} 秒`}</p><button type="button" onClick={() => setSecondsLeft(step.timerSeconds ?? null)} disabled={secondsLeft !== null && secondsLeft > 0}>{secondsLeft === 0 ? '重新计时' : '开始计时'}</button></div>}
        <div className="step-actions"><button type="button" onClick={previous} disabled={stepIndex === 0}>上一步</button><button type="button" onClick={next} disabled={stepIndex === recipe.steps.length - 1}>完成并继续</button></div></> : <><p className="step-text">暂无步骤</p><div className="step-actions"><button type="button" disabled>上一步</button><button type="button" disabled>完成并继续</button></div></>}</section>
    </div>
  </main>
}
