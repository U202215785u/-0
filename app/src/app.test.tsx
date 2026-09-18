import { act, render, screen, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './app'
import { appDb } from './db/app-db'

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/**
 * Yields through many macrotask turns so the full Dexie/fake-indexeddb promise
 * chains (connection open, read queries, per-navigation refresh) settle inside
 * the surrounding act() scope instead of after the test moves on.
 */
async function settle() {
  for (let i = 0; i < 100; i++) await flush()
}

/** Renders the App shell and lets the initial IndexedDB hydration settle inside act(). */
async function renderApp(hash = ''): Promise<RenderResult> {
  window.location.hash = hash
  // Open the connection up front so the shell's first read resolves inside the
  // act scope below (a cold IndexedDB open takes too many turns to flush).
  await appDb.open()
  let result!: RenderResult
  await act(async () => {
    result = render(<App />)
    await settle()
  })
  return result
}

/** Clicks inside act() and lets the App shell's per-navigation IndexedDB refresh settle. */
async function clickInside(user: UserEvent, target: HTMLElement) {
  await act(async () => {
    await user.click(target)
    await settle()
  })
}

afterEach(async () => {
  window.location.hash = ''
  await Promise.all([appDb.shopping.clear(), appDb.imports.clear(), appDb.plans.clear(), appDb.wanted.clear()])
})

describe('App navigation', { timeout: 30000 }, () => {
  it('rerenders the detail view after selecting a recipe', async () => {
    const user = userEvent.setup()
    await renderApp()
    expect(screen.getByRole('heading', { name: '今天吃什么' })).toBeInTheDocument()
    await clickInside(user, screen.getByRole('link', { name: /干炒牛河/ }))
    expect(screen.getByRole('heading', { name: /干炒牛河/ })).toBeInTheDocument()
    await clickInside(user, screen.getByRole('link', { name: '返回食谱' }))
    expect(screen.getByRole('heading', { name: '今天吃什么' })).toBeInTheDocument()
  })

  it('passes a planner recipe query through to the planner selection', async () => {
    await renderApp('#/planner?recipeId=beef-chow-fun')
    expect(screen.getByRole('combobox', { name: '菜单食谱' })).toHaveValue('beef-chow-fun')
  })

  it('routes to choose mode', async () => {
    await renderApp('#/choose')
    expect(screen.getByRole('heading', { name: '你来点菜' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '点菜码' })).toBeInTheDocument()
  })

  it('routes to shopping list', async () => {
    await renderApp('#/shopping')
    expect(screen.getByRole('heading', { name: '购物清单' })).toBeInTheDocument()
    expect(await screen.findByLabelText('添加一项')).toBeInTheDocument()
  })

  it('routes to import selection', async () => {
    await renderApp('#/import')
    expect(screen.getByRole('heading', { name: '导入点菜' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入' })).toBeInTheDocument()
  })
})