import { test, expect } from '@playwright/test'

test('recipe browse remains available offline after first load', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '找菜' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Beef Chow Fun' })).toBeVisible()
  await page.evaluate(async () => { await navigator.serviceWorker?.ready })
  await context.setOffline(true)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '找菜' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Beef Chow Fun' })).toBeVisible()
})
