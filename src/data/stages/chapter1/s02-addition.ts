import type { Stage } from '../../../core/stages/types.ts'

export const stage2: Stage = {
  id: 'c1-s02-addition',
  chapter: 1,
  order: 2,
  title: { ja: '足し算', en: 'Addition' },
  objective: { ja: '3 と 4 を足した結果を R3 に格納せよ', en: 'Add 3 and 4, store the result in R3' },

  initialMemory: [],

  successConditions: [
    { type: 'register',          target: 'R3', expected: 7 },
    { type: 'instruction_used', op: 'ADD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'まず MOV で R1 と R2 に値をセットしましょう。\nADD は数値を直接扱えず、レジスタ同士の足し算です。\n例: MOV R1, 3',
      en: 'First, use MOV to set values in R1 and R2.\nADD works only with registers, not immediate values.\nExample: MOV R1, 3',
    },
    {
      kind: 'hint',
      ja: 'ADD命令で2つのレジスタを足せます。\n書き方: ADD 結果, 値1, 値2\n例: ADD R3, R1, R2 → R3 = R1 + R2',
      en: 'Use ADD to sum two registers.\nSyntax: ADD dst, src1, src2\nExample: ADD R3, R1, R2 → R3 = R1 + R2',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 3\nMOV R2, 4\nADD R3, R1, R2',
      en: 'MOV R1, 3\nMOV R2, 4\nADD R3, R1, R2',
    },
  ],
}
