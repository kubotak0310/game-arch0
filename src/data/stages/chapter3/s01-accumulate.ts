import type { Stage } from '../../../core/stages/types.ts'

export const stage1: Stage = {
  id: 'c3-s01-accumulate',
  chapter: 3,
  order: 1,
  title: { ja: '累積加算', en: 'Accumulate' },
  objective: { ja: '1 から 5 までの合計（15）を R1 に格納せよ', en: 'Sum 1 through 5 (= 15) and store the result in R1' },

  initialRegisters: {},
  initialMemory: [],

  successConditions: [
    { type: 'register',          target: 'R1', expected: 15 },
    { type: 'instruction_used', op: 'ADD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'JMP', 'HALT'],

  interlude: {
    ja: [
      {
        date: '1986 年 晩秋',
        diagram: 'loop' as const,
        body: `初めてループを書く学生は、たいてい同じ場所で詰まる。
「どこで止まるか」を決め忘れるのだ。

終わらないループは、無限に続く。当然だ。
止まる条件を先に考えると、書き方が変わる。
終点を決めてから、出発するといい。`,
      },
    ],
    en: [
      {
        date: 'Late Autumn, 1986',
        diagram: 'loop' as const,
        body: `Students writing their first loop
almost always get stuck at the same place.
They forget to decide where to stop.

A loop without a termination runs forever. Obviously.
Think about the exit condition first.
Decide the destination before you depart.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'C言語で書くとこうなります：\n\nint sum = 0;\nint i = 1;\nwhile (i != 6) {\n    sum += i;\n    i++;\n}\n\nこれをアセンブラに翻訳します。\nR1 を sum、R2 を i として使いましょう。',
      en: 'In C, this looks like:\n\nint sum = 0;\nint i = 1;\nwhile (i != 6) {\n    sum += i;\n    i++;\n}\n\nTranslate this to assembly.\nUse R1 for sum and R2 for i.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語          // アセンブラ\nsum = 0;    →   MOV R1, 0\ni = 1;      →   MOV R2, 1\n            →   loop:\nsum += i;   →     ADD R1, R1, R2\ni++;        →     ADD R2, R2, 1\ni != 6 ?    →     CMP R2, 6\nwhile ...   →     BNE loop  ← 6でなければ戻る\n\nHALT命令でループを抜けた後にプログラムを停止します。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                // Assembly\nsum = 0;    →   MOV R1, 0\ni = 1;      →   MOV R2, 1\n            →   loop:\nsum += i;   →     ADD R1, R1, R2\ni++;        →     ADD R2, R2, 1\ni != 6 ?    →     CMP R2, 6\nwhile ...   →     BNE loop\n\nUse HALT after the loop to stop the program.',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 0\nMOV R2, 1\nloop:\nADD R1, R1, R2\nADD R2, R2, 1\nCMP R2, 6\nBNE loop\nHALT',
      en: 'MOV R1, 0\nMOV R2, 1\nloop:\nADD R1, R1, R2\nADD R2, R2, 1\nCMP R2, 6\nBNE loop\nHALT',
    },
  ],
}
