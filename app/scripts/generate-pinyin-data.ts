// 生成 src/search/pinyin-data.ts：菜谱目录（标题/食材/标签）中出现的汉字 → 无声调全拼。
// 用法：npm run gen:pinyin（目录变化后重新生成并提交产物）。
// pinyin-pro 仅是开发依赖，产物是打字表，运行时零依赖。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pinyin } from 'pinyin-pro'
import type { Recipe } from '../src/catalog/types'

const inputDir = 'catalog/recipes'
const outputFile = 'src/search/pinyin-data.ts'

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch)

const chars = new Set<string>()
const collect = (text: string | undefined) => {
  if (!text) return
  for (const ch of text) if (isHan(ch)) chars.add(ch)
}

for (const filename of readdirSync(inputDir)) {
  if (!filename.endsWith('.json')) continue
  const recipe = JSON.parse(readFileSync(join(inputDir, filename), 'utf8')) as Recipe
  collect(recipe.title)
  for (const ingredient of recipe.ingredients) collect(ingredient.name)
  for (const tag of recipe.tags ?? []) collect(tag)
}

const lines = [...chars]
  .sort((a, b) => a.localeCompare(b, 'zh-CN'))
  .map((ch) => {
    const py = pinyin(ch, { toneType: 'none' }).trim()
    return `  '${ch}': '${py}',`
  })

const header = [
  '// 自动生成，请勿手改：运行 npm run gen:pinyin 重新生成。',
  '// 覆盖 app/catalog/recipes 目录中标题、食材名、标签出现的汉字 → 无声调全拼（拼音搜索用）。',
  '',
  `export const PINYIN_DATA: Record<string, string> = {`,
]

writeFileSync(outputFile, `${[...header, ...lines, '}\n'].join('\n')}`, 'utf8')
console.log(`wrote ${outputFile}: ${lines.length} characters`)