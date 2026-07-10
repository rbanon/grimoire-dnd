// Guided-quiz scorer: maps a handful of playstyle answers to one of the ready-made presets.
// Pure and deterministic so it can be unit-tested and reused by QuizPage.
import { PRESETS, type CharacterPreset } from '@/character-builder/presets'

export type ClassIndex =
  | 'barbarian' | 'fighter' | 'rogue' | 'paladin' | 'monk' | 'wizard'

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
      { label: 'Slip into the shadows and pick my moment', weights: { rogue: 3, monk: 1 } },
      { label: 'Reach for arcane power', weights: { wizard: 4 } },
      { label: 'Stand between danger and my friends', weights: { paladin: 3, fighter: 1 } },
    ],
  },
  {
    id: 'nature',
    prompt: 'Which of these describes you best?',
    options: [
      { label: 'Physically powerful and fearless', weights: { barbarian: 2, fighter: 2 } },
      { label: 'Quick, precise and hard to pin down', weights: { rogue: 2, monk: 2 } },
      { label: 'Curious, studious and clever', weights: { wizard: 3 } },
      { label: 'Charismatic, driven and principled', weights: { paladin: 3 } },
    ],
  },
  {
    id: 'role',
    prompt: 'In a party, you would rather be…',
    options: [
      { label: 'The unbreakable frontline', weights: { fighter: 2, barbarian: 2, paladin: 1 } },
      { label: 'The one who gets things done quietly', weights: { rogue: 3, monk: 1 } },
      { label: 'The clever problem-solver', weights: { wizard: 3, rogue: 1 } },
      { label: 'The inspiring leader', weights: { paladin: 3 } },
    ],
  },
  {
    id: 'magic',
    prompt: 'How do you feel about magic?',
    options: [
      { label: 'I trust steel over spells', weights: { barbarian: 2, fighter: 2, rogue: 1 } },
      { label: 'A little divine help never hurts', weights: { paladin: 4 } },
      { label: 'Give me all the arcane power there is', weights: { wizard: 4 } },
      { label: 'I rely on inner discipline and focus', weights: { monk: 4 } },
    ],
  },
]

// Deterministic tie-break so equal scores always resolve to the same class.
const CLASS_PRIORITY: ClassIndex[] = ['wizard', 'paladin', 'rogue', 'monk', 'barbarian', 'fighter']

/**
 * Tally class affinity across the chosen options and return the winning class.
 * `answers` maps question id → chosen option index. Unanswered questions are ignored.
 */
export function scoreQuiz(answers: Record<string, number>): ClassIndex {
  const totals: Record<string, number> = {}
  for (const q of QUIZ) {
    const choice = answers[q.id]
    const opt = q.options[choice]
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
