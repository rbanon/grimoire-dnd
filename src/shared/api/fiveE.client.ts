import type {
  ApiReferenceList,
  ApiClass,
  ApiRace,
  ApiSubrace,
  ApiSubclass,
  ApiBackground,
  Api2024Background,
  ApiSpell,
  ApiEquipment,
  ApiEquipmentCategory,
  ApiMagicItem,
  ApiSkill,
  ApiFeature,
  ApiTrait,
  ApiFeat,
  Api2024Species,
  Api2024Subspecies,
  Api2024Feat,
  ApiClassLevel,
  SpellQueryParams,
} from '../types/api'

const BASE_URL      = import.meta.env.VITE_5E_API_BASE      ?? 'https://www.dnd5eapi.co/api/2014'
const BASE_URL_2024 = import.meta.env.VITE_5E_API_BASE_2024 ?? 'https://www.dnd5eapi.co/api/2024'
const LS_PREFIX = 'dnd5e:1:'

// Serial queue with a gap between requests to stay under the API rate limit.
// Cached (localStorage) requests skip the queue entirely and return instantly.
const REQUEST_GAP_MS = 150
const pending: Array<() => Promise<void>> = []
let draining = false

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (pending.length >= 200) {
      reject(new Error('5e API queue full — too many concurrent requests'))
      return
    }
    pending.push(() => fn().then(resolve, reject))
    if (!draining) drain()
  })
}

function drain(): void {
  const next = pending.shift()
  if (!next) { draining = false; return }
  draining = true
  next().finally(() => setTimeout(drain, REQUEST_GAP_MS))
}

function lsRead<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) as T : null
  } catch {
    return null
  }
}

function lsWrite(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('[5e cache] localStorage write failed (quota exceeded?)', e)
  }
}

const SAFE_INDEX_RE = /^[a-z0-9-]+$/i

export function sanitizeApiIndex(index: string): string {
  if (!SAFE_INDEX_RE.test(index)) throw new Error(`Invalid 5e API index: "${index}"`)
  return index
}

