import type { Stage } from '../../../core/stages/types.ts'

export const stage3: Stage = {
  id: 'c2-s03-move',
  chapter: 2,
  order: 3,
  title: { ja: '値を移す', en: 'Move a Value' },
  objective: { ja: '[0x10] の値を [0x20] へコピーせよ', en: 'Copy the value at [0x10] to [0x20]' },

  initialMemory: [
    { address: 0x10, value: 5 },
  ],
  initialSource: '',

  successConditions: [
    { type: 'memory', address: 0x20, expected: 5 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'STORE' },
  ],

  unlockedInstructions: ['MOV', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `メモリからメモリへ、直接は運べない。
レジスタを必ず経由する。

これは ARCH-0 だけの話ではない。
多くの計算機が、同じ制約を持っている。
通り道を強制することで、設計が簡単になる。

「移す」と書いたが、元の値は減らない。
計算機はコピーしか知らない。`
      },
    ],
    en: [
      {
        body: `You cannot move from memory to memory directly.
A register has to sit between them.

This is not just ARCH-0.
Many machines have the same restriction.
Forcing a path through registers simplifies the design.

I wrote "move," but the source is unchanged.
The machine only knows how to copy.`
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '2 ステップに分けます：\n  ① LOAD で [0x10] の値をレジスタへ\n  ② STORE でそのレジスタを [0x20] へ書く',
      en: 'Break it into two steps:\n  ① LOAD the value at [0x10] into a register\n  ② STORE that register to [0x20]',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                    // アセンブラ\nmem[0x20] = mem[0x10];  →  LOAD  R1, [0x10]\n                           STORE R1, [0x20]',
      en: 'Here is the C-to-assembly mapping:\n\n// C                       // Assembly\nmem[0x20] = mem[0x10];  →  LOAD  R1, [0x10]\n                           STORE R1, [0x20]',
    },
    {
      kind: 'answer',
      ja: 'LOAD R1, [0x10]\nSTORE R1, [0x20]',
      en: 'LOAD R1, [0x10]\nSTORE R1, [0x20]',
    },
  ],
}
