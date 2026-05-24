import type { Stage } from '../../../core/stages/types.ts'

export const stage10: Stage = {
  id: 'c2-s10-copy',
  chapter: 2,
  order: 10,
  title: { ja: 'コピー', en: 'Copy' },
  objective: { ja: '[0x20..0x22] の 3 要素を [0x30..0x32] へコピーせよ', en: 'Copy the 3 elements at [0x20..0x22] to [0x30..0x32]' },

  initialMemory: [
    { address: 0x20, value: 1 },
    { address: 0x21, value: 2 },
    { address: 0x22, value: 3 },
  ],
  initialSource: '',

  successConditions: [
    { type: 'memory', address: 0x30, expected: 1 },
    { type: 'memory', address: 0x31, expected: 2 },
    { type: 'memory', address: 0x32, expected: 3 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'STORE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `コピーは、完璧であっても、コピーだと知っている。

メモリ上で値を複製しても、元の値は減らない。
増えてもいない。同じ数字が、別の場所に現れるだけだ。

これが、計算機の素直さでもある。
人の記憶は、思い出すたびに少しずつ書き換わるという。`,
        marginNote: `このノートが、誰かの手に届いたとして。
その人は、これを読んだことを誰かに話すだろうか。`,
      },
      {
        body: `章の最後の問題だ。
ここまでの全部 — アドレス、レジスタ、配列 — を組み合わせる。

3 要素しかないから、ベタに書いてかまわない。
ただし、もし要素が増えたらどうするか、
頭の片隅に置いておいてほしい。

その答えは、次の章にある。`,
      },
    ],
    en: [
      {
        body: `A copy, however perfect, knows it is a copy.

Duplicating a value in memory takes nothing from the source.
Nothing is added either. The same number appears in a second place.

This is the machine's honesty.
Human memory, they say, is rewritten a little each time it's recalled.`,
        marginNote: `If this notebook ever reached someone.
Would they tell anyone they had read it?`,
      },
      {
        body: `The last problem of the chapter.
Everything so far — addresses, registers, arrays — comes together.

With only three elements, writing it out is fine.
But hold the question in the back of your mind:
what if there were more?

The answer waits in the next chapter.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '各要素について 1 回ずつ、LOAD と STORE を組にして書きます。\n3 回分です。',
      en: 'For each element, write one LOAD/STORE pair.\nThree pairs in all.',
    },
    {
      kind: 'hint',
      ja: 'ベースアドレスをレジスタに入れておくと、オフセットで楽に書けます：\n\nMOV   R2, 0x20       ; 元配列のベース\nMOV   R3, 0x30       ; 先配列のベース\nLOAD  R1, [R2]\nSTORE R1, [R3]\nLOAD  R1, [R2 + 1]\nSTORE R1, [R3 + 1]\nLOAD  R1, [R2 + 2]\nSTORE R1, [R3 + 2]',
      en: 'Keep the base address in a register to use offsets cleanly:\n\nMOV   R2, 0x20       ; source base\nMOV   R3, 0x30       ; destination base\nLOAD  R1, [R2]\nSTORE R1, [R3]\nLOAD  R1, [R2 + 1]\nSTORE R1, [R3 + 1]\nLOAD  R1, [R2 + 2]\nSTORE R1, [R3 + 2]',
    },
    {
      kind: 'answer',
      ja: 'MOV   R2, 0x20\nMOV   R3, 0x30\nLOAD  R1, [R2]\nSTORE R1, [R3]\nLOAD  R1, [R2 + 1]\nSTORE R1, [R3 + 1]\nLOAD  R1, [R2 + 2]\nSTORE R1, [R3 + 2]',
      en: 'MOV   R2, 0x20\nMOV   R3, 0x30\nLOAD  R1, [R2]\nSTORE R1, [R3]\nLOAD  R1, [R2 + 1]\nSTORE R1, [R3 + 1]\nLOAD  R1, [R2 + 2]\nSTORE R1, [R3 + 2]',
    },
  ],
}
