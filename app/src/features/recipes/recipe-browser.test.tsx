import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RecipeBrowser } from './recipe-browser'
import type { Recipe } from '../../catalog/types'

const fixtureCatalog: Recipe[] = [
  { id: 'beef-chow-fun', title: '干炒牛河', tags: ['炒'], ingredients: [{ name: '牛肉' }], steps: [] },
  { id: 'soup', title: '番茄汤', tags: ['煮'], ingredients: [{ name: '番茄' }], steps: [] },
]

describe('RecipeBrowser', () => {
  it('filters results when a cooking-method tag is selected', async () => {
    const user = userEvent.setup()
    render(<RecipeBrowser catalog={fixtureCatalog} />)
    await user.click(screen.getByRole('button', { name: '炒' }))
    expect(screen.getByText('干炒牛河')).toBeInTheDocument()
    expect(screen.queryByText('番茄汤')).not.toBeInTheDocument()
  })

  it('uses choose-only links when requested', () => {
    render(<RecipeBrowser catalog={fixtureCatalog} chooseOnly />)
    expect(screen.getByRole('link', { name: '干炒牛河' })).toHaveAttribute('href', '#/choose/recipes/beef-chow-fun')
  })
})
