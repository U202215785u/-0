import { describe, expect, it } from 'vitest'
import { decodeSelection, encodeSelection } from './share-code'

describe('selection share code', () => {
  it('round-trips selected recipe IDs', () => {
    expect(decodeSelection(encodeSelection(['beef-chow-fun']))).toEqual({ recipeIds: ['beef-chow-fun'] })
  })

  it('rejects unrelated pasted text', () => {
    expect(() => decodeSelection('今晚吃啥')).toThrow('无法识别点菜码')
  })

  it('tolerates whitespace between the prefix and the payload', () => {
    expect(decodeSelection('家宴点菜:  {"recipeIds":["beef-chow-fun"]}')).toEqual({ recipeIds: ['beef-chow-fun'] })
  })

  it('rejects payloads that are not a single recipeIds list', () => {
    expect(() => decodeSelection('家宴点菜: {"recipeIds":["a"],"extra":1}')).toThrow('无法识别点菜码')
    expect(() => decodeSelection('家宴点菜: {"recipeIds":"a"}')).toThrow('无法识别点菜码')
    expect(decodeSelection('家宴点菜: {"recipeIds":[]}')).toEqual({ recipeIds: [] })
  })
})
