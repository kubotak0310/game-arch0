import type { Stage } from '../../../core/stages/types.ts'

export const stage5: Stage = {
  id: 'c3-s05-array-max',
  chapter: 3,
  order: 5,
  title: { ja: '配列の最大値', en: 'Maximum of an Array' },
  objective: { ja: '0x20 から始まる 5 要素の配列の最大値を R0 に格納せよ', en: 'Find the maximum of the 5-element array at 0x20 and store it in R0' },

  initialMemory: [
    { address: 0x20, value: 7 },
    { address: 0x21, value: 23 },
    { address: 0x22, value: 5 },
    { address: 0x23, value: 19 },
    { address: 0x24, value: 12 },
  ],
  initialSource: 'MOV R1, 0x20\n',

  successConditions: [
    { type: 'register', target: 'R0', expected: 23 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'BGE' },
    { type: 'instruction_used', op: 'BNE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'S02 のループパターンと、S04 の「大きい方を取る」パターンの組み合わせです。\n\n仮の最大値を 0 にしておき、ループの中で各要素と比較し、\n大きければ更新します。',
      en: 'Combine the loop pattern from S02 with the "take the larger" pattern from S04.\n\nInitialize the tentative max to 0, then in the loop, compare with each element\nand update if larger.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                              // アセンブラ\nuint16_t *p = (uint16_t*)0x20;  →    MOV R1, 0x20    ; (initialSource)\nint count = 5;                  →    MOV R2, 5\nint max = 0;                    →    MOV R0, 0\ndo {                            →    loop:\n    int v = *p;                 →      LOAD R3, [R1]\n    if (v > max)                →      CMP R0, R3\n                                       BGE skip       ; R0 >= R3 ならスキップ\n        max = v;                →      MOV R0, R3\n                                       skip:\n    p++;                        →      ADD R1, R1, 1\n    count--;                    →      SUB R2, R2, 1\n} while (count != 0);           →      CMP R2, 0\n                                       BNE loop',
      en: 'Here is the C-to-assembly mapping:\n\n// C                                  // Assembly\nuint16_t *p = (uint16_t*)0x20;  →    MOV R1, 0x20    ; (initialSource)\nint count = 5;                  →    MOV R2, 5\nint max = 0;                    →    MOV R0, 0\ndo {                            →    loop:\n    int v = *p;                 →      LOAD R3, [R1]\n    if (v > max)                →      CMP R0, R3\n                                       BGE skip       ; if R0 >= R3, skip\n        max = v;                →      MOV R0, R3\n                                       skip:\n    p++;                        →      ADD R1, R1, 1\n    count--;                    →      SUB R2, R2, 1\n} while (count != 0);           →      CMP R2, 0\n                                       BNE loop',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 0x20\nMOV R2, 5\nMOV R0, 0\nloop:\nLOAD R3, [R1]\nCMP R0, R3\nBGE skip\nMOV R0, R3\nskip:\nADD R1, R1, 1\nSUB R2, R2, 1\nCMP R2, 0\nBNE loop\nHALT',
      en: 'MOV R1, 0x20\nMOV R2, 5\nMOV R0, 0\nloop:\nLOAD R3, [R1]\nCMP R0, R3\nBGE skip\nMOV R0, R3\nskip:\nADD R1, R1, 1\nSUB R2, R2, 1\nCMP R2, 0\nBNE loop\nHALT',
    },
  ],
}
