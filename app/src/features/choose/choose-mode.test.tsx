import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChooseMode } from './choose-mode'

describe('ChooseMode', () => {
  it('creates a share code from wanted dishes', () => {
    render(<ChooseMode wantedRecipeIds={['beef-chow-fun']} />)
    expect(screen.getByRole('textbox', { name: '点菜码' })).toHaveValue('家宴点菜: {"recipeIds":["beef-chow-fun"]}')
    expect(screen.getByRole('link', { name: '去找菜' })).toHaveAttribute('href', '#/recipes')
  })
})
