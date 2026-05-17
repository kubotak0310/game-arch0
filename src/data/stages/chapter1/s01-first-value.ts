import type { Stage } from '../../../core/stages/types.ts'

export const stage1: Stage = {
  id: 'c1-s01-first-value',
  chapter: 1,
  order: 1,
  title: { ja: 'はじめての値', en: 'First Value' },
  objective: { ja: 'R1 に 2 を、R2 に 3 を格納せよ', en: 'Store 2 in R1 and 3 in R2' },

  initialRegisters: {},
  initialMemory: [],

  successConditions: [
    { type: 'register',          target: 'R1', expected: 2 },
    { type: 'register',          target: 'R2', expected: 3 },
    { type: 'instruction_used', op: 'MOV' },
  ],

  unlockedInstructions: ['MOV', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'MOV命令を使います。\n例: MOV R1, 2',
      en: 'Use the MOV instruction.\nExample: MOV R1, 2',
    },
    {
      kind: 'hint',
      ja: 'R2にも同じパターンで書いてみましょう。\nMOV R2, 3',
      en: 'Write the same pattern for R2.\nMOV R2, 3',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 2\nMOV R2, 3',
      en: 'MOV R1, 2\nMOV R2, 3',
    },
  ],
}
