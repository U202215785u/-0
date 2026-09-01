import Dexie, { type Table } from 'dexie'

export type MealSlot = {
  id: string
  date: string
  meal: 'lunch' | 'dinner' | 'breakfast' | 'snack'
  recipeId: string
  servings: number
}

export type ShoppingState = {
  id: string
  checked: boolean
  manualLabel?: string
}

export class AppDb extends Dexie {
  settings!: Table<{ key: 'mode'; value: 'cook' | 'choose' }, string>
  favorites!: Table<{ recipeId: string }, string>
  wanted!: Table<{ recipeId: string }, string>
  plans!: Table<MealSlot, string>
  shopping!: Table<ShoppingState, string>
  imports!: Table<{ id: string; recipeIds: string[] }, string>

  constructor() {
    super('family-recipe')
    this.version(1).stores({
      settings: 'key',
      favorites: 'recipeId',
      wanted: 'recipeId',
      plans: 'id, date, meal',
      shopping: 'id',
      imports: 'id',
    })
  }
}

export const appDb = new AppDb()
