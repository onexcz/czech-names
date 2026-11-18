export type Gender = 'male' | 'female'
export type Shortlists = Record<Gender, string[]>

export const STORAGE_KEY = 'czech-names:shortlist:v1'

function defaultStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export function loadShortlists(storage: Storage | undefined = defaultStorage()): Shortlists {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
    return { male: strings(parsed?.male), female: strings(parsed?.female) }
  } catch {
    return { male: [], female: [] }
  }
}

export function saveShortlists(lists: Shortlists, storage: Storage | undefined = defaultStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(lists))
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

/** Insert `name` at `index`; an existing copy is moved, never duplicated. */
export function insertAt(list: string[], name: string, index: number): string[] {
  const rest = list.filter(n => n !== name)
  const i = Math.max(0, Math.min(index, rest.length))
  return [...rest.slice(0, i), name, ...rest.slice(i)]
}

export function move(list: string[], from: number, to: number): string[] {
  const result = [...list]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

export function toggle(list: string[], name: string): string[] {
  return list.includes(name) ? list.filter(n => n !== name) : [...list, name]
}

export const MAX_NAME_LENGTH = 40

/** Clean up a typed name: trim, collapse spaces, uppercase. Null if it isn't a plausible name. */
export function normalizeName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ').toLocaleUpperCase('cs')
  if (!name || name.length > MAX_NAME_LENGTH) return null
  return /^\p{L}[\p{L} -]*$/u.test(name) ? name : null
}

/** Append `name` unless it's already there (then the same array is returned). */
export function append(list: string[], name: string): string[] {
  return list.includes(name) ? list : [...list, name]
}
