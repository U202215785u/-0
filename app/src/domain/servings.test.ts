import type { Recipe } from '../catalog/types'
import { scaleIngredients } from './servings'

const recipeForTwo: Recipe = {
  id: 'fish',
  title: '鱼',
  baseServings: 2,
  ingredients: [
    { name: '鱼', amount: 1, unit: '条' },
    { name: '盐', quantityText: '适量' },
  ],
  steps: [],
}

const recipeWithoutBase: Recipe = {
  ...recipeForTwo,
  baseServings: undefined,
}

describe('scaleIngredients', () => {
  it('scales numeric quantities and preserves textual quantities', () => {
    expect(scaleIngredients(recipeForTwo, 4)).toMatchObject([
      { name: '鱼', amount: 2 },
      { name: '盐', quantityText: '适量' },
    ])
  })

  it('does not scale a recipe without base servings', () => {
    expect(scaleIngredients(recipeWithoutBase, 4)).toEqual(recipeWithoutBase.ingredients)
  })
})
