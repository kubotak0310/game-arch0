import type { Stage } from '../../../core/stages/types.ts'

export const stage4: Stage = {
  id: 'c2-s04-add-and-store',
  chapter: 2,
  order: 4,
  title: { ja: '計算して保存', en: 'Calculate and Store' },
  objective: { ja: '[0x10] と [0x11] の合計を [0x20] に保存せよ', en: 'Store the sum of [0x10] and [0x11] into [0x20]' },

  initialMemory: [
    { address: 0x10, value: 3 },
    { address: 0x11, value: 4 },
  ],
  initialSource: '',

  successConditions: [
    { type: 'memory', address: 0x20, expected: 7 },
    { type: 'instruction_used', op: 'ADD' },
    { type: 'instruction_used', op: 'STORE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `計算機の仕事は、いつも同じ形だ。

  読む  →  計算する  →  書く

メモリから読み、レジスタの中で計算し、メモリへ戻す。
これを何度も繰り返すことで、複雑な処理が成立する。

ARCH-0 はその最小の形を見せている。`
      },
    ],
    en: [
      {
        body: `A machine's work always has the same shape.

  read  →  compute  →  write

Read from memory, compute in a register, write back to memory.
Repeating this is what makes complex processing work.

ARCH-0 shows that shape at its smallest.`
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '手順は3段階です：\n  ① 2つの値をそれぞれレジスタに LOAD\n  ② レジスタ上で ADD\n  ③ 結果を STORE',
      en: 'Three steps:\n  ① LOAD each value into a register\n  ② ADD them in registers\n  ③ STORE the result',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                                  // アセンブラ\nmem[0x20] = mem[0x10] + mem[0x11];  →    LOAD  R1, [0x10]\n                                         LOAD  R2, [0x11]\n                                         ADD   R3, R1, R2\n                                         STORE R3, [0x20]',
      en: 'Here is the C-to-assembly mapping:\n\n// C                                     // Assembly\nmem[0x20] = mem[0x10] + mem[0x11];  →    LOAD  R1, [0x10]\n                                         LOAD  R2, [0x11]\n                                         ADD   R3, R1, R2\n                                         STORE R3, [0x20]',
    },
    {
      kind: 'answer',
      ja: 'LOAD  R1, [0x10]\nLOAD  R2, [0x11]\nADD   R3, R1, R2\nSTORE R3, [0x20]',
      en: 'LOAD  R1, [0x10]\nLOAD  R2, [0x11]\nADD   R3, R1, R2\nSTORE R3, [0x20]',
    },
  ],
}
