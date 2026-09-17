// Dev-only screenshot harness: renders key pages against a running preview server.
// Usage: node scripts/screenshot-pages.mjs [outputDir]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const outputDir = resolve(process.argv[2] ?? '../work/screenshots')
mkdirSync(outputDir, { recursive: true })

const PORT = 4173
const shots = [
  { name: 'home-390', width: 390, height: 844, url: '/' },
  { name: 'home-320', width: 320, height: 700, url: '/' },
  { name: 'home-1440', width: 1440, height: 900, url: '/' },
  { name: 'detail-390', width: 390, height: 844, url: '/#/recipes/beef-chow-fun' },
  { name: 'cooking-390', width: 390, height: 844, url: '/#/recipes/beef-chow-fun/cook?servings=2' },
  { name: 'planner-390', width: 390, height: 844, url: '/#/planner' },
  { name: 'planner-1440', width: 1440, height: 900, url: '/#/planner' },
  { name: 'shopping-390', width: 390, height: 844, url: '/#/shopping' },
  { name: 'choose-390', width: 390, height: 844, url: '/#/choose' },
  { name: 'import-390', width: 390, height: 844, url: '/#/import' },
]

const browser = await chromium.launch()
try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } })
    await page.goto(`http://127.0.0.1:${PORT}${shot.url}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(outputDir, `${shot.name}.png`), fullPage: false })
    console.log('captured', shot.name)
    await page.close()
  }
} finally {
  await browser.close()
  console.log('done ->', outputDir)
}