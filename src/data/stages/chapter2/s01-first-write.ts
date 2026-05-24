import type { Stage } from '../../../core/stages/types.ts'

export const stage1: Stage = {
  id: 'c2-s01-first-write',
  chapter: 2,
  order: 1,
  title: { ja: 'はじめての書き込み', en: 'First Write' },
  objective: { ja: 'メモリアドレス 0x10 に 42 を書き込め', en: 'Write 42 to memory address 0x10' },

  initialMemory: [],
  initialSource: '',

  successConditions: [
    { type: 'memory', address: 0x10, expected: 42 },
    { type: 'instruction_used', op: 'STORE' },
  ],

  unlockedInstructions: ['MOV', 'STORE', 'HALT'],

  interlude: {
    ja: [
      {
        date: '1987 年 春',
        body: `レジスタは速いが、6 つしかない。
複雑なことをするには、もっと多くの場所が必要だ。

メモリは ARCH-0 の外にある、広い記憶域だ。
ARCH-0 では 0x00 から 0x3F まで、64 個の格納箱がある。
それぞれの箱に、1 つの数値が入る。

書いたものは、残る。
読む人が現れるまで、ずっとそこにある。`,
      },
      {
        body: `レジスタと違って、メモリへのアクセスには専用の命令がいる。

STORE — レジスタの値を、メモリへ書き込む。
LOAD  — メモリの値を、レジスタへ読み込む。

書く前に住所を指定する。
それが [0x10] のような角括弧の意味だ。`,
      },
      {
        body: `MOV は「レジスタとレジスタ」の命令だった。
STORE/LOAD は「レジスタとメモリ」の命令だ。

MOV   R1, R2      → R2 の値を R1 にコピー  （メモリ使わない）
STORE R1, [0x10]  → R1 の値をメモリへ書く
LOAD  R1, [0x10]  → メモリの値を R1 へ読む

[ ] の中がアドレスだ。
数値でも、レジスタでも指定できる。`
      },
    ],
    en: [
      {
        date: 'Spring, 1987',
        body: `Registers are fast, but there are only six of them.
Doing anything complex needs more places.

Memory lies outside ARCH-0 — a wide store of cells.
In ARCH-0, there are 64 slots from 0x00 to 0x3F,
each one holding a single number.

What is written stays.
It waits there until someone reads it.`,
      },
      {
        body: `Unlike registers, memory needs dedicated instructions.

STORE — write a register's value into memory.
LOAD  — read a value from memory into a register.

You specify the address first.
That is what the square brackets in [0x10] mean.`,
      },
      {
        body: `MOV moved values between registers.
STORE and LOAD move values between registers and memory.

MOV   R1, R2      → copy R2 into R1         (no memory involved)
STORE R1, [0x10]  → write R1 into memory
LOAD  R1, [0x10]  → read from memory into R1

The address goes inside [ ].
It can be a number or a register.`
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'STORE 命令を使います。\n書き込みたい値をまずレジスタに入れて、\nそれをメモリへ「住所付き」で送ります。\n\n例: STORE R1, [0x10]',
      en: 'Use STORE.\nFirst put the value in a register,\nthen send it to memory with an address.\n\nExample: STORE R1, [0x10]',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語              // アセンブラ\nmem[0x10] = 42;  →   MOV   R1, 42\n                     STORE R1, [0x10]\n\n値をレジスタ経由でメモリに置きます。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                 // Assembly\nmem[0x10] = 42;  →   MOV   R1, 42\n                     STORE R1, [0x10]\n\nThe value goes through a register on its way to memory.',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 42\nSTORE R1, [0x10]',
      en: 'MOV R1, 42\nSTORE R1, [0x10]',
    },
  ],
}