async function get<T>(path: string, params?: Record<string, string>, baseUrl = BASE_URL): Promise<T> {
  const url = new URL(`${baseUrl}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v)
    }
  }
  const cacheKey = LS_PREFIX + url.pathname + url.search
  const cached = lsRead<T>(cacheKey)
  if (cached) return cached

  return enqueue(async () => {
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`5e API error: ${res.status} ${res.statusText} (${path})`)
    const data = await res.json() as T
    lsWrite(cacheKey, data)
    return data
  })
}

// ── Reference lists (cached forever — SRD data never changes) ────────────────

export const fiveEApi = {
  listClasses: () => get<ApiReferenceList>('/classes'),
  getClass: (index: string) => get<ApiClass>(`/classes/${sanitizeApiIndex(index)}`),

  listRaces: () => get<ApiReferenceList>('/races'),
  getRace: (index: string) => get<ApiRace>(`/races/${sanitizeApiIndex(index)}`),
  getSubrace: (index: string) => get<ApiSubrace>(`/subraces/${sanitizeApiIndex(index)}`),
  getSubclass: (index: string) => get<ApiSubclass>(`/subclasses/${sanitizeApiIndex(index)}`),

  listBackgrounds: () => get<ApiReferenceList>('/backgrounds'),
  getBackground: (index: string) => get<ApiBackground>(`/backgrounds/${sanitizeApiIndex(index)}`),
  listBackgrounds2024: () => get<ApiReferenceList>('/backgrounds', undefined, BASE_URL_2024),
  // 2024 backgrounds have a different shape (proficiencies/feat/equipment_options).
  // Normalize into the 2014 ApiBackground shape so every consumer works uniformly.
  getBackground2024: async (index: string): Promise<ApiBackground> => {
    const raw = await get<Api2024Background>(`/backgrounds/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024)
    return {
      index: raw.index,
      name: raw.name,
      url: raw.url,
      starting_proficiencies: raw.proficiencies ?? [],
      starting_equipment: [],
      starting_equipment_options: raw.equipment_options ?? [],
      language_options: undefined,
      feature: undefined,
      feat: raw.feat,
      ability_scores: raw.ability_scores,
    }
  },

  // Spells: when filtering by class, the API requires the class-scoped endpoint
  // (/classes/{index}/spells) — the ?class= query param on /spells is silently ignored.
  listSpells: (params?: SpellQueryParams) => {
    const queryParams: Record<string, string> = {}
    if (params?.name)            queryParams.name   = params.name
    if (params?.level !== undefined) queryParams.level = String(params.level)
    if (params?.school)          queryParams.school = params.school
    const path = params?.class
      ? `/classes/${sanitizeApiIndex(params.class)}/spells`
      : '/spells'
    return get<ApiReferenceList>(path, queryParams)
  },
  getSpell: (index: string) => get<ApiSpell>(`/spells/${sanitizeApiIndex(index)}`),

  listSkills: () => get<ApiReferenceList>('/skills'),
  getSkill: (index: string) => get<ApiSkill>(`/skills/${sanitizeApiIndex(index)}`),
  listProficiencies: () => get<ApiReferenceList>('/proficiencies'),
  listLanguages: () => get<ApiReferenceList>('/languages'),
  listAlignments: () => get<ApiReferenceList>('/alignments'),
  // Feats — both editions exposed separately for combined picker
  listFeats2014: () => get<ApiReferenceList>('/feats'),
  getFeat2014:   (index: string) => get<ApiFeat>(`/feats/${sanitizeApiIndex(index)}`),
  listFeats2024: () => get<ApiReferenceList>('/feats', undefined, BASE_URL_2024),
  getFeat2024:   (index: string) => get<Api2024Feat>(`/feats/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024),
  /** @deprecated use listFeats2024 or listFeats2014 */
  listFeats: () => get<ApiReferenceList>('/feats', undefined, BASE_URL_2024),
  /** @deprecated use getFeat2024 or getFeat2014 */
  getFeat: (index: string) => get<ApiFeat>(`/feats/${sanitizeApiIndex(index)}`),

  // 2024 species (replaces races), subspecies (replaces subraces)
  listSpecies:    () => get<ApiReferenceList>('/species', undefined, BASE_URL_2024),
  getSpecies:     (index: string) => get<Api2024Species>(`/species/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024),
  listSubspecies: () => get<ApiReferenceList>('/subspecies', undefined, BASE_URL_2024),
  getSubspecies:  (index: string) => get<Api2024Subspecies>(`/subspecies/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024),

  // 2024 classes and subclasses
  listClasses2024:  () => get<ApiReferenceList>('/classes', undefined, BASE_URL_2024),
  getClass2024:     (index: string) => get<ApiClass>(`/classes/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024),
  getSubclass2024:  (index: string) => get<ApiSubclass>(`/subclasses/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024),
  listTraits: () => get<ApiReferenceList>('/traits'),

  listMagicSchools: () => get<ApiReferenceList>('/magic-schools'),
  listDamageTypes: () => get<ApiReferenceList>('/damage-types'),
  listConditions: () => get<ApiReferenceList>('/conditions'),

  // Equipment — no server-side filtering; fetch all, index client-side
  listEquipment: () => get<ApiReferenceList>('/equipment'),
  getEquipment: (index: string) => get<ApiEquipment>(`/equipment/${sanitizeApiIndex(index)}`),
  listEquipmentCategories: () => get<ApiReferenceList>('/equipment-categories'),
  getEquipmentCategory: (index: string) => get<ApiEquipmentCategory>(`/equipment-categories/${sanitizeApiIndex(index)}`),

  // Magic items — no server-side filtering
  listMagicItems: () => get<ApiReferenceList>('/magic-items'),
  getMagicItem: (index: string) => get<ApiMagicItem>(`/magic-items/${sanitizeApiIndex(index)}`),

  // Class features
  getClassLevels: (classIndex: string) =>
    get<ApiClassLevel[]>(`/classes/${sanitizeApiIndex(classIndex)}/levels`),
  getFeature: (index: string) => get<ApiFeature>(`/features/${sanitizeApiIndex(index)}`),

  // Race/subrace traits (2014 and 2024 — trait indices differ between editions)
  getTrait: (index: string) => get<ApiTrait>(`/traits/${sanitizeApiIndex(index)}`),
  getTrait2024: (index: string) => get<ApiTrait>(`/traits/${sanitizeApiIndex(index)}`, undefined, BASE_URL_2024),
}
