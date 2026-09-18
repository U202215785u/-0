import { describe, expect, it } from 'vitest';
import type { Recipe } from './types';
import {
  ALL_TAGS,
  MAX_TAGS_PER_RECIPE,
  cleanRecipeTags,
  getRecipeTagIssues,
  inferDishTypeTag,
  normalizeRecipeTags,
  resolveRecipeTags,
  sanitizeTags,
  tagDimension,
} from './tags';

const recipe = (overrides: Partial<Recipe>): Recipe => ({
  id: 'r1',
  title: '测试菜',
  ingredients: [{ name: '盐' }],
  steps: [{ text: '煮熟。' }],
  ...overrides,
});

describe('标签体系', () => {
  it('词汇表覆盖四个维度，标签总数有限', () => {
    expect(ALL_TAGS.size).toBeGreaterThanOrEqual(16);
    expect(tagDimension('炒')).toBe('method');
    expect(tagDimension('主食')).toBe('dishType');
    expect(tagDimension('家常菜')).toBe('feature');
    expect(tagDimension('素菜')).toBe('diet');
    expect(tagDimension('不存在的标签')).toBeUndefined();
  });

  it('sanitizeTags 做别名映射、去重并剔除体系外标签', () => {
    expect(sanitizeTags(['烧', '烧', '汤底', '神秘', '快手'])).toEqual(['烧焖', '汤羹', '快手菜']);
    expect(sanitizeTags(undefined)).toEqual([]);
  });

  it('normalizeRecipeTags 按维度上限收口，同一维度保留前者', () => {
    expect(normalizeRecipeTags(['炒', '煮'])).toEqual(['炒']); // method 最多 1 个
    expect(normalizeRecipeTags(['家常菜', '快手菜'])).toEqual(['家常菜', '快手菜']); // feature 最多 2 个
    expect(normalizeRecipeTags(['家常菜', '快手菜', '素菜', '炒', '主食'])).toHaveLength(MAX_TAGS_PER_RECIPE);
  });

  it('getRecipeTagIssues 报告体系外、重复、同维度溢出与超量标签', () => {
    expect(getRecipeTagIssues(recipe({ tags: ['神秘'] })).map((i) => i.code)).toContain('unknown-tag');
    expect(getRecipeTagIssues(recipe({ tags: ['炒', '炒'] })).map((i) => i.code)).toContain('duplicate-tag');
    expect(getRecipeTagIssues(recipe({ tags: ['炒', '煮'] })).map((i) => i.code)).toContain('tag-dimension-overflow');
    const tooMany = ['炒', '主食', '家常菜', '快手菜', '素菜'];
    expect(getRecipeTagIssues(recipe({ tags: tooMany })).map((i) => i.code)).toContain('too-many-tags');
    expect(getRecipeTagIssues(recipe({ tags: ['炒', '家常菜'] }))).toEqual([]);
  });

  it('inferDishTypeTag 从标题推断菜品种类', () => {
    expect(inferDishTypeTag('番茄蛋汤')).toBe('汤羹');
    expect(inferDishTypeTag('扬州炒饭')).toBe('主食');
    expect(inferDishTypeTag('鲜肉月饼')).toBe('点心');
    expect(inferDishTypeTag('红烧肉')).toBeUndefined();
  });

  it('cleanRecipeTags 删除步骤零依据的做法标签，并按标题补齐菜品种类', () => {
    const soup = recipe({ title: '萝卜羊肉汤', tags: ['煮', '烤', '蒸'] });
    expect(cleanRecipeTags(soup)).toEqual(['煮', '汤羹']);
    const fried = recipe({ title: '春卷', tags: ['炸'] });
    // 做法标签仅在步骤有依据时保留；春卷不在标题规则覆盖范围，不额外补菜品种类
    expect(cleanRecipeTags({ ...fried, steps: [{ text: '下油锅炸至金黄' }] })).toEqual(['炸']);
  });

  it('resolveRecipeTags 幂等且结果必然满足标签体系', () => {
    const input = recipe({ title: '红烧肉', tags: ['烧', '炖', '家常菜'], steps: [{ text: '小火炖四十分钟，大火收汁' }] });
    const first = resolveRecipeTags(input);
    const second = resolveRecipeTags({ ...input, tags: first });
    expect(second).toEqual(first);
    expect(getRecipeTagIssues({ ...input, tags: first })).toEqual([]);
  });
});