import { z } from 'zod';
import type { Recipe } from './types';

const positiveNumber = z.number().positive();

const ingredientSchema = z.object({
  name: z.string().min(1),
  mergeKey: z.string().optional(),
  amount: positiveNumber.optional(),
  unit: z.string().optional(),
  quantityText: z.string().refine((value) => value.trim().length > 0).optional(),
  category: z.string().optional(),
  pantry: z.boolean().optional(),
}).strict().refine(({ amount, quantityText }) => !(amount !== undefined && quantityText !== undefined), {
  message: 'amount and quantityText cannot both be provided',
});

const stepSchema = z.object({
  text: z.string().min(1),
  timerSeconds: positiveNumber.optional(),
  ingredientNames: z.array(z.string()).optional(),
}).strict();

export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
  baseServings: positiveNumber.optional(),
  sourceUrl: z.string().optional(),
  author: z.string().optional(),
  fidelity: z.string().refine((value) => value.trim().length > 0).optional(),
  sourceNote: z.string().refine((value) => value.trim().length > 0).optional(),
  nutrition: z.object({
    kcal: z.number().nonnegative().optional(),
    proteinG: z.number().nonnegative().optional(),
    carbsG: z.number().nonnegative().optional(),
    fatG: z.number().nonnegative().optional(),
    fiberG: z.number().nonnegative().optional(),
    sugarG: z.number().nonnegative().optional(),
    saturatedFatG: z.number().nonnegative().optional(),
    sodiumMg: z.number().nonnegative().optional(),
    basis: z.enum(['per-serving']).optional(),
    source: z.enum(['source', 'estimated']).optional(),
    confidence: z.enum(['high', 'medium', 'low']).optional(),
    quantityCoverage: z.number().min(0).max(1).optional(),
    missingIngredientNames: z.array(z.string()).optional(),
    calculationVersion: z.string().optional(),
    note: z.string().optional(),
  }).strict().optional(),
  tags: z.array(z.string().min(1)).optional(),
  durationMinutes: positiveNumber.optional(),
  difficulty: z.enum(['简单', '中等', '较难']).optional(),
}).strict().superRefine(({ ingredients, steps }, context) => {
  const ingredientNames = new Set(ingredients.map((ingredient) => ingredient.name));
  steps.forEach((step, stepIndex) => {
    step.ingredientNames?.forEach((name, ingredientIndex) => {
      if (!ingredientNames.has(name)) {
        context.addIssue({
          code: 'custom',
          path: ['steps', stepIndex, 'ingredientNames', ingredientIndex],
          message: `ingredient name does not match recipe ingredient: ${name}`,
        });
      }
    });
  });
});

export function parseRecipe(input: unknown): Recipe {
  return recipeSchema.parse(input);
}
