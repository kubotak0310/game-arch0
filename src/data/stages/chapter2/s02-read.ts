import type { Stage } from '../../../core/stages/types.ts'

export const stage2: Stage = {
  id: 'c2-s02-read',
  chapter: 2,
  order: 2,
  title: { ja: '値を読む', en: 'Read a Value' },
  objective: { ja: 'メモリアドレス 0x10 の値を R1 に読み込め', en: 'Read the value at [0x10] into R1' },

  initialMemory: [
    { address: 0x10, value: 7 },
  ],
  initialSource: '',

  successConditions: [
    { type: 'register', target: 'R1', expected: 7 },
    { type: 'instruction_used', op: 'LOAD' },
  ],

  unlockedInstructions: ['MOV', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `LOAD はメモリの値をレジスタへ運ぶ。
書き込みと違って、読み込みでメモリは何も失わない。

書いた値は、上書きされない限り、ずっとそこにある。
電源が切れない限り、と言うべきかもしれない。

ARCH-0 のメモリは電源と共に消える。
本物の不揮発記憶のことは、別の機会に考えよう。`,
      },
    ],
    en: [
      {
        body: `LOAD carries a value from memory into a register.
Unlike a write, a read takes nothing away from memory.

Once written, a value sits there until overwritten.
"As long as the power stays on," I should perhaps add.

ARCH-0's memory vanishes when the power dies.
Non-volatile storage is a thought for another day.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'LOAD 命令を使います。\nメモリの「住所」を指定して、レジスタに値を読み込みます。\n\n例: LOAD R1, [0x10]',
      en: 'Use LOAD.\nSpecify the memory address and read its value into a register.\n\nExample: LOAD R1, [0x10]',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語             // アセンブラ\nint x = mem[0x10]; → LOAD R1, [0x10]\n\nメモリは初期状態で [0x10] = 7 になっています。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                // Assembly\nint x = mem[0x10]; → LOAD R1, [0x10]\n\nMemory starts with [0x10] = 7.',
    },
    {
      kind: 'answer',
      ja: 'LOAD R1, [0x10]',
      en: 'LOAD R1, [0x10]',
    },
  ],
}
