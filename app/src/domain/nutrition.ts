// 确定性营养估算引擎：输入 Recipe，输出按人份（per-serving）的营养估算。
//
// 设计原则：
// 1. 绝不编造份量——食材没有数值份量（适量/少许/未给数量）时不计入，改记到缺失清单，
//    结果因此是"下限"，并在 note 中如实说明；只有盐/水等零卡食材被量化时不给估算。
// 2. 幂等——同一道菜同一份数据，反复计算结果完全一致（纯函数）。
// 3. 单位换算与营养值均来自 food-db.ts（每 100 克参考值），不再由语言模型逐道自由发挥。
// 4. 明确的总量优先：名称内嵌重量（如"共 1.5 千克鸡腿"）优先于"只/个"计数换算。
// 5. 炸制余油折算：植物油按"最多 max(20g, 20%×其他食材总克数)"计入，避免把整锅
//    炸油 100% 算进一道菜（酥皮/猪油等烘焙用油因用量小而几乎不受影响）。
// 6. 热量统一按 4-4-9（千卡/克）系数由蛋白/碳水/脂肪折算，与输出宏量完全自洽可复核。

import type { Ingredient, Recipe, RecipeNutrition } from '../catalog/types'
import {
  categoryFallbacks,
  foodProfiles,
  junkEntryPatterns,
  nameProfileOverrides,
  volumeUnitsGrams,
  type FoodProfile,
} from './food-db'

export const nutritionKeys = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'sugarG', 'saturatedFatG', 'sodiumMg'] as const
export type NutritionKey = (typeof nutritionKeys)[number]
export type NutritionValues = { [K in NutritionKey]: number }

export const NUTRITION_CALCULATION_VERSION = 'fooddb-2026-09-18'

const emptyValues = (): NutritionValues => ({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, saturatedFatG: 0, sodiumMg: 0 })

// —— 名称正则分派（在 mergeKey 精确匹配之前，用于细分形态） ——
function profileKeyForName(name: string): string | undefined {
  for (const { pattern, profileKey } of nameProfileOverrides) {
    if (pattern.test(name)) return profileKey
  }
  return undefined
}

function isJunkEntry(ingredient: Ingredient): boolean {
  return junkEntryPatterns.some((pattern) => pattern.test(ingredient.name))
}

export function resolveProfile(ingredient: Ingredient): { profile?: FoodProfile; approximate: boolean } {
  const byName = profileKeyForName(ingredient.name)
  const key = byName ?? ingredient.mergeKey
  if (key && foodProfiles[key]) return { profile: foodProfiles[key], approximate: false }
  for (const { pattern, profile } of categoryFallbacks) {
    if (pattern.test(ingredient.name)) return { profile, approximate: true }
  }
  return { profile: undefined, approximate: false }
}

// —— 名称内嵌明确重量：如 "共1.5千克鸡腿"、"800克羊肉"、"约500克鱿鱼"、"150克左右米饭" ——
const embeddedWeightPattern = /(?:约|共|各|左右|差不多)?(\d+(?:\.\d+)?)\s*(千克|公斤|克|斤|两|毫升)/u

function embeddedWeightGrams(name: string, density: number | undefined): number | undefined {
  const match = embeddedWeightPattern.exec(name)
  if (!match) return undefined
  const value = Number(match[1])
  const unit = match[2]
  if (unit === '千克' || unit === '公斤') return value * 1000
  if (unit === '斤') return value * 500
  if (unit === '两') return value * 50
  if (unit === '毫升') return value * (density ?? 1)
  return value // 克
}

const embeddedUnitToken = '(白瓷勺|炒菜勺|汤勺|大勺|汤匙|大匙|小勺|茶匙|小匙|调料勺|小碗|大碗|小块|大片|小片|小把|勺|匙|杯|碗|盒|包|袋|罐|听|瓶|块|片|个|只|枚|颗|粒|根|条|瓣|朵|棵|张|把|段|节|尾|支|滴|斤|两|克|毫升|撮)'

