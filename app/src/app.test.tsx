import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './app'

afterEach(() => { window.location.hash = '' })

describe('App navigation', () => {
  it('rerenders the detail view after selecting a recipe', async () => {
    const user = userEvent.setup()
    render(<App />)
    const link = screen.getByRole('link', { name: /Beef Chow Fun/ })
    await user.click(link)
    expect(await screen.findByRole('heading', { name: /Beef Chow Fun/ })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '返回食谱' }))
    expect(screen.getByRole('heading', { name: '找菜' })).toBeInTheDocument()
  })

  it('passes a planner recipe query through to the planner selection', async () => {
    window.location.hash = '#/planner?recipeId=beef-chow-fun'
    render(<App />)
    expect(await screen.findByRole('combobox', { name: '菜单食谱' })).toHaveValue('beef-chow-fun')
  })
})
