import { appDb } from './app-db'

describe('appDb', () => {
  afterEach(async () => {
    if (typeof indexedDB === 'undefined') return
    await appDb.close()
    await appDb.delete()
  })

  it('defines the six local-first persistence tables', () => {
    expect(appDb.tables.map((table) => table.name)).toEqual([
      'settings',
      'favorites',
      'wanted',
      'plans',
      'shopping',
      'imports',
    ])
  })

  it.skipIf(typeof indexedDB === 'undefined')('keeps device mode and favorite IDs across a database reopen', async () => {
    await appDb.settings.put({ key: 'mode', value: 'choose' })
    await appDb.favorites.put({ recipeId: 'beef-chow-fun' })

    expect(await appDb.settings.get('mode')).toMatchObject({ value: 'choose' })
    expect(await appDb.favorites.get('beef-chow-fun')).toEqual({ recipeId: 'beef-chow-fun' })

    appDb.close()
    await appDb.open()

    expect(await appDb.settings.get('mode')).toMatchObject({ value: 'choose' })
    expect(await appDb.favorites.get('beef-chow-fun')).toEqual({ recipeId: 'beef-chow-fun' })
  })
})
