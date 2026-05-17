import type { Stage } from '../../../core/stages/types.ts'

export const stage3: Stage = {
  id: 'c1-s03-sum-of-three',
  chapter: 1,
  order: 3,
  title: { ja: '3つの和', en: 'Sum of Three' },
  objective: { ja: 'R1・R2・R3 の合計を R4 に格納せよ', en: 'Sum R1, R2, and R3, store the result in R4' },

  initialMemory: [],
  initialSource: 'MOV R1, 1\nMOV R2, 2\nMOV R3, 6\n',

  successConditions: [
    { type: 'register',          target: 'R4', expected: 9 },
    { type: 'instruction_used', op: 'ADD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'ADD命令は2つの値しか足せません。\n3つ足すには2回必要です。',
      en: 'ADD can only add two values at a time.\nYou need two ADD instructions for three values.',
    },
    {
      kind: 'hint',
      ja: '一度中間結果をレジスタに保存しましょう。\nADD R4, R1, R2  → R4 = R1+R2（= 3）\n\n次に R4 に R3 を足します。\nADD R4, R4, R3  → R4 = R4+R3（= 9）\n※ 書き先と読み元に同じレジスタを使えます（a = a+6 と同じ考え方）',
      en: 'Store an intermediate result first.\nADD R4, R1, R2  → R4 = R1+R2 (= 3)\n\nThen add R3 to R4.\nADD R4, R4, R3  → R4 = R4+R3 (= 9)\n* The destination and source can be the same register (like a = a+6).',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 1\nMOV R2, 2\nMOV R3, 6\nADD R4, R1, R2\nADD R4, R4, R3',
      en: 'MOV R1, 1\nMOV R2, 2\nMOV R3, 6\nADD R4, R1, R2\nADD R4, R4, R3',
    },
  ],
}
