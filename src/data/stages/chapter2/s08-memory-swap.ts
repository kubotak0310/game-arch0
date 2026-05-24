import type { Stage } from '../../../core/stages/types.ts'

export const stage8: Stage = {
  id: 'c2-s08-memory-swap',
  chapter: 2,
  order: 8,
  title: { ja: '値を交換', en: 'Swap in Memory' },
  objective: { ja: '[0x10] と [0x20] の値を入れ替えよ', en: 'Swap the values at [0x10] and [0x20]' },

  initialMemory: [
    { address: 0x10, value: 7 },
    { address: 0x20, value: 13 },
  ],
  initialSource: '',

  successConditions: [
    { type: 'memory', address: 0x10, expected: 13 },
    { type: 'memory', address: 0x20, expected: 7 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'STORE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `第 1 章で R0 と R1 を入れ替えた。あの時と同じ理屈だ。
直接交換はできない。第 3 の場所が要る。

ただし今度はメモリだ。
2 つのメモリアドレスを入れ替えるには、
両方の値を一度レジスタへ持ち上げる必要がある。

  LOAD  R0, [0x10]
  LOAD  R1, [0x20]
  STORE R1, [0x10]
  STORE R0, [0x20]

レジスタは「中継地点」として働く。`,
      },
    ],
    en: [
      {
        body: `In chapter 1, R0 and R1 were swapped. The same idea here.
You cannot exchange directly. A third place is required.

Only now the third place is a register, and the two ends are memory.
Both values must be lifted into registers first.

  LOAD  R0, [0x10]
  LOAD  R1, [0x20]
  STORE R1, [0x10]
  STORE R0, [0x20]

The registers serve as the waypoint.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '直接 LOAD/STORE で「行き先と元」を交換することはできません。\n両方の値をいったんレジスタに読み込んでから、書き戻します。',
      en: 'You cannot just swap two memory cells with LOAD/STORE alone.\nLift both values into registers first, then write them back swapped.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                          // アセンブラ\nint a = mem[0x10];          →     LOAD  R0, [0x10]\nint b = mem[0x20];          →     LOAD  R1, [0x20]\nmem[0x10] = b;              →     STORE R1, [0x10]\nmem[0x20] = a;              →     STORE R0, [0x20]',
      en: 'Here is the C-to-assembly mapping:\n\n// C                             // Assembly\nint a = mem[0x10];          →     LOAD  R0, [0x10]\nint b = mem[0x20];          →     LOAD  R1, [0x20]\nmem[0x10] = b;              →     STORE R1, [0x10]\nmem[0x20] = a;              →     STORE R0, [0x20]',
    },
    {
      kind: 'answer',
      ja: 'LOAD  R0, [0x10]\nLOAD  R1, [0x20]\nSTORE R1, [0x10]\nSTORE R0, [0x20]',
      en: 'LOAD  R0, [0x10]\nLOAD  R1, [0x20]\nSTORE R1, [0x10]\nSTORE R0, [0x20]',
    },
  ],
}