function parseEmbeddedUnit(name: string): { unit: string; fraction: number; half: boolean } | undefined {
  const cleanName = name.replace(/^[-－、，,]+/u, '')
  // 形式："1/2 茶匙"、"1/4 个"；"小半汤勺"≈0.4
  const smallHalf = new RegExp(`^(?:各|又)?小半${embeddedUnitToken}`, 'u').exec(cleanName)
  if (smallHalf) {
    const [, unit] = smallHalf
    return { unit, fraction: 0.4, half: false }
  }
  const direct = new RegExp(`^(?:各|又)?(\\d+(?:\\.\\d+)?)\\s*(?:/|／)(\\d+)\\s*(半)?${embeddedUnitToken}`, 'u').exec(cleanName)
  if (direct) {
    const [, a, b, half, unit] = direct
    return { unit, fraction: Number(a) / Number(b), half: half === '半' }
  }
  const slash = new RegExp(`^(?:各|又)?/(\\d+)\\s*(半)?${embeddedUnitToken}`, 'u').exec(cleanName)
  if (slash) {
    const [, a, half, unit] = slash
    return { unit, fraction: 1 / Number(a), half: half === '半' }
  }
  const halfTok = new RegExp(`^(?:各|又)?半${embeddedUnitToken}`, 'u').exec(cleanName)
  if (halfTok) {
    const [, unit] = halfTok
    return { unit, fraction: 1, half: true }
  }
  const plain = new RegExp(`^(?:各|又)?(\\d+(?:\\.\\d+)?)\\s*${embeddedUnitToken}`, 'u').exec(cleanName)
  if (plain) {
    // 名称里的整数通常只是重复 amount（如 "15毫升蜂蜜 ×15"、"3个鸡蛋 ×2"），
    // 仅取单位、不乘数量；只有分数/半 形式（/2、1/2、小半、半）才是真正的比例。
    const [, , unit] = plain
    return { unit, fraction: 1, half: false }
  }
  const bare = new RegExp(`^(?:各|又)?${embeddedUnitToken}`, 'u').exec(cleanName)
  if (bare) {
    const [, unit] = bare
    return { unit, fraction: 1, half: false }
  }
  return undefined
}

const massVolumeUnit = /^(千克|公斤|毫克|升|毫升|克|斤|两)/u

function isWholeAnimalUnit(unit: string, profile: FoodProfile | undefined): boolean {
  if (unit === '只' || unit === '条' || unit === '尾') return true
  if (unit === '个' && (profile?.count?.个 ?? 0) >= 300) return true
  return false
}

