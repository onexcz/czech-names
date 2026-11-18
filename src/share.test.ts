import { describe, expect, it } from 'vitest'
import { MAX_SHARED_PER_LIST, buildShareHash, parseShareHash } from './share'

describe('buildShareHash', () => {
  it('encodes both lists in order', () => {
    const hash = buildShareHash({ male: ['JAKUB', 'VÍT'], female: ['ELIŠKA', 'ANNA MARIE'] })
    expect(hash.startsWith('#sdilet?')).toBe(true)
    expect(parseShareHash(hash)).toEqual({ male: ['JAKUB', 'VÍT'], female: ['ELIŠKA', 'ANNA MARIE'] })
  })
  it('keeps commas readable', () => {
    expect(buildShareHash({ male: [], female: ['ANNA MARIE', 'EVA'] })).toBe('#sdilet?divky=ANNA%20MARIE,EVA')
  })
  it('omits empty lists', () => {
    const hash = buildShareHash({ male: [], female: ['EVA'] })
    expect(hash).not.toContain('chlapci')
    expect(parseShareHash(hash)).toEqual({ male: [], female: ['EVA'] })
  })
})

describe('parseShareHash', () => {
  it('returns null when the hash is not a share link', () => {
    expect(parseShareHash('')).toBeNull()
    expect(parseShareHash('#')).toBeNull()
    expect(parseShareHash('#neco')).toBeNull()
  })
  it('accepts a hand-written, unencoded link', () => {
    expect(parseShareHash('#sdilet?chlapci=jakub,vít&divky=eliška')).toEqual({ male: ['JAKUB', 'VÍT'], female: ['ELIŠKA'] })
  })
  it('drops invalid names and duplicates', () => {
    expect(parseShareHash('#sdilet?divky=ANNA,,<b>,anna,EVA2,EVA')).toEqual({ male: [], female: ['ANNA', 'EVA'] })
  })
  it('gives empty lists for an empty or broken share link', () => {
    expect(parseShareHash('#sdilet')).toEqual({ male: [], female: [] })
    expect(parseShareHash('#sdilet?divky=%E0%A4%A')).toEqual({ male: [], female: [] })
  })
  it('caps very long lists', () => {
    const many = Array.from({ length: MAX_SHARED_PER_LIST + 50 }, (_, i) => 'A' + 'B'.repeat(i % 30) + String.fromCharCode(65 + (i % 26)) + 'X'.repeat(Math.floor(i / 26)))
    expect(parseShareHash('#sdilet?divky=' + many.join(','))!.female).toHaveLength(MAX_SHARED_PER_LIST)
  })
})
