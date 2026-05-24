import type { Stage } from '../../../core/stages/types.ts'

export const stage5: Stage = {
  id: 'c2-s05-pointer',
  chapter: 2,
  order: 5,
  title: { ja: 'ポインタ', en: 'Pointer' },
  objective: { ja: 'R2 が指すアドレスの値を R1 に読み込め', en: 'Read the value at the address held in R2 into R1' },

  initialMemory: [
    { address: 0x30, value: 99 },
  ],
  initialSource: 'MOV R2, 0x30\n',

  successConditions: [
    { type: 'register', target: 'R1', expected: 99 },
    { type: 'instruction_used', op: 'LOAD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `アドレスは、誰かを呼ぶときの名前のようなものだ。

[0x30] と直接書くこともできるが、
レジスタに「住所」を入れて、それを通して読むこともできる。

LOAD R1, [R2]   ; R2 が指している場所から読む

これがポインタの最初の姿だ。
アドレス自身が、変数として扱える。`,
      },
      {
        body: `住所を変数にできると、何が変わるか。

同じ命令で、違う場所にアクセスできるようになる。
R2 の値を 0x30 から 0x38 に変えれば、
LOAD R1, [R2] は別の場所から読み始める。

「どこを読むか」を、実行時に決められる。
これが、配列やループの土台になる。`
      },
    ],
    en: [
      {
        body: `An address is like a name you call someone by.

You can write [0x30] directly,
or put the "address" in a register and read through it.

LOAD R1, [R2]   ; read from the place R2 points to

This is the first shape of a pointer.
The address itself can be treated as a variable.`,
      },
      {
        body: `What changes when an address becomes a variable?

The same instruction can reach different places.
Change R2 from 0x30 to 0x38,
and LOAD R1, [R2] reads from somewhere else.

You decide where to read at runtime, not before.
This is the ground beneath arrays and loops.`
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '冒頭の MOV R2, 0x30 で、R2 にアドレス 0x30 が入ります。\nそのあと LOAD で「R2 が指す場所」から値を取ってきます。\n\n例: LOAD R1, [R2]',
      en: 'The opening MOV R2, 0x30 places the address 0x30 into R2.\nThen use LOAD to read from where R2 points.\n\nExample: LOAD R1, [R2]',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語              // アセンブラ\nint *p = ...;     →   （R2 が p に相当）\nint r1 = *p;      →   LOAD R1, [R2]\n\n[R2] は「R2 が指している場所」という意味です。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                 // Assembly\nint *p = ...;     →   (R2 plays the role of p)\nint r1 = *p;      →   LOAD R1, [R2]\n\n[R2] means "the place R2 points to."',
    },
    {
      kind: 'answer',
      ja: 'MOV  R2, 0x30\nLOAD R1, [R2]',
      en: 'MOV  R2, 0x30\nLOAD R1, [R2]',
    },
  ],
}
