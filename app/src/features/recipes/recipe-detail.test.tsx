import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { appDb } from '../../db/app-db'
import { waitFor } from '@testing-library/react'
import type { Recipe } from '../../catalog/types'
import { RecipeDetail } from './recipe-detail'

const recipe: Recipe = { id: 'r1', title: '家常面', baseServings: 2, ingredients: [{ name: '面粉', amount: 100, unit: '克' }], steps: [], author: '妈妈' }

describe('RecipeDetail', () => {
  it('omits absent source and shows an explicit nutrition estimate placeholder', () => {
    render(<RecipeDetail recipe={recipe} />)
    expect(screen.queryByRole('link', { name: /来源/ })).not.toBeInTheDocument()
    expect(screen.getByText('暂无估算')).toBeInTheDocument()
  })

  it('preserves the recipe when navigating to the planner', () => {
    render(<RecipeDetail recipe={recipe} />)
    expect(screen.getByRole('link', { name: '加入菜单' })).toHaveAttribute('href', '#/planner?recipeId=r1')
  })

  it('hides cooking and planner actions in choose-only mode', () => {
    render(<RecipeDetail recipe={recipe} chooseOnly />)
    expect(screen.queryByRole('button', { name: '收藏' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '开始烹饪' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '加入菜单' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '想吃' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回点菜' })).toHaveAttribute('href', '#/choose')
  })

  it('scales numeric ingredients when target servings change', async () => {
    render(<RecipeDetail recipe={recipe} />)
    const servings = screen.getByRole('spinbutton', { name: '份数' })
    await userEvent.clear(servings)
    await userEvent.type(servings, '4')
    expect(screen.getByText(/200 克/)).toBeInTheDocument()
  })

  it('keeps the last valid servings when the input is cleared or invalid', async () => {
    render(<RecipeDetail recipe={recipe} />)
    const servings = screen.getByRole('spinbutton', { name: '份数' })
    await userEvent.clear(servings)
    await userEvent.tab()
    expect(servings).toHaveValue(2)
    for (const value of ['', '0', '1.5', '-2']) { fireEvent.change(servings, { target: { value } }); fireEvent.blur(servings); expect(servings).toHaveValue(2); expect(screen.getByText(/100 克/)).toBeInTheDocument() }
  })

  it('loads real persisted state and prevents a rapid second mutation', async () => {
    await appDb.favorites.put({ recipeId: recipe.id })
    render(<RecipeDetail recipe={recipe} />)
    const button = await screen.findByRole('button', { name: '已收藏' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(button).toBeDisabled()
    fireEvent.click(button)
    await waitFor(async () => expect(await appDb.favorites.get(recipe.id)).toBeUndefined())
    await appDb.favorites.delete(recipe.id)
  })

  it('exposes a recoverable alert when a favorite write fails', async () => {
    const put = vi.spyOn(appDb.favorites, 'put').mockRejectedValueOnce(new Error('write failed'))
    render(<RecipeDetail recipe={recipe} />)
    const button = await screen.findByRole('button', { name: '收藏' })
    await userEvent.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent('保存失败')
    expect(button).toBeEnabled()
    put.mockRestore()
  })

  it('renders all supplied nutrition fields including zero and supplied tags', () => {
    render(<RecipeDetail recipe={{ ...recipe, tags: ['快手'], nutrition: { kcal: 0, proteinG: 0, carbsG: 12, fatG: 3 } }} />)
    expect(screen.getByText(/快手/)).toBeInTheDocument()
    expect(screen.getByText(/0 千卡/)).toBeInTheDocument()
    expect(screen.getByText(/蛋白质.*0/)).toBeInTheDocument()
    expect(screen.getByText(/碳水.*12/)).toBeInTheDocument()
    expect(screen.getByText(/脂肪.*3/)).toBeInTheDocument()
    expect(screen.queryByText('暂无估算')).not.toBeInTheDocument()
  })
})
