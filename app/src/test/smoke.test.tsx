import { render, screen } from '@testing-library/react'
import { App } from '../app'

it('renders the recipe-first home screen', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '找菜' })).toBeInTheDocument()
})
