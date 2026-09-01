import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Recipe } from '../../catalog/types'
import { RecipeDetail } from './recipe-detail'

const recipe: Recipe = { id: 'r1', title: '家常面', baseServings: 2, ingredients: [{ name: '面粉', amount: 100, unit: '克' }], steps: [], author: '妈妈' }

describe('RecipeDetail', () => {
  it('omits absent source and shows an explicit nutrition estimate placeholder', () => {
    render(<RecipeDetail recipe={recipe} />)
    expect(screen.queryByRole('link', { name: /来源/ })).not.toBeInTheDocument()
    expect(screen.getByText('暂无估算')).toBeInTheDocument()
  })

  it('scales numeric ingredients when target servings change', async () => {
    render(<RecipeDetail recipe={recipe} />)
    const servings = screen.getByRole('spinbutton', { name: '份数' })
    await userEvent.clear(servings)
    await userEvent.type(servings, '4')
    expect(screen.getByText(/200 克/)).toBeInTheDocument()
  })
})
