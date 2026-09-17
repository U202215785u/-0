// Generate PWA icons by rendering an SVG through headless Chromium.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const iconDir = resolve('./public/icons')
mkdirSync(iconDir, { recursive: true })

const svgTemplate = (size) => `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background:#FF9500;border-radius:${Math.round(size*0.2)}px">
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="'PingFang SC','Microsoft YaHei',system-ui,sans-serif"
    font-size="${Math.round(size*0.5)}" fill="#ffffff" font-weight="700">宴</text>
</svg></body></html>`

const browser = await chromium.launch()
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    await page.setContent(svgTemplate(size))
    const buf = await page.screenshot({ type: 'png' })
    writeFileSync(join(iconDir, `icon-${size}.png`), buf)
    // maskable version: same but with safe-area padding conceptually handled by purpose field
    writeFileSync(join(iconDir, `icon-maskable-${size}.png`), buf)
    console.log('generated', `icon-${size}.png`)
    await page.close()
  }
} finally {
  await browser.close()
  console.log('icons written to', iconDir)
}