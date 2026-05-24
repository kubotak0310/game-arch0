import type { Stage } from '../../../core/stages/types.ts'

export const stage2: Stage = {
  id: 'c3-s02-array-sum',
  chapter: 3,
  order: 2,
  title: { ja: '配列の合計', en: 'Sum an Array' },
  objective: { ja: '0x20 から始まる 5 要素の配列の合計を [0x30] に保存せよ', en: 'Sum the 5-element array starting at 0x20 and store the result at [0x30]' },

  initialMemory: [
    { address: 0x20, value: 10 },
    { address: 0x21, value: 20 },
    { address: 0x22, value: 30 },
    { address: 0x23, value: 40 },
    { address: 0x24, value: 50 },
  ],
  initialSource: 'MOV R1, 0x20\n',

  successConditions: [
    { type: 'memory', address: 0x30, expected: 150 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'STORE' },
    { type: 'instruction_used', op: 'BNE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'JMP', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: '前章では 3 要素を手で 3 回書きました。今回は 5 要素ですが、ループで書きます。\n必要なものは：\n  ・ベースアドレス（initialSource で R1 に入っています）\n  ・カウンタ（残り要素数）\n  ・合計を貯める変数',
      en: 'The previous chapter unrolled 3 elements by hand. Now there are 5, but we use a loop.\nWhat you need:\n  ・Base address (R1 is set in initialSource)\n  ・Counter (remaining elements)\n  ・Accumulator for the sum',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                          // アセンブラ\nuint16_t *p = (uint16_t*)0x20;  →  MOV R1, 0x20    ; (initialSource)\nint count = 5;                  →  MOV R2, 5\nint sum = 0;                    →  MOV R0, 0\ndo {                            →  loop:\n    sum += *p;                  →    LOAD R3, [R1]\n                                →    ADD R0, R0, R3\n    p++;                        →    ADD R1, R1, 1\n    count--;                    →    SUB R2, R2, 1\n} while (count != 0);           →    CMP R2, 0\n                                →    BNE loop\nmem[0x30] = sum;                →  STORE R0, [0x30]',
      en: 'Here is the C-to-assembly mapping:\n\n// C                              // Assembly\nuint16_t *p = (uint16_t*)0x20;  →  MOV R1, 0x20    ; (initialSource)\nint count = 5;                  →  MOV R2, 5\nint sum = 0;                    →  MOV R0, 0\ndo {                            →  loop:\n    sum += *p;                  →    LOAD R3, [R1]\n                                →    ADD R0, R0, R3\n    p++;                        →    ADD R1, R1, 1\n    count--;                    →    SUB R2, R2, 1\n} while (count != 0);           →    CMP R2, 0\n                                →    BNE loop\nmem[0x30] = sum;                →  STORE R0, [0x30]',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 0x20\nMOV R2, 5\nMOV R0, 0\nloop:\nLOAD R3, [R1]\nADD R0, R0, R3\nADD R1, R1, 1\nSUB R2, R2, 1\nCMP R2, 0\nBNE loop\nSTORE R0, [0x30]\nHALT',
      en: 'MOV R1, 0x20\nMOV R2, 5\nMOV R0, 0\nloop:\nLOAD R3, [R1]\nADD R0, R0, R3\nADD R1, R1, 1\nSUB R2, R2, 1\nCMP R2, 0\nBNE loop\nSTORE R0, [0x30]\nHALT',
    },
  ],
}
