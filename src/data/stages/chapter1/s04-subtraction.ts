import type { Stage } from '../../../core/stages/types.ts'

export const stage4: Stage = {
  id: 'c1-s04-subtraction',
  chapter: 1,
  order: 4,
  title: { ja: '引き算', en: 'Subtraction' },
  objective: { ja: 'R1 から R2 を引いた結果を R1 に格納せよ', en: 'Subtract R2 from R1 and store the result back in R1' },

  initialMemory: [],
  initialSource: 'MOV R1, 10\nMOV R2, 4\n',

  successConditions: [
    { type: 'register',          target: 'R1', expected: 6 },
    { type: 'instruction_used', op: 'SUB' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'HALT'],

  interlude: {
    ja: [
      {
        body: `R1 に 6 を入れる方法は、これだけではない。
MOV R1, 6 と書けば終わる。

それでも SUB を使うよう求めるのは、
道具の使い方を覚えてほしいからだ。`,
      },
    ],
    en: [
      {
        body: `There is more than one way to put 6 into R1.
Writing MOV R1, 6 would be enough.

But I ask for SUB because
I want you to learn how to use the tool.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'SUB命令を使います。\n書き方: SUB 結果, 値1, 値2\nこれで 結果 = 値1 - 値2 になります',
      en: 'Use the SUB instruction.\nSyntax: SUB dst, src1, src2\nThis sets dst = src1 - src2',
    },
    {
      kind: 'hint',
      ja: '書き先と読み元に同じレジスタを使えます（a = a - 4 と同じ考え方）。\nSUB R1, R1, R2 → R1 = R1 - R2\nこれで R1 の値を直接更新できます。',
      en: 'The destination and source can be the same register (like a = a - 4).\nSUB R1, R1, R2 → R1 = R1 - R2\nThis updates R1 directly.',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 10\nMOV R2, 4\nSUB R1, R1, R2',
      en: 'MOV R1, 10\nMOV R2, 4\nSUB R1, R1, R2',
    },
  ],
}
