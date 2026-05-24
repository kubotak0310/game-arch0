import type { Stage } from '../../../core/stages/types.ts'

export const stage5: Stage = {
  id: 'c2-s05-pointer',
  chapter: 2,
  order: 5,
  title: { ja: 'ポインタ', en: 'Pointer' },
  objective: { ja: 'R1 が指すアドレスの値を R0 に読み込め', en: 'Read the value at the address held in R1 into R0' },

  initialMemory: [
    { address: 0x30, value: 99 },
  ],
  initialSource: 'MOV R1, 0x30\n',

  successConditions: [
    { type: 'register', target: 'R0', expected: 99 },
    { type: 'instruction_used', op: 'LOAD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `アドレスは、誰かを呼ぶときの名前のようなものだ。

[0x30] と直接書くこともできるが、
レジスタに「住所」を入れて、それを通して読むこともできる。

LOAD R0, [R1]   ; R1 が指している場所から読む

これがポインタの最初の姿だ。
アドレス自身が、変数として扱える。`,
      },
      {
        body: `住所を変数にできると、何が変わるか。

同じ命令で、違う場所にアクセスできるようになる。
R1 の値を 0x30 から 0x38 に変えれば、
LOAD R0, [R1] は別の場所から読み始める。

「どこを読むか」を、実行時に決められる。
これが、配列やループの土台になる。

住所を変数にする、という発想を初めて思いついたとき、どこか背筋が伸びた。`
      },
    ],
    en: [
      {
        body: `An address is like a name you call someone by.

You can write [0x30] directly,
or put the "address" in a register and read through it.

LOAD R0, [R1]   ; read from the place R1 points to

This is the first shape of a pointer.
The address itself can be treated as a variable.`,
      },
      {
        body: `What changes when an address becomes a variable?

The same instruction can reach different places.
Change R1 from 0x30 to 0x38,
and LOAD R0, [R1] reads from somewhere else.

You decide where to read at runtime, not before.
This is the ground beneath arrays and loops.

When I first grasped the idea of treating an address as a variable, something clicked.`
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '冒頭の MOV R1, 0x30 で、R1 にアドレス 0x30 が入ります。\nそのあと LOAD で「R1 が指す場所」から値を取ってきます。\n\n例: LOAD R0, [R1]',
      en: 'The opening MOV R1, 0x30 places the address 0x30 into R1.\nThen use LOAD to read from where R1 points.\n\nExample: LOAD R0, [R1]',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語              // アセンブラ\nint *p = ...;     →   （R1 が p に相当）\nint r1 = *p;      →   LOAD R0, [R1]\n\n[R1] は「R1 が指している場所」という意味です。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                 // Assembly\nint *p = ...;     →   (R1 plays the role of p)\nint r1 = *p;      →   LOAD R0, [R1]\n\n[R1] means "the place R1 points to."',
    },
    {
      kind: 'answer',
      ja: 'MOV  R1, 0x30\nLOAD R0, [R1]',
      en: 'MOV  R1, 0x30\nLOAD R0, [R1]',
    },
  ],
}
