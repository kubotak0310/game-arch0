import type { Stage } from '../../../core/stages/types.ts'

export const stage5: Stage = {
  id: 'c1-s05-swap',
  chapter: 1,
  order: 5,
  title: { ja: '値の交換', en: 'Swap Values' },
  objective: { ja: 'R0 と R1 の値を入れ替えよ', en: 'Swap the values in R0 and R1' },

  initialMemory: [],
  initialSource: 'MOV R0, 5\nMOV R1, 8\n',

  successConditions: [
    { type: 'register', target: 'R0', expected: 8 },
    { type: 'register', target: 'R1', expected: 5 },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'HALT'],

  interlude: {
    ja: [
      {
        diagram: 'swap' as const,
        body: `2つの値を直接交換することはできない。
必ず第3の場所が必要になる。

当たり前のことだが、改めて考えると面白い。
「直接できない」という制約が、設計の形を決める。`,
      },
    ],
    en: [
      {
        diagram: 'swap' as const,
        body: `Two values cannot be exchanged directly.
A third location is always required.

This seems obvious, but sitting with it is interesting.
The constraint of "cannot be done directly" shapes the design.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'C言語で書くとこうなります：\n\nint temp = r1;\nr1 = r2;\nr2 = temp;\n\n2つの変数を直接入れ替えることはできないので、\n一時的な変数 temp が必要です。\nアセンブラでは R2 を temp として使いましょう。',
      en: 'In C, this looks like:\n\nint temp = r1;\nr1 = r2;\nr2 = temp;\n\nYou cannot swap two variables directly,\nso a temporary variable temp is needed.\nUse R2 as temp in assembly.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語        // アセンブラ\ntemp = r1;  →  MOV R2, R0\nr1 = r2;    →  MOV R0, R1\nr2 = temp;  →  MOV R1, R2',
      en: 'Here is the C-to-assembly mapping:\n\n// C            // Assembly\ntemp = r1;  →  MOV R2, R0\nr1 = r2;    →  MOV R0, R1\nr2 = temp;  →  MOV R1, R2',
    },
    {
      kind: 'answer',
      ja: 'MOV R0, 5\nMOV R1, 8\nMOV R2, R0\nMOV R0, R1\nMOV R1, R2',
      en: 'MOV R0, 5\nMOV R1, 8\nMOV R2, R0\nMOV R0, R1\nMOV R1, R2',
    },
  ],
}
