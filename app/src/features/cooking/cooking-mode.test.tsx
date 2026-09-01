import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Recipe } from '../../catalog/types'
import { CookingMode } from './cooking-mode'

const recipeWithTimer: Recipe = {
  id: 'stew', title: '红烧菜', baseServings: 2,
  ingredients: [{ name: '牛肉', amount: 300, unit: '克' }],
  steps: [{ text: '切块。' }, { text: '小火炖煮。', timerSeconds: 60 }, { text: '出锅。' }],
}

describe('CookingMode', () => {
  it('moves to the next step and starts a step timer when present', async () => {
    const user = userEvent.setup()
    render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
    expect(screen.getByText('第 1 步，共 3 步')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '完成并继续' }))
    expect(screen.getByText('第 2 步，共 3 步')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始计时' })).toBeInTheDocument()
    expect(screen.getByText('小火炖煮。')).toBeInTheDocument()
  })

  it('keeps ingredients visible and allows going back without autostarting the timer', async () => {
    const user = userEvent.setup()
    render(<CookingMode recipe={recipeWithTimer} targetServings={2} />)
    expect(screen.getByRole('heading', { name: '食材' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '完成并继续' }))
    expect(screen.getByRole('button', { name: '开始计时' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '上一步' }))
    expect(screen.getByText('第 1 步，共 3 步')).toBeInTheDocument()
  })
})
