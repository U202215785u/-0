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
      fidelity: 'structured-transcription',
      sourceNote: 'Read the source page for its full visual guidance and context.',
    });
    expect(recipe.author).toBe('厨师');
    expect(recipe.nutrition?.kcal).toBe(100);
    expect(recipe.ingredients[0].quantityText).toBeUndefined();
    expect(recipe.fidelity).toBe('structured-transcription');
    expect(recipe.sourceNote).toBe('Read the source page for its full visual guidance and context.');
  });

  it('rejects empty fidelity and source note values', () => {
    const recipe = { id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }] };
    expect(() => parseRecipe({ ...recipe, fidelity: '' })).toThrow();
    expect(() => parseRecipe({ ...recipe, sourceNote: '   ' })).toThrow();
  });

  it('accepts an ingredient with a positive amount or a non-empty quantityText', () => {
    const recipe = parseRecipe({
      id: 'soup',
      title: '汤',
      ingredients: [
        { name: '水', amount: 500, unit: 'ml' },
        { name: '葱', quantityText: '少许' },
        { name: '盐' },
      ],
      steps: [{ text: '煮。' }],
    });

    expect(recipe.ingredients[1].quantityText).toBe('少许');
  });

  it('rejects ambiguous or empty ingredient quantities', () => {
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐', amount: 1, quantityText: '少许' }], steps: [{ text: '做' }],
    })).toThrow();
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐', quantityText: '' }], steps: [{ text: '做' }],
    })).toThrow();
  });

  it('rejects step ingredient names that are not recipe ingredients', () => {
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做', ingredientNames: ['胡椒'] }],
    })).toThrow();
  });

  it('rejects unknown curator fields at every schema level', () => {
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐', unknownIngredient: true }], steps: [{ text: '做' }],
    })).toThrow();
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做', unknownStep: true }],
    })).toThrow();
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }], nutrition: { unknownNutrition: 1 },
    })).toThrow();
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }], unknownRecipe: true,
    })).toThrow();
  });

  it('rejects negative nutrition and non-positive duration values', () => {
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }], nutrition: { kcal: -1 },
    })).toThrow();
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }], durationMinutes: -1,
    })).toThrow();
    expect(() => parseRecipe({
      id: 'bad', title: '菜', ingredients: [{ name: '盐' }], steps: [{ text: '做' }], durationMinutes: 0,
    })).toThrow();
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
