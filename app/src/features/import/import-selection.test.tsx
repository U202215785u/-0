import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
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
})
