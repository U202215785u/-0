import { z } from 'zod';
import type { Recipe } from './types';

const positiveNumber = z.number().positive();

const ingredientSchema = z.object({
  name: z.string().min(1),
  mergeKey: z.string().optional(),
  amount: positiveNumber.optional(),
  unit: z.string().optional(),
  quantityText: z.string().optional(),
  category: z.string().optional(),
  pantry: z.boolean().optional(),
});

const stepSchema = z.object({
  text: z.string().min(1),
  timerSeconds: positiveNumber.optional(),
  ingredientNames: z.array(z.string()).optional(),
});

export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
  baseServings: positiveNumber.optional(),
  sourceUrl: z.string().optional(),
  author: z.string().optional(),
  nutrition: z.object({
    kcal: z.number().optional(),
    proteinG: z.number().optional(),
    carbsG: z.number().optional(),
    fatG: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  durationMinutes: z.number().optional(),
});

export function parseRecipe(input: unknown): Recipe {
  return recipeSchema.parse(input);
}
