import type { Stage } from '../../../core/stages/types.ts'

export const stage6: Stage = {
  id: 'c2-s06-array-element',
  chapter: 2,
  order: 6,
  title: { ja: '配列の要素', en: 'Array Element' },
  objective: { ja: 'R1 を先頭アドレスとして、配列の 3 番目の要素を R2 に読み込め', en: 'Using R1 as the base address, read the 3rd element into R2' },

  initialMemory: [
    { address: 0x20, value: 10 },
    { address: 0x21, value: 20 },
    { address: 0x22, value: 30 },
  ],
  initialSource: 'MOV R1, 0x20\n',

  successConditions: [
    { type: 'register', target: 'R2', expected: 30 },
    { type: 'instruction_used', op: 'LOAD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `配列とは、連続したメモリにすぎない。

[0x20] = 10
[0x21] = 20
[0x22] = 30

3 つの値が並んでいるだけ。
これを「配列」と呼ぶのは、人間の都合だ。

先頭アドレスと、何番目かが分かれば、どの要素にも届く。

  LOAD R2, [R1 + 2]   ; R1 が先頭、+2 で 3 番目`,
      },
    ],
    en: [
      {
        body: `An array is nothing more than consecutive memory.

[0x20] = 10
[0x21] = 20
[0x22] = 30

Three values lined up.
Calling them an "array" is for human convenience.

Given a base address and an index, you can reach any element.

  LOAD R2, [R1 + 2]   ; R1 is the base, +2 reaches the 3rd`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '[Rs + n] という記法で、ベースアドレス + オフセット を一度に指定できます。\nオフセットは 0 から数えるので、3 番目の要素は +2 です。\n\n例: LOAD R2, [R1 + 2]',
      en: 'The [Rs + n] form lets you specify base + offset in one go.\nOffsets count from 0, so the 3rd element is +2.\n\nExample: LOAD R2, [R1 + 2]',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語         // アセンブラ\nint *p = ...;  → MOV  R1, 0x20   ; R1 が p に相当\nint x = p[2];  → LOAD R2, [R1 + 2]\n\np[2] = *(p + 2) と同じです。',
      en: 'Here is the C-to-assembly mapping:\n\n// C            // Assembly\nint *p = ...;  → MOV  R1, 0x20   ; R1 plays the role of p\nint x = p[2]; →  LOAD R2, [R1 + 2]\n\np[2] is the same as *(p + 2).',
    },
    {
      kind: 'answer',
      ja: 'MOV  R1, 0x20\nLOAD R2, [R1 + 2]',
      en: 'MOV  R1, 0x20\nLOAD R2, [R1 + 2]',
    },
  ],
}
