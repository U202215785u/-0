export type Ingredient = {
  name: string;
  mergeKey?: string;
  amount?: number;
  unit?: string;
  quantityText?: string;
  category?: string;
  pantry?: boolean;
};

export type Step = {
  text: string;
  timerSeconds?: number;
  ingredientNames?: string[];
};

export type RecipeNutrition = {
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  sugarG?: number;
  saturatedFatG?: number;
  sodiumMg?: number;
  basis?: 'per-serving';
  source?: 'source' | 'estimated';
  confidence?: 'high' | 'medium' | 'low';
  quantityCoverage?: number;
  missingIngredientNames?: string[];
  calculationVersion?: string;
  note?: string;
};

export type Recipe = {
  id: string;
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  baseServings?: number;
  sourceUrl?: string;
  author?: string;
  fidelity?: string;
  sourceNote?: string;
  nutrition?: RecipeNutrition;
  tags?: string[];
  durationMinutes?: number;
  difficulty?: '简单' | '中等' | '较难';
};
