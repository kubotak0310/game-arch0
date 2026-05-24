import type { Stage } from '../../../core/stages/types.ts'

export const stage5: Stage = {
  id: 'c3-s05-array-max',
  chapter: 3,
  order: 5,
  title: { ja: '配列の最大値', en: 'Maximum of an Array' },
  objective: { ja: '0x20 から始まる 5 要素の配列の最大値を R1 に格納せよ', en: 'Find the maximum of the 5-element array at 0x20 and store it in R1' },

  initialMemory: [
    { address: 0x20, value: 7 },
    { address: 0x21, value: 23 },
    { address: 0x22, value: 5 },
    { address: 0x23, value: 19 },
    { address: 0x24, value: 12 },
  ],
  initialSource: 'MOV R2, 0x20\n',

  successConditions: [
    { type: 'register', target: 'R1', expected: 23 },
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
      ja: 'C言語との対応はこうなります：\n\n// C言語                              // アセンブラ\nuint16_t *p = (uint16_t*)0x20;  →    MOV R2, 0x20    ; (initialSource)\nint count = 5;                  →    MOV R3, 5\nint max = 0;                    →    MOV R1, 0\ndo {                            →    loop:\n    int v = *p;                 →      LOAD R4, [R2]\n    if (v > max)                →      CMP R1, R4\n                                       BGE skip       ; R1 >= R4 ならスキップ\n        max = v;                →      MOV R1, R4\n                                       skip:\n    p++;                        →      ADD R2, R2, 1\n    count--;                    →      SUB R3, R3, 1\n} while (count != 0);           →      CMP R3, 0\n                                       BNE loop',
      en: 'Here is the C-to-assembly mapping:\n\n// C                                  // Assembly\nuint16_t *p = (uint16_t*)0x20;  →    MOV R2, 0x20    ; (initialSource)\nint count = 5;                  →    MOV R3, 5\nint max = 0;                    →    MOV R1, 0\ndo {                            →    loop:\n    int v = *p;                 →      LOAD R4, [R2]\n    if (v > max)                →      CMP R1, R4\n                                       BGE skip       ; if R1 >= R4, skip\n        max = v;                →      MOV R1, R4\n                                       skip:\n    p++;                        →      ADD R2, R2, 1\n    count--;                    →      SUB R3, R3, 1\n} while (count != 0);           →      CMP R3, 0\n                                       BNE loop',
    },
    {
      kind: 'answer',
      ja: 'MOV R2, 0x20\nMOV R3, 5\nMOV R1, 0\nloop:\nLOAD R4, [R2]\nCMP R1, R4\nBGE skip\nMOV R1, R4\nskip:\nADD R2, R2, 1\nSUB R3, R3, 1\nCMP R3, 0\nBNE loop\nHALT',
      en: 'MOV R2, 0x20\nMOV R3, 5\nMOV R1, 0\nloop:\nLOAD R4, [R2]\nCMP R1, R4\nBGE skip\nMOV R1, R4\nskip:\nADD R2, R2, 1\nSUB R3, R3, 1\nCMP R3, 0\nBNE loop\nHALT',
    },
  ],
}
