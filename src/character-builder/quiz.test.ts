import { describe, it, expect } from 'vitest'
import { QUIZ, scoreQuiz, presetForAnswers, type ClassIndex } from './quiz'
import { PRESETS } from './presets'

// Helper: pick the option index whose label matches a substring, per question id.
function answer(...picks: [string, RegExp][]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [qid, re] of picks) {
    const q = QUIZ.find(q => q.id === qid)!
    const idx = q.options.findIndex(o => re.test(o.label))
    if (idx < 0) throw new Error(`no option matches ${re} for ${qid}`)
    out[qid] = idx
  }
  return out
}

describe('quiz shape', () => {
  it('has 8 questions, each with 4 options', () => {
    expect(QUIZ).toHaveLength(8)
    for (const q of QUIZ) expect(q.options).toHaveLength(4)
  })
})

describe('scoreQuiz: signature answer sets route to the intended class', () => {
  const cases: [ClassIndex, [string, RegExp][]][] = [
    ['wizard', [['source', /arcane study/], ['role', /destruction/], ['weapon', /spell/], ['instinct', /magical power/]]],
    ['sorcerer', [['source', /born with/], ['instinct', /magical power/], ['role', /destruction/]]],
    ['warlock', [['source2', /pact/], ['insult', /ominous/], ['encounter', /trick/]]],
    ['druid', [['source2', /living world/], ['encounter', /outlast/], ['role', /alive/]]],
    ['bard', [['source2', /Art, music/], ['encounter', /trick/], ['insult', /remark/]]],
    ['monk', [['source2', /Discipline/], ['insult', /fists/], ['nature', /Nimble/]]],
    ['cleric', [['source', /Faith/], ['role', /alive/], ['encounter', /outlast/]]],
    ['paladin', [['instinct', /between danger/], ['source', /Faith/], ['role', /frontline/], ['weapon', /two-handed/]]],
    ['ranger', [['weapon', /bow/], ['instinct', /shadows/], ['nature', /Nimble/]]],
    ['barbarian', [['instinct', /hit as hard/], ['encounter', /Smash/], ['weapon', /two-handed/], ['nature', /powerful/]]],
    ['fighter', [['source', /Training/], ['role', /frontline/], ['nature', /powerful/], ['weapon', /two-handed/]]],
    ['rogue', [['instinct', /shadows/], ['role', /quietly/], ['weapon', /quick blade/]]],
  ]
  it.each(cases)('routes to %s', (expected, picks) => {
    expect(scoreQuiz(answer(...picks))).toBe(expected)
  })
})

describe('scoreQuiz: robustness', () => {
  it('is deterministic for empty answers', () => {
    expect(scoreQuiz({})).toBe(scoreQuiz({}))
  })
  it('ignores unanswered questions', () => {
    expect(scoreQuiz(answer(['source', /arcane study/]))).toBe('wizard')
  })
})

describe('presetForAnswers', () => {
  it('always resolves to a real preset', () => {
    const p = presetForAnswers(answer(['source', /arcane study/]))
    expect(p?.draft.classIndex).toBeTruthy()
  })
  it('every quiz class has a matching preset', () => {
    const presetClasses = new Set(PRESETS.map(p => p.draft.classIndex))
    const quizClasses: ClassIndex[] = [
      'barbarian', 'fighter', 'rogue', 'paladin', 'monk', 'ranger',
      'wizard', 'sorcerer', 'warlock', 'cleric', 'druid', 'bard',
    ]
    for (const c of quizClasses) expect(presetClasses.has(c)).toBe(true)
  })
})
