import type { Stage } from '../../../core/stages/types.ts'

export const stage1: Stage = {
  id: 'c1-s01-first-value',
  chapter: 1,
  order: 1,
  title: { ja: 'はじめての値', en: 'First Value' },
  objective: { ja: 'R1 に 2 を、R2 に 3 を格納せよ', en: 'Store 2 in R1 and 3 in R2' },

  initialRegisters: {},
  initialMemory: [],

  successConditions: [
    { type: 'register',          target: 'R1', expected: 2 },
    { type: 'register',          target: 'R2', expected: 3 },
    { type: 'instruction_used', op: 'MOV' },
  ],

  unlockedInstructions: ['MOV', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'MOV命令を使います。\n例: MOV R1, 2',
      en: 'Use the MOV instruction.\nExample: MOV R1, 2',
    },
    {
      kind: 'hint',
      ja: 'R2にも同じパターンで書いてみましょう。\nMOV R2, 3',
      en: 'Write the same pattern for R2.\nMOV R2, 3',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 2\nMOV R2, 3',
      en: 'MOV R1, 2\nMOV R2, 3',
    },
  ],

  interlude: {
    ja: [
      {
        date: '1986 年 春',
        body: `ARCH-0 という名前は、私が勝手につけた。
意味はない。アーキテクチャの「アーチ」と、
何もないところから始めるという意味の「ゼロ」。

これは独自の CPU の設計ノートである。
誰かに見せるつもりはない。ただ書く。

学生に何かを教えるとき、私はよく遠回りをする。
最短距離だけを示しても、何も伝わらない気がする。
このノートも、たぶん遠回りになる。`,
      },
      {
        body: `ARCH-0 には、5つのレジスタがある。
R0 から R4 と名付けた。

レジスタとは、CPU 内部の記憶域だ。
1つのレジスタに、1つの数値を保持する。
演算のたびに、ここへ値を出し入れする。

5つは決して多くない。
複雑な処理では、すぐに足りなくなる。
だから後の章で、メモリやスタックを使う。`,
        diagram: 'registers' as const,
      },
      {
        body: `数の書き方は、2通りある。

MOV R1, 16    ; 10進数
MOV R1, 0x10  ; 16進数

どちらも同じ意味だ。
0x から始まるのが16進数表記。

値の書き方に厳密なルールはない。
ただ、アドレスを 16進数で書くのは長年の慣習だ。
あなたも、そうするといい。`,
      },
    ],
    en: [
      {
        date: 'Spring, 1986',
        body: `I gave it the name ARCH-0 myself.
It means nothing — the "arch" of architecture,
and "zero" for starting from nothing.

This is the design notebook for a CPU of my own making.
I have no plans to show it to anyone. I just write.

When I teach my students, I tend to take detours.
Showing only the shortest path, I feel nothing carries.
This notebook, too, will probably be a detour.`,
      },
      {
        body: `ARCH-0 has five registers.
I named them R0 through R4.

A register is a storage cell inside the CPU.
Each one holds a single value.
Every operation reads from and writes to these.

Five is not many.
Complex work runs out of room quickly.
That is why later chapters introduce memory and the stack.`,
        diagram: 'registers' as const,
      },
      {
        body: `Numbers can be written two ways.

MOV R1, 16    ; decimal
MOV R1, 0x10  ; hexadecimal

Both mean the same thing.
Anything starting with 0x is hexadecimal.

There is no strict rule on how to write numbers.
But writing addresses in hex is a long-standing convention.
You should do the same.`,
      },
    ],
  },
}
