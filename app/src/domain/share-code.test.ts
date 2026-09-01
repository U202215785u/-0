import { describe, expect, it } from 'vitest'
import { decodeSelection, encodeSelection } from './share-code'

describe('selection share code', () => {
  it('round-trips selected recipe IDs', () => {
    expect(decodeSelection(encodeSelection(['beef-chow-fun']))).toEqual({ recipeIds: ['beef-chow-fun'] })
  })

  it('rejects unrelated pasted text', () => {
    expect(() => decodeSelection('今晚吃啥')).toThrow('无法识别点菜码')
  })
})
