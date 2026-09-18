import type { Recipe } from '../../catalog/types'
import type { TagDimensionKey } from '../../catalog/tags'
import { scoreQuery } from '../../search/fuzzy'

export type DifficultyFilter = '简单' | '中等' | '较难'

export const DIFFICULTIES: readonly DifficultyFilter[] = ['简单', '中等', '较难']

export type DurationBucketKey = 'fast' | 'medium' | 'slow' | 'verySlow'

export type DurationBucket = { key: DurationBucketKey; label: string; min: number; max: number }

export const DURATION_BUCKETS: readonly DurationBucket[] = [
  { key: 'fast', label: '15 分钟内', min: 0, max: 15 },
  { key: 'medium', label: '15–30 分钟', min: 15, max: 30 },
  { key: 'slow', label: '30–60 分钟', min: 30, max: 60 },
  { key: 'verySlow', label: '60 分钟以上', min: 60, max: Number.POSITIVE_INFINITY },
]

export type RecipeFilters = {
  query: string
  tagSelections: Record<TagDimensionKey, string[]>
  difficulty?: DifficultyFilter
  duration?: DurationBucketKey
}

export function emptyFilters(): RecipeFilters {
  return { query: '', tagSelections: { method: [], dishType: [], feature: [], diet: [] }, difficulty: undefined, duration: undefined }
}

export function hasActiveFilters(filters: RecipeFilters): boolean {
  const { query, tagSelections, difficulty, duration } = filters
  return Boolean(query.trim() || difficulty || duration || Object.values(tagSelections).some((tags) => tags.length > 0))
}

function matchesQuery(recipe: Recipe, needle: string): boolean {
  if (!needle) return true
  return scoreQuery(recipe, needle) > 0
}

function matchesDuration(recipe: Recipe, bucket?: DurationBucketKey): boolean {
  if (!bucket) return true
  const bounds = DURATION_BUCKETS.find((item) => item.key === bucket)
  if (!bounds) return true
  const duration = recipe.durationMinutes
  if (duration === undefined) return false
  return duration >= bounds.min && duration < bounds.max
}

export function matchesFilters(recipe: Recipe, filters: RecipeFilters): boolean {
  const { query, tagSelections, difficulty, duration } = filters
  if (!matchesQuery(recipe, query.trim().toLocaleLowerCase())) return false
  for (const dimension of ['method', 'dishType', 'feature', 'diet'] as const) {
    const selected = tagSelections[dimension]
    if (selected.length === 0) continue
    const recipeTags = recipe.tags ?? []
    if (!selected.some((tag) => recipeTags.includes(tag))) return false
  }
  if (difficulty && recipe.difficulty !== difficulty) return false
  return matchesDuration(recipe, duration)
}

export function filterRecipes(catalog: Recipe[], filters: RecipeFilters): Recipe[] {
  return catalog.filter((recipe) => matchesFilters(recipe, filters))
}

/**
 * 分面计数：给定维度里的某一个标签，在"当前查询与其他筛选生效"的前提下
 * 该标签（与同维度已选标签取并集）还能命中多少道菜。用于筛选按钮上的数量角标。
 */
export function countForTag(catalog: Recipe[], filters: RecipeFilters, dimension: TagDimensionKey, tag: string): number {
  const probe: RecipeFilters = {
    ...filters,
    tagSelections: {
      ...filters.tagSelections,
      [dimension]: [...filters.tagSelections[dimension], tag],
    },
  }
  return catalog.filter((recipe) => matchesFilters(recipe, probe)).length
}

/** 难度角标：该难度下、其余筛选（不含难度本身）仍命中的数量 */
export function countForDifficulty(catalog: Recipe[], filters: RecipeFilters, difficulty: DifficultyFilter): number {
  return catalog.filter((recipe) => recipe.difficulty === difficulty && matchesFilters(recipe, { ...filters, difficulty: undefined })).length
}

/** 用时角标：该区间内、其余筛选（不含用时本身）仍命中的数量 */
export function countForDuration(catalog: Recipe[], filters: RecipeFilters, key: DurationBucketKey): number {
  const bucket = DURATION_BUCKETS.find((item) => item.key === key)
  if (!bucket) return 0
  return catalog.filter((recipe) => {
    const duration = recipe.durationMinutes
    if (duration === undefined) return false
    return duration >= bucket.min && duration < bucket.max && matchesFilters(recipe, { ...filters, duration: undefined })
  }).length
}