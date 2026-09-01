import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './app'

afterEach(() => { window.location.hash = '' })

describe('App navigation', () => {
  it('rerenders the detail view after selecting a recipe', async () => {
    const user = userEvent.setup()
    render(<App />)
    const link = screen.getAllByRole('link')[0]
    await user.click(link)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(await screen.findByRole('heading', { name: /Beef Chow Fun/ })).toBeInTheDocument()
  })
})
