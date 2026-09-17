import { useEffect, useMemo, useRef, useState } from 'react'
import { scaleIngredients } from '../../domain/servings'
import type { Recipe } from '../../catalog/types'

export function CookingMode({ recipe, targetServings }: { recipe: Recipe; targetServings: number }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const endAt = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const ingredients = useMemo(() => scaleIngredients(recipe, targetServings), [recipe, targetServings])
  const step = recipe.steps[stepIndex]
  const isLast = stepIndex === recipe.steps.length - 1

  // Screen wake lock
  useEffect(() => {
    let active = true
    if ('wakeLock' in navigator) {
      void ((navigator as unknown as { wakeLock: { request(type: string): Promise<{ release(): void }> } }).wakeLock.request('screen'))
        .then((lock) => { if (active) wakeLockRef.current = lock as WakeLockSentinel })
        .catch(() => { /* not supported or denied */ })
    }
    return () => { active = false; void wakeLockRef.current?.release() }
  }, [])

  // Robust countdown based on absolute end time
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const timer = window.setInterval(() => {
      if (endAt.current !== null) {
        const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
        setSecondsLeft(remaining)
      } else {
        setSecondsLeft((value) => value === null || value <= 1 ? 0 : value - 1)
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const startTimer = (duration: number) => { endAt.current = Date.now() + duration * 1000; setSecondsLeft(duration) }
  const next = () => { if (recipe.steps.length === 0) return; setStepIndex((value) => Math.min(value + 1, recipe.steps.length - 1)); setSecondsLeft(null); endAt.current = null }
  const previous = () => { setStepIndex((value) => Math.max(value - 1, 0)); setSecondsLeft(null); endAt.current = null }
  const finish = () => { window.location.hash = `#/recipes/${recipe.id}` }
  const progress = recipe.steps.length === 0 ? 0 : Math.round(((stepIndex + 1) / recipe.steps.length) * 100)
  return <main className="cooking-mode">
    <header><a className="back-link" href={`#/recipes/${recipe.id}`}>退出烹饪</a><p className="eyebrow">烹饪模式</p><h1>{recipe.title}</h1><p className="subtitle">{targetServings} 人份</p></header>
    <div className="cooking-layout">
      <aside className="cooking-ingredients"><h2>食材</h2><ul>{ingredients.map((item, index) => <li key={`${item.name}-${index}`}>{item.amount !== undefined ? `${item.amount} ${item.unit ?? ''}` : item.quantityText ?? ''} {item.name}</li>)}</ul></aside>
      <section className="cooking-step" aria-live="polite">
        {recipe.steps.length > 0 && <div className="cooking-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="烹饪进度"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>}
        {step ? <><p className="step-count">第 {stepIndex + 1} 步，共 {recipe.steps.length} 步</p><p className="step-text">{step.text}</p>
          {step.timerSeconds !== undefined && <div className="step-timer"><p>{secondsLeft === null ? `${step.timerSeconds} 秒` : `${secondsLeft} 秒`}</p><button type="button" onClick={() => startTimer(step.timerSeconds ?? 0)} disabled={secondsLeft !== null && secondsLeft > 0}>{secondsLeft === 0 ? '重新计时' : '开始计时'}</button></div>}
          <div className="step-actions"><button type="button" className="step-button" onClick={previous} disabled={stepIndex === 0}>上一步</button><button type="button" className="step-button primary" onClick={isLast ? finish : next}>{isLast ? '完成' : '下一步'}</button></div>
          {isLast && <p className="step-complete"><a className="button-link" href={`#/recipes/${recipe.id}`}>完成烹饪，返回菜谱</a></p>}
        </> : <><p className="step-text">暂无步骤</p><div className="step-actions"><button type="button" className="step-button" disabled>上一步</button><button type="button" className="step-button primary" disabled>下一步</button></div></>}
      </section>
    </div>
  </main>
}