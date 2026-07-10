// Guided-quiz scorer: maps a set of playstyle answers to one of the ready-made presets.
// Pure and deterministic so it can be unit-tested and reused by QuizPage.
import { PRESETS, type CharacterPreset } from '@/character-builder/presets'

export type ClassIndex =
  | 'barbarian' | 'fighter' | 'rogue' | 'paladin' | 'monk' | 'ranger'
  | 'wizard' | 'sorcerer' | 'warlock' | 'cleric' | 'druid' | 'bard'

export interface QuizOption {
  label: string
  description?: string
  // Class affinity contributed by choosing this option.
  weights: Partial<Record<ClassIndex, number>>
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
}

export const QUIZ: QuizQuestion[] = [
  {
    id: 'instinct',
    prompt: 'Trouble finds you. What is your first instinct?',
    options: [
      { label: 'Charge in and hit as hard as I can', weights: { barbarian: 3, fighter: 1 } },
      { label: 'Slip into the shadows and pick my moment', weights: { rogue: 3, monk: 1, ranger: 1 } },
      { label: 'Unleash raw magical power', weights: { sorcerer: 3, wizard: 1, warlock: 1 } },
      { label: 'Put myself between danger and my friends', weights: { paladin: 3, cleric: 1, fighter: 1 } },
    ],
  },
  {
    id: 'nature',
    prompt: 'Which of these describes you best?',
    options: [
      { label: 'Tough, fearless and physically powerful', weights: { barbarian: 2, fighter: 2 } },
      { label: 'Nimble, precise and hard to pin down', weights: { rogue: 2, monk: 2, ranger: 1 } },
      { label: 'Curious, studious and clever', weights: { wizard: 3, cleric: 1 } },
      { label: 'Charismatic, magnetic and bold', weights: { bard: 2, sorcerer: 1, paladin: 1, warlock: 1 } },
    ],
  },
  {
    id: 'role',
    prompt: 'In a party, you would rather be…',
    options: [
      { label: 'The unbreakable frontline', weights: { fighter: 2, paladin: 2, barbarian: 1 } },
      { label: 'The one who gets things done quietly', weights: { rogue: 3, monk: 1 } },
      { label: 'The one who keeps everyone alive', weights: { cleric: 3, druid: 1, bard: 1 } },
      { label: 'The one raining down destruction', weights: { wizard: 2, sorcerer: 2, warlock: 1 } },
    ],
  },
  {
    id: 'source',
    prompt: 'Where does your strength truly come from?',
    options: [
      { label: 'Training, grit and hard-won skill', weights: { fighter: 3, barbarian: 1, ranger: 1 } },
      { label: 'Faith in something greater than myself', weights: { cleric: 3, paladin: 2 } },
      { label: 'Long years of arcane study', weights: { wizard: 4 } },
      { label: 'Something I was simply born with', weights: { sorcerer: 4 } },
    ],
  },
  {
    id: 'source2',
    prompt: 'And which of these calls to you most?',
    options: [
      { label: 'A pact with a powerful, otherworldly patron', weights: { warlock: 4 } },
      { label: 'The living world — beasts, storms and wild places', weights: { druid: 4, ranger: 2 } },
      { label: 'Art, music, stories and clever words', weights: { bard: 4 } },
      { label: 'Discipline of body and mind', weights: { monk: 4 } },
    ],
  },
  {
    id: 'weapon',
    prompt: 'Your weapon of choice?',
    options: [
      { label: 'A big, brutal two-handed weapon', weights: { barbarian: 2, fighter: 2, paladin: 1 } },
      { label: 'A bow and a good vantage point', weights: { ranger: 3, fighter: 1 } },
      { label: 'A quick blade and quicker wits', weights: { rogue: 2, bard: 1, monk: 1 } },
      { label: 'A spell on my lips', weights: { wizard: 2, sorcerer: 1, cleric: 1, warlock: 1, druid: 1 } },
    ],
  },
  {
    id: 'encounter',
    prompt: 'Your ideal way through a tough encounter?',
    options: [
      { label: 'Smash straight through the obstacle', weights: { barbarian: 3, fighter: 1 } },
      { label: 'Talk — or trick — our way past it', weights: { bard: 3, rogue: 1, warlock: 1 } },
      { label: 'Heal, protect and outlast them', weights: { cleric: 2, paladin: 2, druid: 1 } },
      { label: 'Blast it off the map', weights: { sorcerer: 2, wizard: 2, warlock: 1 } },
    ],
  },
  {
    id: 'insult',
    prompt: 'A stranger insults you in a crowded tavern. You…',
    options: [
      { label: 'Answer with my fists', weights: { barbarian: 2, monk: 2, fighter: 1 } },
      { label: 'Cut them down with a remark that stings more', weights: { bard: 3, rogue: 1 } },
      { label: 'Let it go — I answer to a higher calling', weights: { paladin: 2, cleric: 2, druid: 1 } },
      { label: 'Offer a quiet, ominous show of power', weights: { warlock: 3, sorcerer: 1 } },
    ],
  },
]

// Deterministic tie-break so equal scores always resolve to the same class. Rarer / more
// distinctive classes come first so ties lean toward variety rather than plain fighters.
const CLASS_PRIORITY: ClassIndex[] = [
  'warlock', 'sorcerer', 'bard', 'druid', 'ranger', 'monk',
  'paladin', 'cleric', 'rogue', 'barbarian', 'wizard', 'fighter',
]

/**
 * Tally class affinity across the chosen options and return the winning class.
 * `answers` maps question id → chosen option index. Unanswered questions are ignored.
 */
export function scoreQuiz(answers: Record<string, number>): ClassIndex {
  const totals: Record<string, number> = {}
  for (const q of QUIZ) {
    const opt = q.options[answers[q.id]]
    if (!opt) continue
    for (const [cls, w] of Object.entries(opt.weights)) {
      totals[cls] = (totals[cls] ?? 0) + (w ?? 0)
    }
  }
  let best: ClassIndex = CLASS_PRIORITY[0]
  let bestScore = -1
  for (const cls of CLASS_PRIORITY) {
    const score = totals[cls] ?? 0
    if (score > bestScore) { best = cls; bestScore = score }
  }
  return best
}

/** Resolve the quiz answers to the matching ready-made preset. */
export function presetForAnswers(answers: Record<string, number>): CharacterPreset {
  const cls = scoreQuiz(answers)
  return PRESETS.find(p => p.draft.classIndex === cls) ?? PRESETS[0]
}
