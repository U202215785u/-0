// 模糊搜索核心：查询打分（0 表示不匹配，越大越相关）。
//
// 支持三类"模糊"：
//  1. 漏字/乱序 —— 子序列匹配："腐竹肉" → "腐竹烧肉"
//  2. 错字容忍 —— 编辑距离："青桥鸡腿" → "青椒鸡腿"
//  3. 拼音 —— "fzsr"/"fuzhushaorou" → "腐竹烧肉"（依赖生成表 pinyin-data.ts）
//
// 匹配范围：标题、食材名、mergeKey、标签、步骤文本、来源说明。
// 纯函数、幂等、无副作用；供 recipe-filters 与菜谱浏览器排序共用。
import type { Recipe } from '../catalog/types'
import { PINYIN_DATA } from './pinyin-data'

export function normalizeQuery(input: string): string {
  return input.trim().toLocaleLowerCase().replace(/\s+/g, '')
}

const HAS_CJK = /[\u4e00-\u9fff]/
const HAS_LETTER = /[a-z]/

/** needle 的每个字符按顺序出现在 hay 中（子序列匹配，容忍漏字） */
export function isSubsequence(needle: string, hay: string): boolean {
  if (needle.length === 0) return true
  let i = 0
  for (const ch of hay) {
    if (ch === needle[i]) {
      i += 1
      if (i === needle.length) return true
    }
  }
  return i === needle.length
}

/** 带上限的莱文斯坦距离；超过 max 提前返回 max+1 */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > max) return max + 1
  let prev = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    const cur = new Array<number>(n + 1)
    cur[0] = i
    let rowMin = cur[0]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[n]
}

function maxEditsFor(query: string): number {
  const len = query.length
  if (len <= 4) return 1
  if (len <= 7) return 2
  return 3
}

/** 在 field 的等长窗口内做错字容忍匹配；q 为空或过短时不做模糊 */
function fuzzyMatch(query: string, field: string): boolean {
  if (field.includes(query)) return true
  if (query.length < 2) return false
  if (isSubsequence(query, field)) return true
  const maxEdits = maxEditsFor(query)
  const targetLens = [query.length - 1, query.length, query.length + 1]
  for (const len of targetLens) {
    if (len < 1 || len > field.length) continue
    const windowCount = field.length - len + 1
    for (let i = 0; i < windowCount; i++) {
      if (editDistance(query, field.slice(i, i + len), maxEdits) <= maxEdits) return true
    }
  }
  return false
}

// —— 拼音 ——

function pinyinParts(text: string): string[] | undefined {
  const parts: string[] = []
  for (const ch of text) {
    const py = PINYIN_DATA[ch]
    if (py === undefined) return undefined
    parts.push(py)
  }
  return parts
}

function pinyinOf(text: string): string | undefined {
  const parts = pinyinParts(text)
  return parts ? parts.join('') : undefined
}

function initialsOf(text: string): string | undefined {
  const parts = pinyinParts(text)
  return parts ? parts.map((p) => p[0]).join('') : undefined
}

/** 拼音路径：仅纯字母/数字查询走拼音；至少 2 个字符 */
function matchesPinyin(query: string, recipe: Recipe): boolean {
  if (query.length < 2 || HAS_CJK.test(query)) return false
  const titlePinyin = pinyinOf(recipe.title)
  const titleInitials = initialsOf(recipe.title)
  if (titlePinyin && titlePinyin.includes(query)) return true
  if (titleInitials && (titleInitials.startsWith(query) || isSubsequence(query, titleInitials))) return true
  if (titlePinyin && isSubsequence(query, titlePinyin)) return true
  // 食材名拼音（最前面 12 项，控制扫描成本）
  for (const ingredient of recipe.ingredients.slice(0, 12)) {
    const py = pinyinOf(ingredient.name)
    if (py && py.includes(query)) return true
    const init = initialsOf(ingredient.name)
    if (init && isSubsequence(query, init)) return true
  }
  return false
}

// —— 打分 ——

type Field = { text: string; weight: number }

/**
 * 查询打分。0 = 不匹配。分数只用于排序，绝对值无意义。
 * 设计：标题权重最高；食材/标签次之；mergeKey/步骤更弱。
 */
export function scoreQuery(recipe: Recipe, rawQuery: string): number {
  const query = normalizeQuery(rawQuery)
  if (!query) return 0

  const fields: Field[] = [
    { text: recipe.title, weight: 6 },
    ...recipe.ingredients.map((ingredient) => ({ text: ingredient.name, weight: 4 })),
    ...(recipe.tags ?? []).map((tag) => ({ text: tag, weight: 3 })),
    ...recipe.ingredients
      .map((ingredient) => ingredient.mergeKey)
      .filter((key): key is string => Boolean(key))
      .map((key) => ({ text: key, weight: 2 })),
    ...recipe.steps.map((step) => ({ text: step.text, weight: 1 })),
  ]
  if (recipe.sourceNote) fields.push({ text: recipe.sourceNote, weight: 1 })

  let score = 0
  if (query.length === 1 && HAS_CJK.test(query)) {
    // 单字查询只做精确子串，避免模糊全命中
    for (const field of fields) {
      const f = field.text.toLocaleLowerCase()
      const idx = f.indexOf(query)
      if (idx === 0) score += field.weight * 120
      else if (idx > 0) score += field.weight * 100
    }
  } else {
    for (const field of fields) {
      const f = field.text.toLocaleLowerCase()
      if (f === query) {
        score += field.weight * 200
        continue
      }
      const idx = f.indexOf(query)
      if (idx === 0) score += field.weight * 120
      else if (idx > 0) score += field.weight * 100
      else if (fuzzyMatch(query, f)) score += field.weight * 55
    }
    if (HAS_LETTER.test(query)) {
      score += matchesPinyin(query, recipe) ? 300 : 0
    }
  }
  return score
}

/** 布尔版：供筛选/分面计数使用 */
export function matchesQueryScore(recipe: Recipe, query: string): boolean {
  return scoreQuery(recipe, query) > 0
}