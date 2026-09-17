import { render, screen } from '@testing-library/react'
import { App } from '../app'

it('renders the recipe-first home screen', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: '今天吃什么' })).toBeInTheDocument()
})