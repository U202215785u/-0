import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Recipe } from '../../catalog/types'
import { appDb } from '../../db/app-db'
import { encodeSelection } from '../../domain/share-code'
import { ImportSelection } from './import-selection'

const recipe: Recipe = { id: 'beef-chow-fun', title: '干炒牛河', ingredients: [{ name: '河粉' }], steps: [{ text: '炒。' }] }

afterEach(async () => { await appDb.imports.clear(); await appDb.plans.clear() })

describe('ImportSelection', () => {
  it('imports recognized dishes into the inbox without creating plan slots', async () => {
    const user = userEvent.setup()
    render(<ImportSelection catalog={[recipe]} />)
    fireEvent.change(screen.getByRole('textbox', { name: '点菜码' }), { target: { value: encodeSelection([recipe.id]) } })
    await user.click(screen.getByRole('button', { name: '导入' }))
    expect(await screen.findByText(/已收到：干炒牛河/)).toBeInTheDocument()
    await waitFor(async () => expect(await appDb.imports.count()).toBe(1))
    expect(await appDb.plans.count()).toBe(0)
    expect((await appDb.imports.toArray())[0].recipeIds).toEqual([recipe.id])
  })

  it('rejects a code with no recognized catalog dishes', async () => {
    const user = userEvent.setup()
    render(<ImportSelection catalog={[recipe]} />)
    fireEvent.change(screen.getByRole('textbox', { name: '点菜码' }), { target: { value: encodeSelection(['missing']) } })
    await user.click(screen.getByRole('button', { name: '导入' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('没有识别到本地食谱')
  })

  it('deduplicates repeated imports into one stable inbox record', async () => {
    const user = userEvent.setup()
    render(<ImportSelection catalog={[recipe]} />)
    const input = screen.getByRole('textbox', { name: '点菜码' })
    fireEvent.change(input, { target: { value: encodeSelection([recipe.id, recipe.id]) } })
    await user.click(screen.getByRole('button', { name: '导入' }))
    await screen.findByText(/已收到：干炒牛河/)
    fireEvent.change(input, { target: { value: encodeSelection([recipe.id]) } })
    await user.click(screen.getByRole('button', { name: '导入' }))
    await waitFor(async () => expect(await appDb.imports.count()).toBe(1))
    expect((await appDb.imports.toArray())[0]).toMatchObject({ id: `import-${recipe.id}`, recipeIds: [recipe.id] })
    expect(await appDb.plans.count()).toBe(0)
  })

  it('disables import while saving', async () => {
    const user = userEvent.setup()
    const put = vi.spyOn(appDb.imports, 'put').mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('ok'), 20)) as never)
    render(<ImportSelection catalog={[recipe]} />)
    fireEvent.change(screen.getByRole('textbox', { name: '点菜码' }), { target: { value: encodeSelection([recipe.id]) } })
    const button = screen.getByRole('button', { name: '导入' })
    await user.click(button)
    expect(button).toBeDisabled()
    await waitFor(() => expect(button).toBeEnabled())
    put.mockRestore()
  })
})
