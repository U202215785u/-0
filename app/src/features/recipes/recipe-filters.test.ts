import { describe, expect, it } from 'vitest'
import type { Recipe } from '../../catalog/types'
import {
  countForDifficulty,
  countForDuration,
  countForTag,
  emptyFilters,
  filterRecipes,
  hasActiveFilters,
  matchesFilters,
  type RecipeFilters,
} from './recipe-filters'

const catalog: Recipe[] = [
  { id: 'beef-chow-fun', title: '干炒牛河', tags: ['炒', '家常菜'], difficulty: '中等', durationMinutes: 20, ingredients: [{ name: '牛肉' }], steps: [] },
  { id: 'tomato-soup', title: '番茄汤', tags: ['煮', '汤羹'], difficulty: '简单', durationMinutes: 40, ingredients: [{ name: '番茄' }], steps: [] },
  { id: 'fried-rice', title: '蛋炒饭', tags: ['炒', '主食', '快手菜'], difficulty: '简单', durationMinutes: 10, ingredients: [{ name: '鸡蛋' }], steps: [] },
  { id: 'steamed-fish', title: '清蒸鲈鱼', tags: ['蒸', '减脂高蛋白'], difficulty: '较难', durationMinutes: 25, ingredients: [{ name: '鲈鱼' }], steps: [] },
]

const withTags = (base: RecipeFilters, tags: Partial<RecipeFilters['tagSelections']>): RecipeFilters => ({
  ...base,
  tagSelections: { ...base.tagSelections, ...tags },
})

describe('recipe filters', () => {
  it('searches title, ingredients and tags', () => {
    expect(filterRecipes(catalog, { ...emptyFilters(), query: '牛河' }).map((r) => r.id)).toEqual(['beef-chow-fun'])
    expect(filterRecipes(catalog, { ...emptyFilters(), query: '番茄' }).map((r) => r.id)).toEqual(['tomato-soup'])
    expect(filterRecipes(catalog, { ...emptyFilters(), query: '高蛋白' }).map((r) => r.id)).toEqual(['steamed-fish'])
  })

  it('treats tags within one dimension as OR', () => {
    const filters = withTags(emptyFilters(), { method: ['炒', '煮'] })
    expect(filterRecipes(catalog, filters).map((r) => r.id).sort()).toEqual(['beef-chow-fun', 'fried-rice', 'tomato-soup'])
  })

  it('treats selections across dimensions as AND', () => {
    const filters = withTags(emptyFilters(), { method: ['炒'], dishType: ['主食'] })
    expect(filterRecipes(catalog, filters).map((r) => r.id)).toEqual(['fried-rice'])
  })

  it('filters by difficulty', () => {
    const filters = { ...emptyFilters(), difficulty: '简单' as const }
    expect(filterRecipes(catalog, filters).map((r) => r.id).sort()).toEqual(['fried-rice', 'tomato-soup'])
  })

  it('filters by duration buckets', () => {
    const fast = { ...emptyFilters(), duration: 'fast' as const }
    expect(filterRecipes(catalog, fast).map((r) => r.id)).toEqual(['fried-rice'])
    const slow = { ...emptyFilters(), duration: 'slow' as const }
    expect(filterRecipes(catalog, slow).map((r) => r.id)).toEqual(['tomato-soup'])
  })

  it('combines query, tags, difficulty and duration', () => {
    const filters: RecipeFilters = {
      query: '饭',
      tagSelections: { method: ['炒'], dishType: [], feature: [], diet: [] },
      difficulty: '简单',
      duration: 'fast',
    }
    expect(filterRecipes(catalog, filters).map((r) => r.id)).toEqual(['fried-rice'])
  })

  it('reports when filters are active', () => {
    expect(hasActiveFilters(emptyFilters())).toBe(false)
    expect(hasActiveFilters({ ...emptyFilters(), query: '  ' })).toBe(false)
    expect(hasActiveFilters({ ...emptyFilters(), difficulty: '简单' })).toBe(true)
  })

  it('counts chips with other dimensions applied (faceting)', () => {
    const filters = withTags(emptyFilters(), { dishType: ['主食'] })
    // 主食被选中时，炒 的角标 = 主食 ∩ 炒 = 蛋炒饭
    expect(countForTag(catalog, filters, 'method', '炒')).toBe(1)
    // 未选任何维度时，煮 的角标 = 炖/煮 两道？煮 只命中番茄汤
    expect(countForTag(catalog, emptyFilters(), 'method', '煮')).toBe(1)
  })

  it('counts difficulty and duration chips ignoring their own selection', () => {
    const filters = { ...emptyFilters(), difficulty: '简单' as const, duration: 'fast' as const }
    // 角标 = 其余筛选(含用时 fast) ∩ 难度 简单：仅蛋炒饭(10分钟) 命中
    expect(countForDifficulty(catalog, filters, '简单')).toBe(1)
    // 用时角标忽略用时自身，但仍保留难度：简单 ∩ fast = 蛋炒饭
    expect(countForDuration(catalog, filters, 'fast')).toBe(1)
    expect(matchesFilters(catalog[2], filters)).toBe(true)
    expect(matchesFilters(catalog[0], filters)).toBe(false)
  })
})