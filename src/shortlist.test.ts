import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, append, insertAt, loadShortlists, move, normalizeName, saveShortlists, toggle } from './shortlist'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = { ...initial }
  return {
    get length() { return Object.keys(data).length },
    clear: () => { for (const k of Object.keys(data)) delete data[k] },
    getItem: (k: string) => (k in data ? data[k] : null),
    key: (i: number) => Object.keys(data)[i] ?? null,
    removeItem: (k: string) => { delete data[k] },
    setItem: (k: string, v: string) => { data[k] = v },
  }
}

const throwing = {
  getItem: () => { throw new Error('denied') },
  setItem: () => { throw new Error('quota') },
} as unknown as Storage

describe('loadShortlists', () => {
  it('reads valid data', () => {
    const s = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ male: ['JAN'], female: ['EVA'] }) })
    expect(loadShortlists(s)).toEqual({ male: ['JAN'], female: ['EVA'] })
  })
  it('returns empty lists for missing data', () => {
    expect(loadShortlists(memoryStorage())).toEqual({ male: [], female: [] })
  })
  it('returns empty lists for malformed JSON', () => {
    expect(loadShortlists(memoryStorage({ [STORAGE_KEY]: '{oops' }))).toEqual({ male: [], female: [] })
  })
  it('ignores wrong shapes and non-string entries', () => {
    const s = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ male: 'x', female: ['EVA', 3, null] }) })
    expect(loadShortlists(s)).toEqual({ male: [], female: ['EVA'] })
  })
  it('survives missing or throwing storage', () => {
    expect(loadShortlists(undefined)).toEqual({ male: [], female: [] })
    expect(loadShortlists(throwing)).toEqual({ male: [], female: [] })
  })
})

describe('saveShortlists', () => {
  it('round-trips', () => {
    const s = memoryStorage()
    saveShortlists({ male: ['JAN', 'VÍT'], female: [] }, s)
    expect(loadShortlists(s)).toEqual({ male: ['JAN', 'VÍT'], female: [] })
  })
  it('does not throw when storage fails', () => {
    expect(() => saveShortlists({ male: [], female: [] }, throwing)).not.toThrow()
  })
})

describe('list operations', () => {
  it('insertAt inserts at index', () => {
    expect(insertAt(['A', 'B', 'C'], 'D', 1)).toEqual(['A', 'D', 'B', 'C'])
  })
  it('insertAt moves an existing name instead of duplicating', () => {
    expect(insertAt(['A', 'B', 'C'], 'C', 0)).toEqual(['C', 'A', 'B'])
  })
  it('insertAt clamps the index', () => {
    expect(insertAt([], 'A', 99)).toEqual(['A'])
    expect(insertAt(['A'], 'B', -5)).toEqual(['B', 'A'])
  })
  it('move reorders', () => {
    expect(move(['A', 'B', 'C'], 0, 2)).toEqual(['B', 'C', 'A'])
  })
  it('toggle removes or appends', () => {
    expect(toggle(['A'], 'A')).toEqual([])
    expect(toggle(['A'], 'B')).toEqual(['A', 'B'])
  })
  it('does not mutate input', () => {
    const list = ['A', 'B']
    insertAt(list, 'C', 0); move(list, 0, 1); toggle(list, 'A')
    expect(list).toEqual(['A', 'B'])
  })
})

describe('normalizeName', () => {
  it('uppercases, trims and collapses spaces', () => {
    expect(normalizeName('  kornélie ')).toBe('KORNÉLIE')
    expect(normalizeName('anna   marie')).toBe('ANNA MARIE')
    expect(normalizeName('jean-luc')).toBe('JEAN-LUC')
  })
  it('handles Czech letters', () => {
    expect(normalizeName('řehoř')).toBe('ŘEHOŘ')
    expect(normalizeName('žofie')).toBe('ŽOFIE')
  })
  it('rejects empty, non-letters and too long input', () => {
    expect(normalizeName('')).toBeNull()
    expect(normalizeName('   ')).toBeNull()
    expect(normalizeName('anna2')).toBeNull()
    expect(normalizeName('<b>')).toBeNull()
    expect(normalizeName('-anna')).toBeNull()
    expect(normalizeName('a'.repeat(41))).toBeNull()
    expect(normalizeName('a'.repeat(40))).toBe('A'.repeat(40))
  })
})

describe('append', () => {
  it('adds to the end', () => {
    expect(append(['A'], 'B')).toEqual(['A', 'B'])
  })
  it('keeps the list unchanged for a duplicate', () => {
    const list = ['A', 'B']
    expect(append(list, 'A')).toBe(list)
  })
})
