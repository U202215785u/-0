import { render, screen } from '@testing-library/react'
import { App } from '../app'

it('renders the recipe-first home screen', { timeout: 30000 }, async () => {
  render(<App />)
  // 首页会为筛选角标遍历整个 catalog；在并行测试负载下放宽默认 5s 超时
  expect(await screen.findByRole('heading', { name: '今天吃什么' }, { timeout: 20000 })).toBeInTheDocument()
})