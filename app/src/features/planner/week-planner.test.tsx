import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Recipe } from '../../catalog/types'
import { appDb } from '../../db/app-db'
import { dateFor, WeekPlanner } from './week-planner'

const fixtureCatalog: Recipe[] = [{
  id: 'beef', title: '干炒牛河', baseServings: 2,
  ingredients: [{ name: '河粉' }], steps: [{ text: '炒。' }],
  nutrition: { kcal: 500, proteinG: 20, carbsG: 60, fatG: 15 },
}]
const secondRecipe = { ...fixtureCatalog[0], id: 'noodles', title: '葱油面', nutrition: { kcal: 300, proteinG: 8, carbsG: 45, fatG: 10 } }

afterEach(async () => { vi.restoreAllMocks(); await appDb.plans.clear() })

describe('WeekPlanner', () => {
  it('uses the selected recipe and replaces the same date and meal', async () => {
    const user = userEvent.setup()
    render(<WeekPlanner catalog={[fixtureCatalog[0], secondRecipe]} initialRecipeId="noodles" />)
    await waitFor(() => expect(screen.getByRole('button', { name: '添加到周三晚餐' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: '添加到周三晚餐' }))
    expect(screen.getByRole('heading', { name: '周三晚餐' }).parentElement).toHaveTextContent('葱油面')
    fireEvent.change(screen.getByRole('combobox', { name: '菜单食谱' }), { target: { value: 'beef' } })
    await waitFor(() => expect(screen.getByRole('button', { name: '添加到周三晚餐' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: '添加到周三晚餐' }))
    await waitFor(async () => expect((await appDb.plans.toArray())[0]).toMatchObject({ id: expect.stringContaining('-dinner'), recipeId: 'beef' }))
    expect(await appDb.plans.count()).toBe(1)
  })

  it('disables adding when catalog is empty', async () => {
    render(<WeekPlanner catalog={[]} />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('暂无可用食谱')
      expect(screen.getByRole('button', { name: '添加到周三晚餐' })).toBeDisabled()
    })
  })

  it('formats dates in local calendar terms', () => {
    expect(dateFor(0, new Date(2024, 0, 1, 0, 30))).toBe('2024-01-01')
  })

  it('shows a retryable load error without an unhandled rejection', async () => {
    const error = vi.spyOn(appDb.plans, 'toArray').mockRejectedValueOnce(new Error('offline'))
    render(<WeekPlanner catalog={fixtureCatalog} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('读取周计划失败')
    error.mockRestore()
  })
  it('adds a dish to Wednesday dinner and shows known nutrition totals', async () => {
    const user = userEvent.setup()
    render(<WeekPlanner catalog={fixtureCatalog} />)
    await user.click(screen.getByRole('button', { name: '添加到周三晚餐' }))
    expect(screen.getByRole('heading', { name: '周三晚餐' }).parentElement).toHaveTextContent('干炒牛河')
    await waitFor(() => expect(screen.getByText(/500 千卡/)).toBeInTheDocument())
    await waitFor(async () => expect((await appDb.plans.toArray())).toHaveLength(1))
  })

  it('reveals breakfast and snack only after explicit expansion', async () => {
    render(<WeekPlanner catalog={fixtureCatalog} />)
    expect(screen.queryByText('早餐')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '展开早餐和零食' }))
    expect(screen.getAllByRole('heading', { name: /早餐/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: /零食/ }).length).toBeGreaterThan(0)
  })

  it('does not let a stale load erase a slot added after it began', async () => {
    let releaseLoad!: (value: []) => void
    const deferred = new Promise<[]>(resolve => { releaseLoad = resolve })
    vi.spyOn(appDb.plans, 'toArray').mockReturnValueOnce(deferred as ReturnType<typeof appDb.plans.toArray>)
    const { container } = render(<WeekPlanner catalog={fixtureCatalog} />)
    await act(async () => { await Promise.resolve() })
    const addButton = screen.getByRole('button', { name: '添加到周三晚餐' })
    expect(addButton).toBeDisabled()
    await appDb.plans.put({ id: `${dateFor(2)}-dinner`, date: dateFor(2), meal: 'dinner', recipeId: 'beef', servings: 2 })
    releaseLoad([])
    await act(async () => { await Promise.resolve() })
    expect(container.querySelector('.planner-slot')?.parentElement).toBeTruthy()
    expect(await appDb.plans.toArray()).toHaveLength(1)
  })

  it('syncs selection when initial recipe and catalog props change', async () => {
    const { rerender } = render(<WeekPlanner catalog={[fixtureCatalog[0]]} />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: '菜单食谱' })).toBeEnabled())
    rerender(<WeekPlanner catalog={[fixtureCatalog[0], secondRecipe]} initialRecipeId="noodles" />)
    expect(screen.getByRole('combobox', { name: '菜单食谱' })).toHaveValue('noodles')
    rerender(<WeekPlanner catalog={[fixtureCatalog[0]]} initialRecipeId="missing" />)
    expect(screen.getByRole('combobox', { name: '菜单食谱' })).toHaveValue('beef')
    rerender(<WeekPlanner catalog={[]} />)
    expect(screen.getByRole('combobox', { name: '菜单食谱' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '添加到周三晚餐' })).toBeDisabled()
  })

  it('retries the failed save intent instead of reloading', async () => {
    const put = vi.spyOn(appDb.plans, 'put').mockRejectedValueOnce(new Error('offline')).mockResolvedValue('saved-id')
    const user = userEvent.setup()
    render(<WeekPlanner catalog={fixtureCatalog} />)
    await waitFor(() => expect(screen.getByRole('button', { name: '添加到周三晚餐' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: '添加到周三晚餐' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('保存周计划失败')
    await user.click(screen.getByRole('button', { name: '重试保存' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: '周三晚餐' }).parentElement).toHaveTextContent('干炒牛河'))
    expect(put).toHaveBeenCalledTimes(2)
  })

  it('normalizes legacy records and keeps one canonical slot per date and meal', async () => {
    const date = dateFor(2)
    await appDb.plans.bulkPut([
      { id: `${date}-dinner-beef`, date, meal: 'dinner', recipeId: 'beef', servings: 2 },
      { id: `${date}-dinner-noodles`, date, meal: 'dinner', recipeId: 'noodles', servings: 2 },
    ])
    render(<WeekPlanner catalog={[fixtureCatalog[0], secondRecipe]} />)
    await waitFor(() => expect(screen.getByText('葱油面')).toBeInTheDocument())
    await waitFor(async () => expect(await appDb.plans.count()).toBe(1))
    const records = await appDb.plans.toArray()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ id: `${date}-dinner`, recipeId: 'noodles' })
  })
})
