import type { Stage } from '../../../core/stages/types.ts'

export const stage4: Stage = {
  id: 'c1-s04-subtraction',
  chapter: 1,
  order: 4,
  title: { ja: '引き算', en: 'Subtraction' },
  objective: { ja: 'R0 から R1 を引いた結果を R0 に格納せよ', en: 'Subtract R1 from R0 and store the result back in R0' },

  initialMemory: [],
  initialSource: 'MOV R0, 10\nMOV R1, 4\n',

  successConditions: [
    { type: 'register',          target: 'R0', expected: 6 },
    { type: 'instruction_used', op: 'SUB' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'HALT'],

  interlude: {
    ja: [
      {
        body: `R0 に 6 を入れる方法は、これだけではない。
MOV R0, 6 と書けば終わる。

それでも SUB を使うよう求めるのは、
道具の使い方を覚えてほしいからだ。`,
      },
    ],
    en: [
      {
        body: `There is more than one way to put 6 into R0.
Writing MOV R0, 6 would be enough.

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
      ja: '書き先と読み元に同じレジスタを使えます（a = a - 4 と同じ考え方）。\nSUB R0, R0, R1 → R0 = R0 - R1\nこれで R0 の値を直接更新できます。',
      en: 'The destination and source can be the same register (like a = a - 4).\nSUB R0, R0, R1 → R0 = R0 - R1\nThis updates R0 directly.',
    },
    {
      kind: 'answer',
      ja: 'MOV R0, 10\nMOV R1, 4\nSUB R0, R0, R1',
      en: 'MOV R0, 10\nMOV R1, 4\nSUB R0, R0, R1',
    },
  ],
}
