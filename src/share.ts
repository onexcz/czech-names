import { normalizeName, type Shortlists } from './shortlist'

export const SHARE_PREFIX = '#sdilet'
export const MAX_SHARED_PER_LIST = 200

const PARAMS = { male: 'chlapci', female: 'divky' } as const

/** `#sdilet?chlapci=A,B&divky=C`; lives in the fragment so it never reaches the server. */
export function buildShareHash(lists: Shortlists): string {
  // Encode each name but keep the commas readable: `divky=ELI%C5%A0KA,ANNA%20MARIE`.
  const query = (['male', 'female'] as const)
    .filter(gender => lists[gender].length > 0)
    .map(gender => `${PARAMS[gender]}=${lists[gender].map(encodeURIComponent).join(',')}`)
    .join('&')
  return query ? `${SHARE_PREFIX}?${query}` : SHARE_PREFIX
}

/** Null when the hash isn't a share link; otherwise the cleaned-up lists (possibly empty). */
export function parseShareHash(hash: string): Shortlists | null {
  if (hash !== SHARE_PREFIX && !hash.startsWith(`${SHARE_PREFIX}?`)) return null
  const params = new URLSearchParams(hash.slice(SHARE_PREFIX.length + 1))
  const read = (key: string): string[] => {
    const names = (params.get(key) ?? '')
      .split(',')
      .map(normalizeName)
      .filter((n): n is string => n !== null)
    return [...new Set(names)].slice(0, MAX_SHARED_PER_LIST)
  }
  return { male: read(PARAMS.male), female: read(PARAMS.female) }
}
