import type {
  ApiReferenceList,
  ApiClass,
  ApiRace,
  ApiSubrace,
  ApiBackground,
  ApiSpell,
  ApiEquipment,
  ApiMagicItem,
  ApiSkill,
  SpellQueryParams,
} from '../types/api'

const BASE_URL = import.meta.env.VITE_5E_API_BASE ?? 'https://www.dnd5eapi.co/api/2014'

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`5e API error: ${res.status} ${res.statusText} (${path})`)
  return res.json() as Promise<T>
}

// ── Reference lists (cached forever — SRD data never changes) ────────────────

export const fiveEApi = {
  listClasses: () => get<ApiReferenceList>('/classes'),
  getClass: (index: string) => get<ApiClass>(`/classes/${index}`),

  listRaces: () => get<ApiReferenceList>('/races'),
  getRace: (index: string) => get<ApiRace>(`/races/${index}`),
  getSubrace: (index: string) => get<ApiSubrace>(`/subraces/${index}`),

  listBackgrounds: () => get<ApiReferenceList>('/backgrounds'),
  getBackground: (index: string) => get<ApiBackground>(`/backgrounds/${index}`),

  // Spells support server-side filtering
  listSpells: (params?: SpellQueryParams) =>
    get<ApiReferenceList>('/spells', {
      ...(params?.name ? { name: params.name } : {}),
      ...(params?.level !== undefined ? { level: String(params.level) } : {}),
      ...(params?.school ? { school: params.school } : {}),
      ...(params?.class ? { class: params.class } : {}),
    }),
  getSpell: (index: string) => get<ApiSpell>(`/spells/${index}`),

  listSkills: () => get<ApiReferenceList>('/skills'),
  getSkill: (index: string) => get<ApiSkill>(`/skills/${index}`),
  listProficiencies: () => get<ApiReferenceList>('/proficiencies'),
  listLanguages: () => get<ApiReferenceList>('/languages'),
  listAlignments: () => get<ApiReferenceList>('/alignments'),
  listFeats: () => get<ApiReferenceList>('/feats'),
  listTraits: () => get<ApiReferenceList>('/traits'),

  listMagicSchools: () => get<ApiReferenceList>('/magic-schools'),
  listDamageTypes: () => get<ApiReferenceList>('/damage-types'),
  listConditions: () => get<ApiReferenceList>('/conditions'),

  // Equipment — no server-side filtering; fetch all, index client-side
  listEquipment: () => get<ApiReferenceList>('/equipment'),
  getEquipment: (index: string) => get<ApiEquipment>(`/equipment/${index}`),
  listEquipmentCategories: () => get<ApiReferenceList>('/equipment-categories'),

  // Magic items — no server-side filtering
  listMagicItems: () => get<ApiReferenceList>('/magic-items'),
  getMagicItem: (index: string) => get<ApiMagicItem>(`/magic-items/${index}`),
}
