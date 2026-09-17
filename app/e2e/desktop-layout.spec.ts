import { test, expect } from '@playwright/test'

test.describe('desktop layout at 1440px', () => {
  test('planner shows the seven-day grid and cooking uses the split view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#/planner')
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
    await expect(page.getByRole('link', { name: '采购' })).toBeVisible()
    await expect(page.locator('.planner-grid')).toBeVisible()

    await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '找菜' }).click()
    await expect(page.getByRole('heading', { name: '今天吃什么' })).toBeVisible()
    await page.getByRole('link', { name: /干炒牛河/ }).first().click()
    await page.getByRole('link', { name: '开始烹饪' }).click()
    await expect(page.locator('.cooking-ingredients')).toBeVisible()
    await expect(page.locator('.cooking-step')).toBeVisible()
    await expect(page.getByRole('link', { name: '退出烹饪' })).toBeVisible()
  })
})

test.describe('mobile planner date strip', () => {
  test('selecting a date shows that day\'s lunch and dinner', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#/planner')
    const tabs = page.getByRole('tab', { name: /选择/ })
    await expect(tabs.first()).toBeVisible()
    await expect(tabs).toHaveCount(7)
    await tabs.nth(2).click()
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('combobox', { name: '菜单食谱' }).selectOption({ label: '干炒牛河' })
    await page.getByRole('button', { name: /添加午餐/ }).click()
    const lunchCard = page.locator('.planner-slot-card').filter({ hasText: '午餐' })
    await expect(lunchCard.getByText('干炒牛河', { exact: true })).toBeVisible()
    // remove it again
    await lunchCard.getByRole('button', { name: '移除' }).click()
    await expect(lunchCard.getByText('未安排', { exact: true })).toBeVisible()
  })
})