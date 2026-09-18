import { describe, expect, it } from 'vitest'
import type { Recipe } from '../catalog/types'
import { editDistance, isSubsequence, normalizeQuery, scoreQuery } from './fuzzy'

const recipe = (overrides: Partial<Recipe> & Pick<Recipe, 'title' | 'id'>): Recipe => ({
  ingredients: [{ name: '食材' }],
  steps: [{ text: '做法步骤' }],
  ...overrides,
})

const fuzhuShaorou = recipe({
  id: 'fzsr',
  title: '腐竹烧肉',
  ingredients: [
    { name: '五花肉', mergeKey: 'pork-belly' },
    { name: '腐竹', mergeKey: 'yuba' },
    { name: '冰糖' },
  ],
  steps: [{ text: '五花肉焯水后与腐竹一同红烧，收汁即可' }],
  tags: ['烧焖', '家常菜'],
})

const qingjiaoJitui = recipe({
  id: 'qjjtr',
  title: '青椒鸡腿肉',
  ingredients: [{ name: '鸡腿肉' }, { name: '青椒' }],
  steps: [{ text: '鸡腿肉切丁与青椒同炒' }],
  tags: ['炒', '家常菜', '快手菜'],
})

describe('fuzzy search primitives', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeQuery('  FUZHU ')).toBe('fuzhu')
    expect(normalizeQuery('腐竹 烧肉')).toBe('腐竹烧肉')
  })

  it('detects subsequences (tolerates missing characters)', () => {
    expect(isSubsequence('腐竹肉', '腐竹烧肉')).toBe(true)
    expect(isSubsequence('腐竹烧肉', '腐竹肉')).toBe(false)
    expect(isSubsequence('fzsr', 'fzsr')).toBe(true)
    expect(isSubsequence('abc', 'axbyc')).toBe(true)
  })

  it('computes edit distance with early bailout', () => {
    expect(editDistance('青桥鸡腿', '青椒鸡腿', 2)).toBe(1)
    expect(editDistance('abc', 'abd', 1)).toBe(1)
    expect(editDistance('abcd', 'abcef', 3)).toBe(2)
    expect(editDistance('abcd', 'abcef', 1)).toBeGreaterThan(1) // 超过上限即提前返回
  })
})

describe('scoreQuery', () => {
  it('matches plain substrings', () => {
    expect(scoreQuery(fuzhuShaorou, '腐竹烧肉')).toBeGreaterThan(0)
    expect(scoreQuery(fuzhuShaorou, '腐竹')).toBeGreaterThan(0)
    expect(scoreQuery(fuzhuShaorou, '五花肉')).toBeGreaterThan(0)
  })

  it('matches by subsequence when characters are missing', () => {
    expect(scoreQuery(fuzhuShaorou, '腐竹肉')).toBeGreaterThan(0)
  })

  it('tolerates a wrong character (typo)', () => {
    expect(scoreQuery(qingjiaoJitui, '青桥鸡腿')).toBeGreaterThan(0)
    expect(scoreQuery(qingjiaoJitui, '青椒鸡退')).toBeGreaterThan(0)
  })

  it('matches pinyin syllables', () => {
    expect(scoreQuery(fuzhuShaorou, 'fuzhushaorou')).toBeGreaterThan(0)
    expect(scoreQuery(qingjiaoJitui, 'qingjiaojituirou')).toBeGreaterThan(0)
  })

  it('matches pinyin initials', () => {
    expect(scoreQuery(fuzhuShaorou, 'fzsr')).toBeGreaterThan(0)
    expect(scoreQuery(qingjiaoJitui, 'qjjt')).toBeGreaterThan(0)
  })

  it('matches pinyin of ingredient names', () => {
    expect(scoreQuery(fuzhuShaorou, 'fuzhu')).toBeGreaterThan(0) // 食材 腐竹
  })

  it('searches steps and tags too', () => {
    expect(scoreQuery(fuzhuShaorou, '收汁')).toBeGreaterThan(0) // 步骤
    expect(scoreQuery(fuzhuShaorou, '烧焖')).toBeGreaterThan(0) // 标签
  })

  it('returns 0 for unrelated queries', () => {
    expect(scoreQuery(fuzhuShaorou, '哈')).toBe(0) // 单字不做模糊
    expect(scoreQuery(fuzhuShaorou, 'xyzabc')).toBe(0)
    expect(scoreQuery(fuzhuShaorou, '意大利面')).toBe(0)
  })

  it('ranks exact title matches above partial matches', () => {
    const broader = recipe({ id: 'b', title: '腐竹烧肉饭' })
    const ingredientOnly = recipe({ id: 'c', title: '凉拌毛豆', ingredients: [{ name: '腐竹' }] })
    const exact = scoreQuery(fuzhuShaorou, '腐竹烧肉')
    const partial = scoreQuery(broader, '腐竹烧肉')
    const weak = scoreQuery(ingredientOnly, '腐竹烧肉')
    expect(exact).toBeGreaterThan(partial)
    expect(partial).toBeGreaterThan(weak)
  })
})