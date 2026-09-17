import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Recipe } from '../../catalog/types'
import type { MealSlot } from '../../db/app-db'
import { appDb } from '../../db/app-db'
import { ShoppingList } from './shopping-list'

const recipe: Recipe = {
  id: 'beef-chow-fun', title: '干炒牛河', baseServings: 2,
  ingredients: [{ name: '葱', amount: 2, unit: '根', category: '蔬菜' }],
  steps: [{ text: '炒。' }],
}
const plan: MealSlot[] = [{ id: '2026-09-01-dinner', date: '2026-09-01', meal: 'dinner', recipeId: recipe.id, servings: 2 }]

afterEach(async () => { vi.restoreAllMocks(); await appDb.shopping.clear() })

describe('ShoppingList', () => {
  it('marks a generated item bought and saves a manual item', async () => {
    const user = userEvent.setup()
    render(<ShoppingList catalog={[recipe]} plan={plan} />)
    const checkbox = await screen.findByRole('checkbox', { name: /葱/ })
    await user.click(checkbox)
    await user.type(screen.getByLabelText('添加一项'), '保鲜袋')
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect(await screen.findByText('保鲜袋')).toBeInTheDocument()
    await waitFor(async () => expect((await appDb.shopping.get('manual-保鲜袋'))?.manualLabel).toBe('保鲜袋'))
    expect(checkbox).toBeChecked()
  })

  it('clears bought generated and manual items together', async () => {
    const user = userEvent.setup()
    await appDb.shopping.put({ id: 'manual-垃圾袋', checked: true, manualLabel: '垃圾袋' })
    render(<ShoppingList catalog={[recipe]} plan={plan} />)
    const checkbox = await screen.findByRole('checkbox', { name: /葱/ })
    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: '清除已购项目' }))
    await waitFor(async () => expect(await appDb.shopping.count()).toBe(0))
    expect(screen.getByRole('checkbox', { name: /葱/ })).not.toBeChecked()
    expect(screen.queryByText('垃圾袋')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('已清除已购项目')
  })

  it('keeps bought rows after unbought rows', async () => {
    await appDb.shopping.put({ id: '葱|根', checked: true })
    let release!: (value: [{ id: string; checked: boolean }]) => void
    const pending = new Promise<[{ id: string; checked: boolean }]>((resolve) => { release = resolve })
    vi.spyOn(appDb.shopping, 'toArray').mockReturnValueOnce(pending as ReturnType<typeof appDb.shopping.toArray>)
    render(<ShoppingList catalog={[recipe]} plan={plan} />)
    expect(screen.getByRole('status')).toHaveTextContent('正在读取购物清单')
    release([{ id: '葱|根', checked: true }])
    await screen.findByRole('checkbox', { name: /葱/ })
    expect(screen.getByRole('checkbox', { name: /葱/ })).toBeChecked()
  })

  it('shows a retryable alert when reading saved shopping state fails', async () => {
    const toArray = vi.spyOn(appDb.shopping, 'toArray').mockRejectedValueOnce(new Error('offline'))
    render(<ShoppingList catalog={[recipe]} plan={plan} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('读取购物清单失败')
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
    toArray.mockRestore()
  })
})