// 解析"数量 + 单位"为克。解析不出时返回 undefined（该食材将进入缺失清单）。
export function gramsFor(ingredient: Ingredient): number | undefined {
  if (ingredient.quantityText !== undefined) return undefined

  const { profile } = resolveProfile(ingredient)
  const unit = (ingredient.unit ?? '').trim().toLowerCase().replace(/\s+/g, '')

  // 名称内嵌明确重量优先：unit 为空，或是"只/条/个"等计数单位时，以名称中写明的重量为准
  if (unit === '' || !massVolumeUnit.test(unit)) {
    const embeddedWeight = embeddedWeightGrams(ingredient.name, profile?.density)
    if (embeddedWeight !== undefined) {
      const portion = isWholeAnimalUnit(unit, profile) ? (profile?.portion ?? 1) : 1
      return embeddedWeight * portion
    }
  }

  if (ingredient.amount === undefined) return undefined

  let amount = ingredient.amount
  let half = false
  let resolvedUnit = unit

  if (resolvedUnit === '') {
    const parsed = parseEmbeddedUnit(ingredient.name)
    if (!parsed) return undefined
    resolvedUnit = parsed.unit?.toLowerCase().replace(/\s+/g, '') ?? ''
    amount = amount * parsed.fraction
    half = parsed.half
  }

  if (/^(千克|公斤)$/u.test(resolvedUnit)) return amount * 1000
  if (/^毫克$/u.test(resolvedUnit)) return amount / 1000
  if (/^升$/u.test(resolvedUnit)) return amount * 1000 * (profile?.density ?? 1)
  if (/^(毫升|ml)$/u.test(resolvedUnit)) return amount * (profile?.density ?? 1)
  if (resolvedUnit.startsWith('克')) return amount // 含 "克（约N个）" 形式，amount 即克数
  if (/^斤$/u.test(resolvedUnit)) return amount * 500
  if (/^两$/u.test(resolvedUnit)) return amount * 50

  const volumeGrams = (token: string): number | undefined => {
    const grams = volumeUnitsGrams[token]
    if (grams === undefined) return undefined
    // 杯/碗 等有明确"一碗=多少克"经验的食材用经验值，否则按容积×密度
    if ((token === '杯' || token === '碗' || token === '小碗' || token === '大碗') && profile?.count && profile.count[token] !== undefined) return profile.count[token]
    return grams * (profile?.density ?? 1)
  }
  const countGrams = (token: string): number | undefined => {
    if (profile?.count && profile.count[token] !== undefined) return profile.count[token]
    return undefined
  }

  const cased = (token: string) => new RegExp(`^${token}$`, 'u').test(resolvedUnit)
  const halfPrefix = resolvedUnit.startsWith('半')
  const unitBody = halfPrefix ? resolvedUnit.slice(1) : resolvedUnit
  const applyHalf = (value: number): number => (half || halfPrefix ? value * 0.5 : value)

  if (cased('汤匙') || cased('汤勺') || cased('大勺') || cased('大匙') || cased('白瓷勺') || cased('炒菜勺')) return applyHalf(amount * (volumeGrams('汤匙') ?? 15 * (profile?.density ?? 1)))
  if (cased('茶匙') || cased('小勺') || cased('小匙') || cased('调料勺')) return applyHalf(amount * (volumeGrams('茶匙') ?? 5 * (profile?.density ?? 1)))
  if (cased('勺')) return applyHalf(amount * (volumeGrams('勺') ?? 10 * (profile?.density ?? 1)))
  if (cased('匙')) return applyHalf(amount * (volumeGrams('匙') ?? 5 * (profile?.density ?? 1)))
  if (cased('杯')) return applyHalf(amount * (volumeGrams('杯') ?? 240 * (profile?.density ?? 1)))
  if (cased('小碗')) return applyHalf(amount * (volumeGrams('小碗') ?? 200 * (profile?.density ?? 1)))
  if (cased('大碗')) return applyHalf(amount * (volumeGrams('大碗') ?? 300 * (profile?.density ?? 1)))
  if (cased('碗')) return applyHalf(amount * (volumeGrams('碗') ?? 250 * (profile?.density ?? 1)))
  if (cased('滴')) return applyHalf(amount * (countGrams('滴') ?? 0.05))
  if (cased('撮')) return applyHalf(amount * (countGrams('撮') ?? 1))

  // 计数单位（含半根/半包等）
  const countToken = unitBody
  const perUnit = countGrams(countToken)
  if (perUnit !== undefined) {
    const portion = isWholeAnimalUnit(countToken, profile) ? (profile?.portion ?? 1) : 1
    return applyHalf(amount * perUnit * portion)
  }
  return undefined
}

export function roundNutrition(values: NutritionValues): NutritionValues {
  return {
    kcal: Math.round(values.kcal),
    proteinG: Math.round(values.proteinG * 10) / 10,
    carbsG: Math.round(values.carbsG * 10) / 10,
    fatG: Math.round(values.fatG * 10) / 10,
    fiberG: Math.round(values.fiberG * 10) / 10,
    sugarG: Math.round(values.sugarG * 10) / 10,
    saturatedFatG: Math.round(values.saturatedFatG * 10) / 10,
    sodiumMg: Math.round(values.sodiumMg),
  }
}

