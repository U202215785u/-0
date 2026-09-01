import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { Recipe } from '../../catalog/types'
import { appDb } from '../../db/app-db'
import { WeekPlanner } from './week-planner'

const fixtureCatalog: Recipe[] = [{
  id: 'beef', title: '干炒牛河', baseServings: 2,
  ingredients: [{ name: '河粉' }], steps: [{ text: '炒。' }],
  nutrition: { kcal: 500, proteinG: 20, carbsG: 60, fatG: 15 },
}]

afterEach(async () => { await appDb.plans.clear() })

describe('WeekPlanner', () => {
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
})
