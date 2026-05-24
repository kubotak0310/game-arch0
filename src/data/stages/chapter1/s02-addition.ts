import type { Stage } from '../../../core/stages/types.ts'

export const stage2: Stage = {
  id: 'c1-s02-addition',
  chapter: 1,
  order: 2,
  title: { ja: '足し算', en: 'Addition' },
  objective: { ja: '3 と 4 を足した結果を R2 に格納せよ', en: 'Add 3 and 4, store the result in R2' },

  initialMemory: [],

  successConditions: [
    { type: 'register',          target: 'R2', expected: 7 },
    { type: 'instruction_used', op: 'ADD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'HALT'],

  interlude: {
    ja: [
      {
        date: '1986 年 初夏',
        diagram: 'alu' as const,
        body: `ADD は、2つのレジスタを足して3つ目に置く。
足し算そのものは単純だ。

問題は、どのレジスタに何の数が入っているかを
自分で把握しなければならないことだ。
コンピュータは教えてくれない。`,
      },
    ],
    en: [
      {
        date: 'Early Summer, 1986',
        diagram: 'alu' as const,
        body: `ADD places the sum of two registers into a third.
The addition itself is simple.

The difficulty is keeping track of
which register holds what.
The machine will not remind you.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'まず MOV で R0 と R1 に値をセットしましょう。\nADD は数値を直接扱えず、レジスタ同士の足し算です。\n例: MOV R0, 3',
      en: 'First, use MOV to set values in R0 and R1.\nADD works only with registers, not immediate values.\nExample: MOV R0, 3',
    },
    {
      kind: 'hint',
      ja: 'ADD命令で2つのレジスタを足せます。\n書き方: ADD 結果, 値1, 値2\n例: ADD R2, R0, R1 → R2 = R0 + R1',
      en: 'Use ADD to sum two registers.\nSyntax: ADD dst, src1, src2\nExample: ADD R2, R0, R1 → R2 = R0 + R1',
    },
    {
      kind: 'answer',
      ja: 'MOV R0, 3\nMOV R1, 4\nADD R2, R0, R1',
      en: 'MOV R0, 3\nMOV R1, 4\nADD R2, R0, R1',
    },
  ],
}
