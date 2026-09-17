import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './app'
import { appDb } from './db/app-db'

afterEach(async () => {
  window.location.hash = ''
  await Promise.all([appDb.shopping.clear(), appDb.imports.clear(), appDb.plans.clear(), appDb.wanted.clear()])
})

describe('App navigation', () => {
  it('rerenders the detail view after selecting a recipe', async () => {
    const user = userEvent.setup()
    render(<App />)
    const link = screen.getByRole('link', { name: /干炒牛河/ })
    await user.click(link)
    expect(await screen.findByRole('heading', { name: /干炒牛河/ })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '返回食谱' }))
    expect(screen.getByRole('heading', { name: '今天吃什么' })).toBeInTheDocument()
  })

  it('passes a planner recipe query through to the planner selection', async () => {
    window.location.hash = '#/planner?recipeId=beef-chow-fun'
    render(<App />)
    expect(await screen.findByRole('combobox', { name: '菜单食谱' })).toHaveValue('beef-chow-fun')
  })

  it('routes to choose mode', async () => {
    window.location.hash = '#/choose'
    render(<App />)
    expect(await screen.findByRole('heading', { name: '你来点菜' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '点菜码' })).toBeInTheDocument()
  })

  it('routes to shopping list', async () => {
    window.location.hash = '#/shopping'
    render(<App />)
    expect(await screen.findByRole('heading', { name: '购物清单' })).toBeInTheDocument()
    expect(await screen.findByLabelText('添加一项')).toBeInTheDocument()
  })

  it('routes to import selection', async () => {
    window.location.hash = '#/import'
    render(<App />)
    expect(await screen.findByRole('heading', { name: '导入点菜' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入' })).toBeInTheDocument()
  })
})
