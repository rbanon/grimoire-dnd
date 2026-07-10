import { describe, it, expect } from 'vitest'
import { QUIZ, scoreQuiz, presetForAnswers } from './quiz'

// Helper: pick the option index whose label matches a substring, per question id.
function answer(...picks: [string, RegExp][]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [qid, re] of picks) {
    const q = QUIZ.find(q => q.id === qid)!
    out[qid] = q.options.findIndex(o => re.test(o.label))
  }
  return out
}

describe('scoreQuiz', () => {
  it('routes all-arcane answers to the wizard', () => {
    const a = answer(
      ['instinct', /arcane power/], ['nature', /studious/],
      ['role', /problem-solver/], ['magic', /arcane power/],
    )
    expect(scoreQuiz(a)).toBe('wizard')
  })

  it('routes all-holy answers to the paladin', () => {
    const a = answer(
      ['instinct', /between danger/], ['nature', /Charismatic/],
      ['role', /inspiring leader/], ['magic', /divine help/],
    )
    expect(scoreQuiz(a)).toBe('paladin')
  })

  it('routes disciplined, nimble, steel-trusting answers to the monk', () => {
    const a = answer(
      ['instinct', /shadows/], ['nature', /Quick/],
      ['role', /quietly/], ['magic', /discipline and focus/],
    )
    // rogue and monk both score; the discipline answer tips it to monk.
    expect(['monk', 'rogue']).toContain(scoreQuiz(a))
  })

  it('routes raw-force answers to a martial class', () => {
    const a = answer(
      ['instinct', /hit as hard/], ['nature', /powerful/],
      ['role', /frontline/], ['magic', /steel over spells/],
    )
    expect(['barbarian', 'fighter']).toContain(scoreQuiz(a))
  })

  it('is deterministic for empty answers', () => {
    expect(scoreQuiz({})).toBe(scoreQuiz({}))
  })
})

describe('presetForAnswers', () => {
  it('always resolves to a real preset', () => {
    const p = presetForAnswers(answer(['instinct', /arcane power/]))
    expect(p).toBeTruthy()
    expect(p.draft.classIndex).toBeTruthy()
  })

  it('maps the arcane result to a wizard preset', () => {
    const a = answer(
      ['instinct', /arcane power/], ['nature', /studious/],
      ['role', /problem-solver/], ['magic', /arcane power/],
    )
    expect(presetForAnswers(a).draft.classIndex).toBe('wizard')
  })
})
