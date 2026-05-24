import type { Stage } from '../../../core/stages/types.ts'

export const stage7: Stage = {
  id: 'c2-s07-array-sum',
  chapter: 2,
  order: 7,
  title: { ja: '配列を読む', en: 'Read an Array' },
  objective: { ja: 'R0 が指す配列の 3 要素を合計し、[0x30] に保存せよ', en: 'Sum the 3 elements pointed to by R0, store the result at [0x30]' },

  initialMemory: [
    { address: 0x20, value: 11 },
    { address: 0x21, value: 22 },
    { address: 0x22, value: 33 },
  ],
  initialSource: 'MOV R0, 0x20\n',

  successConditions: [
    { type: 'memory', address: 0x30, expected: 66 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'STORE' },
    { type: 'instruction_used', op: 'ADD' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `配列の要素を 1 つずつ読み、合計を作る。
今は 3 つだから、3 回 LOAD すればいい。

  LOAD R1, [R0]       ; 1 番目
  LOAD R2, [R0 + 1]   ; 2 番目
  LOAD R3, [R0 + 2]   ; 3 番目

しかし、もし要素が 100 個だったら？
100 回書くのは、さすがに違う気がする。

だが、繰り返しの命令は次の章に譲る。
ここでは 3 回、丁寧に書いて、配列の感触を確かめる。

3 つなら書ける。10 になったとき、自分が少し心配だ。`
      },
    ],
    en: [
      {
        body: `Read each element of the array, build a sum.
With three elements, three LOADs are enough.

  LOAD R1, [R0]       ; first
  LOAD R2, [R0 + 1]   ; second
  LOAD R3, [R0 + 2]   ; third

But what if there were a hundred?
Writing the same thing a hundred times feels wrong.

Still, the repeat instruction belongs to the next chapter.
For now, write it out three times, carefully — and get a feel for the array.

Three is manageable. I worry a little about myself when it reaches ten.`
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '今回は要素が 3 つなので、ループは使わずに展開して書きます：\n  ① 各要素を別々のレジスタに LOAD\n  ② 順番に ADD で足す\n  ③ 結果を STORE',
      en: 'With only 3 elements, write it out without a loop:\n  ① LOAD each into its own register\n  ② ADD them in sequence\n  ③ STORE the result',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                              // アセンブラ\nint *p = ...;                   →     MOV   R0, 0x20       ; R0 が p\nint sum = p[0] + p[1] + p[2];   →     LOAD  R1, [R0]\n                                      LOAD  R2, [R0 + 1]\n                                      LOAD  R3, [R0 + 2]\n                                      ADD   R1, R1, R2\n                                      ADD   R1, R1, R3\nmem[0x30] = sum;                →     STORE R1, [0x30]',
      en: 'Here is the C-to-assembly mapping:\n\n// C                                 // Assembly\nint *p = ...;                   →     MOV   R0, 0x20       ; R0 plays p\nint sum = p[0] + p[1] + p[2];   →     LOAD  R1, [R0]\n                                      LOAD  R2, [R0 + 1]\n                                      LOAD  R3, [R0 + 2]\n                                      ADD   R1, R1, R2\n                                      ADD   R1, R1, R3\nmem[0x30] = sum;                →     STORE R1, [0x30]',
    },
    {
      kind: 'answer',
      ja: 'MOV   R0, 0x20\nLOAD  R1, [R0]\nLOAD  R2, [R0 + 1]\nLOAD  R3, [R0 + 2]\nADD   R1, R1, R2\nADD   R1, R1, R3\nSTORE R1, [0x30]',
      en: 'MOV   R0, 0x20\nLOAD  R1, [R0]\nLOAD  R2, [R0 + 1]\nLOAD  R3, [R0 + 2]\nADD   R1, R1, R2\nADD   R1, R1, R3\nSTORE R1, [0x30]',
    },
  ],
}
