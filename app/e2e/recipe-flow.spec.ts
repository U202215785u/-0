import { test, expect } from '@playwright/test'

const MOBILE_WIDTHS = [320, 360, 390, 430]

test.describe('mobile recipe flow', () => {
  for (const width of MOBILE_WIDTHS) {
    test(`at ${width}px a user finds, plans, shops, and cooks a dish`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/')
      await expect(page.getByRole('heading', { name: '今天吃什么' })).toBeVisible()
      await expect(page.getByRole('navigation', { name: '底部导航' })).toBeVisible()

      await page.getByPlaceholder('搜菜名、食材或标签').fill('牛河')
      await page.getByRole('link', { name: /干炒牛河/ }).click()
      await expect(page.getByRole('heading', { name: /干炒牛河/ })).toBeVisible()

      // adjust servings and start cooking with it
      await page.getByRole('button', { name: '增加份数' }).click()
      await page.getByRole('link', { name: '开始烹饪' }).click()
      await expect(page.getByText(/人份/).first()).toBeVisible()
      await expect(page.locator('.cooking-step')).toBeVisible()
      await expect(page.getByText(/第 1 步，共/)).toBeVisible()
      await page.getByRole('link', { name: '退出烹饪' }).click()

      // add to the plan from detail
      await page.getByRole('link', { name: '加入菜单' }).click()
      await expect(page.getByRole('heading', { name: '周计划' })).toBeVisible()
      await page.getByRole('button', { name: /添加午餐/ }).click()
      await expect(page.locator('.planner-slot-card').filter({ hasText: '午餐' }).getByText('干炒牛河', { exact: true })).toBeVisible()

      // shopping list from the plan
      await page.getByRole('navigation', { name: '底部导航' }).getByRole('link', { name: '采购' }).click()
      await expect(page.getByRole('heading', { name: '购物清单' })).toBeVisible()
      const broccoli = page.getByRole('checkbox', { name: '牛里脊肉' })
      await expect(broccoli).toBeVisible()
      await broccoli.check()
      await expect(broccoli).toBeChecked()
      await expect(page.getByText('已购 1')).toBeVisible()
    })
  }
})

test.describe('choose and import flow at 390px', () => {
  test('wife picks dishes, generates a code, and the cook imports it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#/choose')
    await expect(page.getByRole('heading', { name: '你来点菜' })).toBeVisible()

    await page.getByRole('link', { name: '去找菜' }).click()
    await expect(page.getByRole('heading', { name: '选菜' })).toBeVisible()
    await page.getByRole('link', { name: /干炒牛河/ }).click()
    await page.getByRole('button', { name: '想吃' }).click()
    await page.getByRole('link', { name: '返回点菜列表' }).click()
    await expect(page.getByRole('heading', { name: '选菜' })).toBeVisible()
    await page.getByRole('link', { name: '返回点菜' }).click()

    const code = await page.getByRole('textbox', { name: '点菜码' }).inputValue()
    expect(code).toContain('家宴点菜:')
    expect(code).toContain('beef-chow-fun')

    // cook device: import
    await page.goto('/#/import')
    await expect(page.getByRole('heading', { name: '导入点菜' })).toBeVisible()
    await page.getByRole('textbox', { name: '点菜码' }).fill(code)
    await page.getByRole('button', { name: '导入' }).click()
    await expect(page.getByText(/已收到：/)).toBeVisible()
    await expect(page.getByRole('link', { name: /干炒牛河/ })).toBeVisible()
    // importing must not create plan slots
    await page.goto('/#/planner')
    await expect(page.locator('.planner-slot-card, .planner-slot').filter({ hasText: '干炒牛河' }).first()).toBeHidden()
  })
})

test.describe('mobile shopping persistence', () => {
  test('checked state survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#/planner')
    await page.getByRole('combobox', { name: '菜单食谱' }).selectOption({ label: '干炒牛河' })
    await page.getByRole('button', { name: /添加午餐/ }).click()
    await page.getByRole('navigation', { name: '底部导航' }).getByRole('link', { name: '采购' }).click()
    const checkbox = page.getByRole('checkbox', { name: '牛里脊肉' })
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    await page.reload()
    await expect(page.getByRole('heading', { name: '购物清单' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: '牛里脊肉' })).toBeChecked()
  })
})
