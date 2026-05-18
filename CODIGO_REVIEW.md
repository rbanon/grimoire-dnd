# Revisión de Código — The Grimoire (DnD Character Creator)
> Análisis interno. No subir a git.
> Fecha: 2026-05-18 · Rama: `exp/spells-by-level`
> Última actualización: 2026-05-19

## Estado de fixes
| Ref | Descripción | Estado |
|-----|-------------|--------|
| 1.1 | savingThrowProficiencies siempre false | ✅ commit 707bd92 |
| 1.2 | HP = 0 con rolls incompletos | ✅ commit 707bd92 |
| 1.3 | Race condition auth guard | ✅ commit 707bd92 |
| 3.1 | 50 requests paralelas en StepFeats | ✅ commit 707bd92 |
| 3.2 | watch sin debounce | ✅ |
| 4.5 | Env vars Supabase sin validar | ✅ |
| 5.2 | Sin error boundary global | ✅ |
| 1.4 | manual ability scores sin validación | ✅ |
| 1.9 | DraftSchema excesivamente laxa | ✅ |

---

---

## Índice
1. [Puntos a mejorar (bugs y omisiones)](#1-puntos-a-mejorar)
2. [Refactorizaciones recomendadas](#2-refactorizaciones)
3. [Cuellos de botella de rendimiento](#3-cuellos-de-botella)
4. [Estado de seguridad](#4-seguridad)
5. [Escalabilidad y mantenibilidad](#5-escalabilidad-y-mantenibilidad)

---

## 1. Puntos a mejorar

### 1.1 Bug: `savingThrowProficiencies` siempre `false`
**Archivo:** `builderStore.ts:563`
```ts
savingThrowProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
```
Las proficiencias en tiradas de salvación están hardcodeadas a `false` para todos los personajes,
independientemente de la clase elegida. Esto es un error de lógica de juego: cada clase SRD tiene dos
tiradas de salvación definidas. El carácter se guarda con datos incorrectos y el character sheet
mostrará +0 en todas las salvaciones para siempre.

**Corrección:** en `save()`, leer `getClassMeta(d.classIndex).saves` o bien añadir un campo
`savingThrows: string[]` al `ClassMeta` y popularlo al crear el personaje.

---

### 1.2 Bug: HP = 0 cuando `hpMethod === 'roll'` con rolls insuficientes
**Archivo:** `builderStore.ts:208-209`
```ts
if (rolls.length < lv) return 0
```
Si el usuario llega al paso de revisión con método "roll" pero no ha tirado todos los dados, el
personaje se guarda con `maxHp: 0` y `currentHp: 0`. No hay ningún error de validación para este
caso en `stepErrors`.

**Corrección:** añadir en `stepErrors[9]` (o el paso de nivel correspondiente):
```ts
builder.draft.hpMethod === 'roll' && builder.draft.rolledHpPerLevel.length < builder.draft.level
  ? `Roll HP for all ${builder.draft.level} levels` : ''
```

---

### 1.3 Bug: Race condition en el auth guard durante la carga inicial
**Archivo:** `router/index.ts:87-93`
```ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {       // ← user.value = null mientras loading = true
      return { name: 'login', ... }
    }
  }
})
```
`auth.init()` en `main.ts` es async. Si el usuario navega directamente a una URL protegida
(p.ej. `/campaigns`) antes de que `getSession()` resuelva, `isAuthenticated` es `false` aunque
el usuario tenga sesión activa. Redirige innecesariamente al login.

**Corrección:**
```ts
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (auth.loading) await until(() => !auth.loading)   // @vueuse/core
    if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```
O bien bloquear el montaje de la app hasta que `auth.init()` termine (añadir `await authStore.init()`
en `main.ts` antes de `app.mount`).

---

### 1.4 Omisión: `abilityMethod === 'manual'` no tiene validación
**Archivo:** `builderStore.ts:247-380` (bloque `stepErrors`)

Los métodos `pointbuy`, `standard` y `roll` tienen sus propias validaciones en `stepErrors[5]`.
El método `manual` no tiene ninguna. Un usuario puede dejar todos los scores en 8 (o incluso
entrar valores inválidos si el campo de input no los restringe) y el builder no lo advierte.

---

### 1.5 Inconsistencia de idioma
**Archivo:** `StepClass.vue:29`
```html
<p>Selecciona una clase para continuar.</p>
```
Todos los mensajes de validación están en inglés excepto éste. La UI es monolingüe inglés
con un solo string en español.

---

### 1.6 `_skipSave` — patrón frágil para evitar el watcher
**Archivo:** `builderStore.ts:167, 400-406`
```ts
let _skipSave = false

async function clearDraft() {
  _skipSave = true
  storageRemove(DRAFT_KEY)
  draft.value = defaultDraft()
  await nextTick()
  _skipSave = false
}
```
Un flag mutable a nivel de módulo que se activa/desactiva alrededor de un `await` es
inherentemente frágil. Si `clearDraft()` se llama dos veces en paralelo (improbable pero
posible), el segundo `_skipSave = false` puede reactivar el guardado prematuramente.

**Alternativa más limpia:** parar el watcher temporalmente con `watchStopHandle()` y
reiniciarlo después, o simplemente no hacer `watch(draft, saveDraft, { deep: true })` de forma
permanente y llamar `saveDraft()` explícitamente en las mutaciones relevantes.

---

### 1.7 `non-null assertions` sobre `auth.userId`
**Archivo:** `characters/store.ts:107, 131, 170`
```ts
.eq('user_id', auth.userId!)
user_id: auth.userId!,
.eq('user_id', auth.userId!)
```
Estos `!` asumen que `userId` es non-null porque las rutas que llaman estas funciones son
"solo para autenticados". Pero si se llaman desde un path inesperado, el `null!` produce un
runtime error difícil de trazar. Mejor: `if (!auth.userId) throw new Error('Not authenticated')`.

---

### 1.8 Pérdida de datos en cloud sin rollback
**Archivo:** `characters/store.ts:155-165`
```ts
async function update(id: string, updates: Partial<Character>): Promise<void> {
  // ...
  characters.value[idx] = updated   // ← estado local ya mutado
  if (auth.isAuthenticated) {
    await persistCloud(updated)      // ← si falla, local y cloud están desincronizados
  }
}
```
El estado local se muta antes de confirmar la operación cloud. Si `persistCloud` falla
(error de red, Supabase caído), el usuario ve los datos actualizados pero no están guardados.
No hay notificación de error en pantalla ni rollback.

---

### 1.9 `DraftSchema` validación excesivamente laxa
**Archivo:** `builderStore.ts:161`
```ts
const DraftSchema = z.object({ currentStep: z.number() }).passthrough()
```
El único campo validado al cargar el draft es `currentStep`. Todo lo demás pasa sin
validación (`passthrough()`). Si un campo crítico del draft en localStorage está corrupto
(p.ej. `baseScores: null`), el `defaultDraft()` spread puede no sobreescribir correctamente
y el store arrancará con estado inválido, produciendo errores en runtime.

---

### 1.10 `computeModifier` definida en dos sitios
**Archivos:** `character.ts:46` (exportada) y usada en `builderStore.ts:198` (importada)
pero `StepLevel.vue:264` la importa desde `character.ts` y `StepSpells.vue:353` también.
Esto está bien. Sin embargo, `derivedStats.ts` no re-exporta `computeModifier` y tiene sus
propias variantes. La separación entre `character.ts` y `derivedStats.ts` para funciones
de cálculo no es clara — algunas cálculo-funciones viven en los tipos, otras en el lib.

---

## 2. Refactorizaciones

### 2.1 `stepErrors` en builderStore — dividir en funciones por paso
**Archivo:** `builderStore.ts:247-380`

Actualmente es un `computed` monolítico de ~130 líneas con IIFEs internas para feats y spells:
```ts
const stepErrors = computed<Record<number, string[]>>(() => {
  const abilityErrors = [...]   // 15 líneas
  const featErrors = (() => {   // IIFE de 18 líneas
    ...
  })()
  const spellErrors = (() => {  // IIFE de 35 líneas
    ...
  })()
  return { 1: [...], 2: [...], ... 11: [] }
})
```

**Refactorización recomendada:** extraer cada bloque a una función privada del store:
```ts
function validateAbilities(): string[] { ... }
function validateFeats(): string[] { ... }
function validateSpells(): string[] { ... }
function validateLevelChoices(): string[] { ... }

const stepErrors = computed(() => ({
  1:  validateClass(),
  2:  validateLevelChoices(),
  3:  validateRace(),
  ...
}))
```
Beneficios: testeable, legible, sin IIFEs anidadas.

---

### 2.2 `save()` en builderStore — extraer ensamblado del personaje
**Archivo:** `builderStore.ts:507-608`

La función `save()` ensambla el objeto `Character` inline (~90 líneas). Este ensamblado es
lógica de dominio que merece estar aislada:
```ts
function buildCharacterFromDraft(draft: BuilderDraft): Character {
  // extrae portrait, ensambla identity, combat, spellcasting...
}

async function save(): Promise<string> {
  saving.value = true
  try {
    const character = CharacterSchema.parse(buildCharacterFromDraft(draft.value))
    await characterStore.create(character)
    await clearDraft()
    return character.id
  } catch (err) { ... }
  finally { saving.value = false }
}
```

---

### 2.3 `SelectedSpellList` — extraer a SFC separado
**Archivo:** `StepSpells.vue:358-386`

Un `defineComponent` con función `setup` que retorna un render function (`h()`), dentro de un
SFC. Esto es el peor de los dos mundos: no aprovecha la sintaxis de template ni la claridad
de los hooks de composición. Se puede reemplazar por un SFC de 20 líneas:

```vue
<!-- SelectedSpellList.vue -->
<template>
  <p v-if="!spells.length" class="text-xs font-body text-mist">No spells selected yet.</p>
  <div v-else class="space-y-1.5">
    <div v-for="s in spells" :key="s.index" class="group flex items-center ...">
      ...
    </div>
  </div>
</template>
```

---

### 2.4 `SKILL_ABILITY` — mover a shared utils
**Archivo:** `StepProficiencies.vue:191-198`

El mapa `SKILL_ABILITY` mapea skill-index → sigla de habilidad. Esta lógica también podría
derivarse de la respuesta de `/skills` (que incluye `ability_score`), pero si se mantiene
como dato estático, debe vivir en `shared/lib/` o `shared/constants/` para que otros
componentes puedan usarlo (p.ej. `AbilityBlock.vue` podría necesitarlo):
```ts
// shared/lib/skillAbilityMap.ts
export const SKILL_ABILITY: Readonly<Record<string, string>> = { ... }
```

---

### 2.5 Lógica de step-skip — tabla declarativa en lugar de condicionales
**Archivo:** `builderStore.ts:417-435`
```ts
function next() {
  if (draft.value.currentStep === 7 && !isSpellcaster.value) {
    draft.value.currentStep = 9
  } else { draft.value.currentStep++ }
}
function back() {
  if (draft.value.currentStep === 9 && !isSpellcaster.value) {
    draft.value.currentStep = 7
  } else { draft.value.currentStep-- }
}
```
Hardcoded para el único caso actual (paso 8 = spells). Cuando se añadan más pasos opcionales
(p.ej. multiclassing, 2024 ruleset), habrá más `if/else` en cascada.

**Alternativa:**
```ts
const STEP_SKIP: { step: number; condition: (draft: BuilderDraft) => boolean }[] = [
  { step: 8, condition: (d) => !getSpellProfile(d.classIndex) },
]

function next() {
  let target = draft.value.currentStep + 1
  while (STEP_SKIP.some(s => s.step === target && s.condition(draft.value))) target++
  draft.value.currentStep = Math.min(target, TOTAL_STEPS)
}
```

---

### 2.6 `BuilderDraft` — estructura plana de 128 campos
**Archivo:** `builderStore.ts:34-128`

El interface `BuilderDraft` tiene 128 campos al mismo nivel: identidad, raza, clase, nivel,
habilidades, hechizos, etc. Es difícil navegar mentalmente. Una agrupación namespace-by-step
mejoraría la legibilidad:
```ts
interface BuilderDraft {
  currentStep: number
  identity:   { name, portraitUrl, alignment, age, ... }
  race:       { raceIndex, raceName, raceSpeed, ..., subraceIndex, ... }
  class_:     { classIndex, className, hitDie, ..., subclassIndex, ... }
  abilities:  { method, baseScores, standardArrayAssignments, ... }
  spells:     { selectedCantrips, selectedSpells, spellsByLevel }
  ...
}
```
Esto requeriría actualizar todos los `draft.value.raceIndex` a `draft.value.race.raceIndex`,
pero la mejora en mantenibilidad lo justifica para una sesión de refactor.

---

### 2.7 `classMeta.ts` — datos hardcoded en TypeScript vs. JSON/API
**Archivo:** `classMeta.ts` (~700+ líneas)

Las tablas de spell slots, progresos de cantrips, features por nivel y opciones de Fighting Style
duplican datos que la 5e API sirve vía `/classes/{index}/levels`. Esto crea dos fuentes de
verdad: si hay un error en la tabla, no lo detectarás comparando con el API.

**A largo plazo:** generar `classMeta.ts` como artefacto de build desde el API (script de codegen),
o al menos separar las tablas de datos en archivos `.json` estáticos que se pueden validar contra el API.

---

## 3. Cuellos de botella

### 3.1 CRÍTICO: 45+ requests paralelas en StepFeats
**Archivo:** `StepFeats.vue:224-229`
```ts
const { data: featDetailsList } = useQuery({
  queryKey: computed(() => ['feat-details', ...featIndices.value]),
  queryFn: () => Promise.all(featIndices.value.map(i => fiveEApi.getFeat(i))),
  staleTime: Infinity,
  enabled: computed(() => featIndices.value.length > 0),
})
```
La 5e API tiene ~50 feats. Esto dispara **50 requests HTTP simultáneas** la primera vez que
el usuario abre el paso de feats. La mayoría de navegadores limitan a 6-8 conexiones
simultáneas al mismo host, por lo que los requests se encolan.

**Corrección:** la 5e-bits API tiene el endpoint `/feats` pero no devuelve `prerequisites` en el
listado. Si los prerequisitos son necesarios para filtrar, se pueden solicitar los detalles de
forma lazy (solo cuando el usuario selecciona "Take a Feat") o en batches con un pequeño delay.
Alternativamente, incluir los prerequisitos en `classMeta.ts` como datos estáticos (ya que los
feats SRD son fijos) y eliminar los 50 requests completamente.

---

### 3.2 `watch(draft, saveDraft, { deep: true })` — escrituras a localStorage en cada keystroke
**Archivo:** `builderStore.ts:408`

El watcher profundo observa todo el draft, incluyendo los campos de texto (nombre, biografía,
apariencia). Cada tecla que pulsa el usuario dispara `storageSet()` que serializa y escribe el
draft completo a localStorage. Para un draft de 100+ campos esto es innecesariamente costoso.

**Corrección:** debounce de 500ms:
```ts
import { useDebounceFn } from '@vueuse/core'
const debouncedSave = useDebounceFn(saveDraft, 500)
watch(draft, debouncedSave, { deep: true })
```

---

### 3.3 `activeSpellsBeforeLevel()` — función no memoizada llamada en template
**Archivo:** `StepSpells.vue:487-499`

```ts
function activeSpellsBeforeLevel(lvl: number): ... {
  const pool = new Map<...>()
  for (let l = 1; l < lvl; l++) { /* rebuild entire pool */ }
  return [...pool.values()]
}
```
Esta función se llama en múltiples lugares del template (`v-if`, `:limit`, `:known-spells`,
`v-for`). Para un character nivel 20 con 15+ niveles con ganancias, reconstruye el pool
completo de hechizos en cada render cycle.

**Corrección:** memoizar con `computed` parametrizado o con un `Map<number, result>` reactivo.

---

### 3.4 `persistLocal()` — serializa el array completo en cada mutación
**Archivo:** `characters/store.ts:123-125`

```ts
function persistLocal() {
  storageSet(LOCAL_KEY, characters.value)
}
```
Cada `create()`, `update()`, `remove()`, y `importFromJson()` serializa **todos** los
personajes a localStorage. Con 20 personajes de schema complejo, esto puede ser 200-400KB
de JSON por escritura.

**Corrección:** debounce o bien considerar IndexedDB para almacenamiento de mayor tamaño.

---

### 3.5 Falta de persistencia de cache TanStack Query entre sesiones
Los datos SRD (clases, razas, hechizos, skills) se configuran con `staleTime: Infinity`,
lo que es correcto dentro de una sesión. Pero al recargar la página, TanStack Query pierde
todo el cache y re-fetcha cada query. Con 20+ queries únicas (una por raza, clase, subclase
visitada), el primer render tras recarga hace decenas de requests.

**Corrección:** configurar `@tanstack/query-persist-client` con localStorage para persistir
el cache entre sesiones, dado que los datos SRD son esencialmente inmutables.

---

### 3.6 Sin virtualización en listas largas
Los modales de selección de hechizos (`SpellPickerModal`) y la lista de feats pueden mostrar
200-300 items como DOM nodes completos. Con filtros activos esto no es problema, pero sin
filtro activo la lista completa se renderiza.

---

## 4. Seguridad

### Estado general: **Bueno para un MVP**

**Puntos fuertes:**
- Supabase RLS: las queries filtran por `user_id` — aunque RLS deba estar activo también a nivel
  de base de datos (no verificable desde el código cliente)
- Zod valida todos los datos externos: localStorage, import JSON, responses API
- Sin `v-html` ni `innerHTML` en ningún componente → XSS prácticamente imposible
- Auth guard en rutas protegidas
- No hay secrets en el código cliente (solo `VITE_*` env vars, que son públicas por diseño en Vite)

---

### 4.1 Portrait URL — SSRF de baja severidad
**Archivo:** `builderStore.ts:516-519`
```ts
try { new URL(d.portraitUrl); portrait = { type: 'url', url: d.portraitUrl } }
catch { /* skip invalid URL */ }
```
La URL se valida como URL sintácticamente válida pero no se restringe el protocolo ni el dominio.
`javascript:` URLs se rechazarán por el constructor `URL()`, pero `http://attacker.com/track.png`
es válido. Al renderizar el portrait, el navegador hace un request a ese servidor, revelando
la IP del usuario.

**Riesgo:** bajo (no es XSS; es una feature de usuario).
**Mejora opcional:** aceptar solo `https://` y/o usar un allowlist de hosts confiables (imgur,
gravatar, etc.) si se quiere ser estricto.

---

### 4.2 Import JSON — datos de terceros sin sanitización de URLs
**Archivo:** `characters/store.ts:213-263`

Un archivo JSON importado que pase la validación Zod puede contener `portraitUrl` con URLs
arbitrarias. Si se importa un personaje malicioso, el portrait se renderiza sin restricciones.
Mismo riesgo que 4.1, pero el vector de ataque es compartir un JSON de personaje.

---

### 4.3 `auth.userId!` — assertions no-null en código cloud
Ya descrito en 1.7. El riesgo de seguridad específico: si por alguna condición de carrera
`persistCloud` se llama con `userId = null`, el `null!` coerciona a `'null'` en el .eq()
de Supabase, creando rows con `user_id = 'null'` (string) que ningún usuario real podrá
reclamar y que Supabase RLS podría o no bloquear dependiendo de la policy.

---

### 4.4 Sin CSRF en mutaciones Supabase
Supabase client-side usa tokens JWT en localStorage. No hay protección CSRF adicional
porque es una SPA, pero conviene saber que si la app evoluciona a tener requests server-side,
el modelo de seguridad cambia.

---

### 4.5 Variables de entorno no validadas al arranque
**Archivo:** `supabase.client.ts`

Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no están definidas, el cliente Supabase
se inicializa con `undefined`, produciendo errores difíciles de diagnosticar.

**Mejora:**
```ts
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Missing Supabase env vars. Check .env.local')
```

---

## 5. Escalabilidad y Mantenibilidad

### 5.1 Sin tests de ningún tipo
El codebase no tiene test files visibles. Las funciones de mecánicas de juego son **funciones
puras perfectas para testing unitario**: `computeProficiencyBonus`, `computeModifier`,
`pbCost`, `pbCostDelta`, `getSpellSlots`, `computedMaxHp`, `migrateCharacter`.

Un error en `computeProficiencyBonus` o `getSpellSlots` afecta silenciosamente a todos los
personajes sin ninguna red de seguridad.

**Recomendación mínima:** añadir Vitest y cubrir:
- `derivedStats.ts` — 100% coverage posible con ~15 tests
- `builderStore.ts::computedMaxHp` — casos edge para roll/average/max/manual con CON negativo
- `classMeta.ts::getSpellSlots` — verificar tablas contra referencia externa
- `migrateCharacter.ts` — test que un objeto stale migra correctamente

---

### 5.2 Sin error boundary global
**Archivo:** `main.ts`

Vue permite configurar `app.config.errorHandler`. Sin él, errores no capturados en componentes
producen solo un `console.error` invisible para el usuario.

```ts
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info)
  // reportar a Sentry, o mostrar un toast
}
```

---

### 5.3 `classMeta.ts` como única fuente de verdad de SRD — fragile dependency
Hoy el builder funciona offline (salvo para cargar listas de clases/razas). Esto es posible
porque `classMeta.ts` tiene datos suficientes. Pero:
- Los fighting style descriptions están hardcoded en `classMeta.ts`
- Los spell slots están duplicados (el API también los sirve en `/classes/{index}/levels`)
- Las feature descriptions no están — solo nombres

Cuando se quiera añadir clases de expansión (Artificer, etc.) o el nuevo 2024 ruleset,
`classMeta.ts` se convierte en un cuello de botella editorial. No hay forma de saber si
los datos están desactualizados.

---

### 5.4 `characters/store.ts` y `builderStore.ts` acoplados
**Archivo:** `builderStore.ts:510`
```ts
const characterStore = useCharactersStore()
```
El builder store importa directamente el characters store en `save()`. Esto funciona en Pinia
(cross-store calls son el patrón recomendado), pero hace que el builder no sea testeable de
forma aislada sin instanciar también el characters store.

---

### 5.5 Ausencia de multiclassing
El builder está estructurado para una clase por personaje. La interfaz de level choices usa
`levelChoices: Record<number, Record<string, string>>` donde los niveles son de una sola clase.
Si en el futuro se quiere implementar multiclassing, la estructura del draft y el cálculo de
spell slots y ASI levels tendrían que cambiar significativamente.

Al menos, añadir una nota en el `BuilderDraft` indicando que es single-class intencionalmente.

---

### 5.6 `loadDraft()` — criterio de "draft válido" demasiado permisivo
**Archivo:** `builderStore.ts:386-393`
```ts
function loadDraft(): boolean {
  const saved = storageGet(DRAFT_KEY, DraftSchema)
  if (!saved) return false
  const merged = { ...defaultDraft(), ...(saved as Partial<BuilderDraft>) }
  if (!merged.name && !merged.raceIndex && !merged.classIndex) return false
  draft.value = merged
  return true
}
```
Un draft con sólo `currentStep: 5` y un `classIndex` válido pasaría este check. El usuario
vería un builder en paso 5 con todo lo demás vacío. El criterio debería ser más restrictivo
o mostrar un mensaje de "draft incompleto" con opción de empezar desde cero.

---

### 5.7 Gestión de step actual vs. total
```ts
const totalSteps = computed(() => isSpellcaster.value ? TOTAL_STEPS : TOTAL_STEPS - 1)
```
`totalSteps` cambia según si la clase es spellcaster. Si el usuario cambia de clase en el paso 7
(de mago a guerrero), `totalSteps` baja de 11 a 10 y el currentStep puede quedar en el paso 8
(spells) que ya no existe. El `back()` lo maneja, pero `goTo()` puede llevar directamente a un
paso inválido.

---

### 5.8 Falta de feedback de error en cloud sync
Cuando `persistCloud` falla, el error se lanza (`if (error) throw error`) y lo captura el
llamador... que en `update()` no tiene ningún handler de UI. El usuario no sabe que sus cambios
no se guardaron en la nube.

**Recomendación:** integrar un sistema de toast/notification y mostrar error cuando la sync falla,
con posibilidad de reintentar.

---

## Resumen ejecutivo

| Categoría | Estado | Prioridad |
|-----------|--------|-----------|
| Bug — savingThrowProficiencies | Crítico (datos incorrectos guardados) | P0 |
| Bug — HP=0 con roll incompleto | Medio (usuario guarda personaje inválido) | P1 |
| Bug — auth guard race condition | Medio (UX incorrecta en navegación directa) | P1 |
| Perf — 50 requests en StepFeats | Alto (bloquea el paso al primer acceso) | P1 |
| Perf — watch sin debounce | Bajo (escribe en cada keystroke) | P2 |
| Seguridad — portrait URL sin restricción | Bajo (no es XSS) | P3 |
| Seguridad — non-null assertions cloud | Bajo | P2 |
| Mantenibilidad — sin tests | Alto (riesgo de regressions silenciosas) | P1 |
| Mantenibilidad — stepErrors monolítico | Medio (dificulta extensión) | P2 |
| Mantenibilidad — BuilderDraft plano | Bajo (estilo) | P3 |
| Escalabilidad — classMeta hardcoded | Medio (deuda técnica acumulable) | P2 |

Las prioridades P0/P1 deberían atenderse antes de cualquier release público. Las P2/P3 son
deuda técnica a gestionar en los siguientes sprints.
