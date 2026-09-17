import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Recipe } from '../../catalog/types'
import { CookingMode } from './cooking-mode'

const recipeWithTimer: Recipe = {
  id: 'stew', title: '红烧菜', baseServings: 2,
  ingredients: [{ name: '牛肉', amount: 300, unit: '克' }],
  steps: [{ text: '切块。' }, { text: '小火炖煮。', timerSeconds: 60 }, { text: '出锅。' }],
}

describe('CookingMode', () => {
  it('handles recipes with no steps without rendering invalid step content', () => {
    render(<CookingMode recipe={{ ...recipeWithTimer, id: 'empty', steps: [] }} targetServings={2} />)
    expect(screen.getByText('暂无步骤')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '上一步' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一步' })).toBeDisabled()
  })

  it('restarts a timer after countdown completion', async () => {
    vi.useFakeTimers()
    try {
      render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
      act(() => { screen.getByRole('button', { name: '下一步' }).click() })
      act(() => { screen.getByRole('button', { name: '开始计时' }).click() })
      act(() => { vi.advanceTimersByTime(60000) })
      expect(screen.getByRole('button', { name: '重新计时' })).toBeInTheDocument()
      act(() => { screen.getByRole('button', { name: '重新计时' }).click() })
      expect(screen.getByText('60 秒')).toBeInTheDocument()
    } finally { vi.useRealTimers() }
  })

  it('resets step and timer when the recipe changes', () => {
    const { rerender } = render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
    rerender(<CookingMode recipe={{ ...recipeWithTimer, id: 'new', title: '新菜', steps: [{ text: '新步骤。' }] }} targetServings={2} />)
    expect(screen.getByText('第 1 步，共 1 步')).toBeInTheDocument()
    expect(screen.getByText('新步骤。')).toBeInTheDocument()
  })
  it('moves to the next step and starts a step timer when present', async () => {
    const user = userEvent.setup()
    render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
    expect(screen.getByText('第 1 步，共 3 步')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(screen.getByText('第 2 步，共 3 步')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始计时' })).toBeInTheDocument()
    expect(screen.getByText('小火炖煮。')).toBeInTheDocument()
  })

  it('keeps ingredients visible and allows going back without autostarting the timer', async () => {
    const user = userEvent.setup()
    render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
    expect(screen.getByRole('heading', { name: '食材' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(screen.getByRole('button', { name: '开始计时' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '上一步' }))
    expect(screen.getByText('第 1 步，共 3 步')).toBeInTheDocument()
  })

  it('labels the final step as done with a link back to the recipe', async () => {
    const user = userEvent.setup()
    render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
    await user.click(screen.getByRole('button', { name: '下一步' }))
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
    expect(screen.getByRole('link', { name: '完成烹饪，返回菜谱' })).toHaveAttribute('href', '#/recipes/stew')
  })
})
