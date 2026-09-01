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
  nutrition?: {
    kcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  };
  tags?: string[];
  durationMinutes?: number;
};
