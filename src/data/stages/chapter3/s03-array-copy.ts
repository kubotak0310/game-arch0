import type { Stage } from '../../../core/stages/types.ts'

export const stage3: Stage = {
  id: 'c3-s03-array-copy',
  chapter: 3,
  order: 3,
  title: { ja: '配列のコピー', en: 'Copy an Array' },
  objective: { ja: '[0x20..0x24] の 5 要素を [0x30..0x34] へコピーせよ', en: 'Copy the 5 elements at [0x20..0x24] to [0x30..0x34]' },

  initialMemory: [
    { address: 0x20, value: 1 },
    { address: 0x21, value: 2 },
    { address: 0x22, value: 3 },
    { address: 0x23, value: 4 },
    { address: 0x24, value: 5 },
  ],
  initialSource: 'MOV R0, 0x20\nMOV R1, 0x30\n',

  successConditions: [
    { type: 'memory', address: 0x30, expected: 1 },
    { type: 'memory', address: 0x31, expected: 2 },
    { type: 'memory', address: 0x32, expected: 3 },
    { type: 'memory', address: 0x33, expected: 4 },
    { type: 'memory', address: 0x34, expected: 5 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'STORE' },
    { type: 'instruction_used', op: 'BNE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'JMP', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: '2 つのポインタを動かしながらループします：\n  R0 = 元のアドレス（initialSource で 0x20）\n  R1 = 先のアドレス（initialSource で 0x30）\n\n各反復で：\n  ① [R0] から読み\n  ② [R1] へ書き\n  ③ 両方のポインタを 1 進める\n  ④ カウンタを減らす',
      en: 'Loop while moving two pointers:\n  R0 = source address (initialSource sets 0x20)\n  R1 = destination address (initialSource sets 0x30)\n\nEach iteration:\n  ① Read from [R0]\n  ② Write to [R1]\n  ③ Advance both pointers by 1\n  ④ Decrement the counter',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                              // アセンブラ\nuint16_t *src = (uint16_t*)0x20;  →  MOV R0, 0x20    ; (initialSource)\nuint16_t *dst = (uint16_t*)0x30;  →  MOV R1, 0x30    ; (initialSource)\nint count = 5;                    →  MOV R2, 5\ndo {                              →  loop:\n    *dst = *src;                  →    LOAD R3, [R0]\n                                  →    STORE R3, [R1]\n    src++;                        →    ADD R0, R0, 1\n    dst++;                        →    ADD R1, R1, 1\n    count--;                      →    SUB R2, R2, 1\n} while (count != 0);             →    CMP R2, 0\n                                  →    BNE loop',
      en: 'Here is the C-to-assembly mapping:\n\n// C                                  // Assembly\nuint16_t *src = (uint16_t*)0x20;  →  MOV R0, 0x20    ; (initialSource)\nuint16_t *dst = (uint16_t*)0x30;  →  MOV R1, 0x30    ; (initialSource)\nint count = 5;                    →  MOV R2, 5\ndo {                              →  loop:\n    *dst = *src;                  →    LOAD R3, [R0]\n                                  →    STORE R3, [R1]\n    src++;                        →    ADD R0, R0, 1\n    dst++;                        →    ADD R1, R1, 1\n    count--;                      →    SUB R2, R2, 1\n} while (count != 0);             →    CMP R2, 0\n                                  →    BNE loop',
    },
    {
      kind: 'answer',
      ja: 'MOV R0, 0x20\nMOV R1, 0x30\nMOV R2, 5\nloop:\nLOAD R3, [R0]\nSTORE R3, [R1]\nADD R0, R0, 1\nADD R1, R1, 1\nSUB R2, R2, 1\nCMP R2, 0\nBNE loop\nHALT',
      en: 'MOV R0, 0x20\nMOV R1, 0x30\nMOV R2, 5\nloop:\nLOAD R3, [R0]\nSTORE R3, [R1]\nADD R0, R0, 1\nADD R1, R1, 1\nSUB R2, R2, 1\nCMP R2, 0\nBNE loop\nHALT',
    },
  ],
}
