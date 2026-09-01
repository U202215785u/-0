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
  nutrition: z.object({
    kcal: z.number().nonnegative().optional(),
    proteinG: z.number().nonnegative().optional(),
    carbsG: z.number().nonnegative().optional(),
    fatG: z.number().nonnegative().optional(),
  }).strict().optional(),
  tags: z.array(z.string()).optional(),
  durationMinutes: positiveNumber.optional(),
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
