import type { Stage } from '../../../core/stages/types.ts'

export const stage1: Stage = {
  id: 'c1-s01-first-value',
  chapter: 1,
  order: 1,
  title: { ja: 'はじめての値', en: 'First Value' },

  initialRegisters: {},
  initialMemory: [],

  successConditions: [
    { type: 'register', target: 'R1', expected: 2 },
    { type: 'register', target: 'R2', expected: 3 },
  ],

  unlockedInstructions: ['MOV', 'HALT'],

  hints: [
    {
      ja: 'MOV命令を使います。\n例: MOV R1, #2',
      en: 'Use the MOV instruction.\nExample: MOV R1, #2',
    },
    {
      ja: 'R2にも同じパターンで書いてみましょう。\nMOV R2, #3',
      en: 'Write the same pattern for R2.\nMOV R2, #3',
    },
    {
      ja: '答え:\nMOV R1, #2\nMOV R2, #3',
      en: 'Answer:\nMOV R1, #2\nMOV R2, #3',
    },
  ],
}
