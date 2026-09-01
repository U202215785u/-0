import { describe, expect, it } from 'vitest';
import { parseRecipe } from './schema';

describe('parseRecipe', () => {
  it('accepts a minimal recipe without author, source, nutrition, or servings', () => {
    expect(parseRecipe({ id: 'tea-egg', title: '茶叶蛋', ingredients: [{ name: '鸡蛋' }], steps: [{ text: '煮熟。' }] }).title).toBe('茶叶蛋');
  });

  it('rejects a record without ingredients', () => {
    expect(() => parseRecipe({ id: 'bad', title: '空菜', steps: [{ text: '无' }] })).toThrow();
  });

  it('rejects empty ingredients and steps', () => {
    expect(() => parseRecipe({ id: 'bad', title: '空菜', ingredients: [], steps: [{ text: '无' }] })).toThrow();
    expect(() => parseRecipe({ id: 'bad', title: '空菜', ingredients: [{ name: '盐' }], steps: [] })).toThrow();
  });

  it('preserves optional curated fields', () => {
    const recipe = parseRecipe({
      id: 'noodles', title: '面', ingredients: [{ name: '面', amount: 2, unit: '碗', mergeKey: 'noodles', pantry: true }],
      steps: [{ text: '煮面', timerSeconds: 60, ingredientNames: ['面'] }], baseServings: 2,
      sourceUrl: 'https://example.com', author: '厨师', nutrition: { kcal: 100, proteinG: 3, carbsG: 20, fatG: 1 },
      tags: ['快手'], durationMinutes: 5, 
    });
    expect(recipe.author).toBe('厨师');
    expect(recipe.nutrition?.kcal).toBe(100);
    expect(recipe.ingredients[0].quantityText).toBeUndefined();
  });

  it.each([
    ['ingredient amount', { ingredients: [{ name: '盐', amount: 0 }] }],
    ['base servings', { baseServings: -1 }],
    ['step timer', { steps: [{ text: '做', timerSeconds: 0 }] }],
  ])('rejects non-positive %s', (_, invalid) => {
    const input = { id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }], ...invalid };
    expect(() => parseRecipe(input)).toThrow();
  });
});
