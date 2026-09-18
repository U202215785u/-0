import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RecipeBrowser } from './recipe-browser'
import type { Recipe } from '../../catalog/types'

const fixtureCatalog: Recipe[] = [
  { id: 'beef-chow-fun', title: '干炒牛河', tags: ['炒', '家常菜'], difficulty: '中等', durationMinutes: 20, ingredients: [{ name: '牛肉' }], steps: [] },
  { id: 'soup', title: '番茄汤', tags: ['煮', '汤羹'], difficulty: '简单', durationMinutes: 40, ingredients: [{ name: '番茄' }], steps: [] },
  { id: 'fried-rice', title: '蛋炒饭', tags: ['炒', '主食', '快手菜'], difficulty: '简单', durationMinutes: 10, ingredients: [{ name: '鸡蛋' }], steps: [] },
]

describe('RecipeBrowser', () => {
  it('filters results when a cooking-method tag is selected', async () => {
    const user = userEvent.setup()
    render(<RecipeBrowser catalog={fixtureCatalog} />)
    await user.click(screen.getByRole('button', { name: /^炒/ }))
    expect(screen.getByText('干炒牛河')).toBeInTheDocument()
    expect(screen.getByText('蛋炒饭')).toBeInTheDocument()
    expect(screen.queryByText('番茄汤')).not.toBeInTheDocument()
  })

  it('only combines within-dimension selections with OR and across dimensions with AND', async () => {
    const user = userEvent.setup()
    render(<RecipeBrowser catalog={fixtureCatalog} />)
    await user.click(screen.getByRole('button', { name: /^炒/ }))
    await user.click(screen.getByRole('button', { name: /^煮/ }))
    expect(screen.getByText('干炒牛河')).toBeInTheDocument()
    expect(screen.getByText('番茄汤')).toBeInTheDocument()
    expect(screen.getByText('蛋炒饭')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^主食/ }))
    expect(screen.queryByText('干炒牛河')).not.toBeInTheDocument()
    expect(screen.queryByText('番茄汤')).not.toBeInTheDocument()
    expect(screen.getByText('蛋炒饭')).toBeInTheDocument()
  })

  it('filters by difficulty and clears everything', async () => {
    const user = userEvent.setup()
    render(<RecipeBrowser catalog={fixtureCatalog} />)
    await user.click(screen.getByRole('button', { name: /^简单/ }))
    expect(screen.getByText('番茄汤')).toBeInTheDocument()
    expect(screen.getByText('蛋炒饭')).toBeInTheDocument()
    expect(screen.queryByText('干炒牛河')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /清除全部筛选/ }))
    expect(screen.getByText('干炒牛河')).toBeInTheDocument()
  })

  it('shows result counts and chip counts', () => {
    render(<RecipeBrowser catalog={fixtureCatalog} />)
    expect(screen.getByRole('button', { name: /^炒/ })).toHaveTextContent('2')
    expect(screen.getByText(/共找到 3 道/)).toBeInTheDocument()
  })

  it('uses choose-only links when requested', () => {
    render(<RecipeBrowser catalog={fixtureCatalog} chooseOnly />)
    expect(screen.getByRole('link', { name: '干炒牛河' })).toHaveAttribute('href', '#/choose/recipes/beef-chow-fun')
  })

  it('lets the chooser return to the wanted list and keeps the cook flow clean', () => {
    const { unmount } = render(<RecipeBrowser catalog={fixtureCatalog} chooseOnly />)
    expect(screen.getByRole('link', { name: '返回点菜' })).toHaveAttribute('href', '#/choose')
    unmount()
    render(<RecipeBrowser catalog={fixtureCatalog} />)
    expect(screen.queryByRole('link', { name: '返回点菜' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '导入点菜码' })).toHaveAttribute('href', '#/import')
  })
})