export function estimateNutrition(recipe: Pick<Recipe, 'ingredients' | 'baseServings'>): RecipeNutrition | undefined {
  const total = emptyValues()
  const missingIngredientNames: string[] = []
  let foodCount = 0
  let quantifiedCount = 0
  let approximateUsed = false

  // 第一遍：收集每个可量化食材的克数与性质，用于炸制余油折算
  const entries: Array<{ index: number; grams: number; approximate: boolean; isOil: boolean }> = []
  let oilGramsTotal = 0
  let nonOilGramsTotal = 0
  recipe.ingredients.forEach((ingredient, index) => {
    if (isJunkEntry(ingredient)) return
    foodCount++
    const { profile, approximate } = resolveProfile(ingredient)
    if (profile) approximateUsed = approximateUsed || approximate
    const grams = gramsFor(ingredient)
    if (profile && grams !== undefined) {
      quantifiedCount++
      const isOil = Boolean(profile.oil)
      entries.push({ index, grams, approximate, isOil })
      if (isOil) oilGramsTotal += grams
      else nonOilGramsTotal += grams
    } else {
      missingIngredientNames.push(ingredient.name)
    }
  })

  if (quantifiedCount === 0) return undefined

  // 炸制余油折算：植物油最多按 max(20g, 20%×其他食材总克数) 计入
  const oilCap = Math.max(20, 0.2 * nonOilGramsTotal)
  const oilCapped = oilGramsTotal > oilCap
  const oilFactor = oilGramsTotal > 0 && oilGramsTotal > oilCap ? oilCap / oilGramsTotal : 1

  for (const { index, grams, isOil } of entries) {
    const ingredient = recipe.ingredients[index]
    const { profile } = resolveProfile(ingredient)
    if (!profile) continue
    const ratio = (grams * (isOil ? oilFactor : 1)) / 100
    for (const key of nutritionKeys) {
      if (key === 'kcal') continue // 热量在汇总后按 4-4-9 系数折算，见下方
      total[key] += (profile[key] ?? 0) * ratio
    }
  }

  // 热量统一按 4-4-9（千卡/克）系数由蛋白/碳水/脂肪折算，与输出的三项宏量完全自洽、可审计。
  total.kcal = total.proteinG * 4 + total.carbsG * 4 + total.fatG * 9
  if (total.kcal < 1) return undefined // 只有盐/水/微量酒等零卡食材被量化时无估算价值

  const quantityCoverage = foodCount > 0 ? Math.round((quantifiedCount / foodCount) * 100) / 100 : 0
  const servings = recipe.baseServings ?? 2
  const perServing = Object.fromEntries(nutritionKeys.map((key) => [key, total[key] / servings])) as NutritionValues
  const rounded = roundNutrition(perServing)
  const confidence: 'medium' | 'low' = !approximateUsed && quantityCoverage === 1 && !oilCapped ? 'medium' : 'low'
  const missingNote = missingIngredientNames.length > 0
    ? `${missingIngredientNames.length} 项食材缺少可换算来源份量，未计入热量，结果为下限`
    : '全部食材已按来源份量计入'
  const approxNote = approximateUsed ? '；部分食材按分类近似值计入' : ''
  const oilNote = oilCapped ? '；炸制用油按保留量折算（未把整锅油计入）' : ''

  return {
    ...rounded,
    basis: 'per-serving' as const,
    source: 'estimated' as const,
    confidence,
    quantityCoverage,
    missingIngredientNames: missingIngredientNames.length > 0 ? missingIngredientNames : undefined,
    calculationVersion: NUTRITION_CALCULATION_VERSION,
    note: `已按离线食材数据库和来源份量核算${missingNote}${approxNote}${oilNote}；热量按蛋白/碳水/脂肪 4-4-9 千卡每克系数折算，仅用于日常比较，不替代营养标签或医疗建议。`,
  }
}