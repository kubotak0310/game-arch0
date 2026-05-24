import type { Stage } from '../../../core/stages/types.ts'

export const stage10: Stage = {
  id: 'c3-s10-functions-as-blocks',
  chapter: 3,
  order: 10,
  title: { ja: '関数を組み合わせる', en: 'Functions as Building Blocks' },
  objective: { ja: 'array_sum を 2 回呼び、配列 A の合計を [0x40] に、配列 B の合計を [0x41] に保存せよ', en: 'Call array_sum twice. Store array A\'s sum at [0x40] and array B\'s sum at [0x41]' },

  initialMemory: [
    { address: 0x20, value: 10 },
    { address: 0x21, value: 20 },
    { address: 0x22, value: 30 },
    { address: 0x30, value: 5 },
    { address: 0x31, value: 15 },
    { address: 0x32, value: 25 },
  ],
  initialSource: 'JMP main\n\n; R0 = ベースアドレス, R1 = 要素数\n; 戻り値: R0 = 合計\narray_sum:\nPUSH R3\nPUSH R4\nMOV R3, 0\nsum_loop:\nLOAD R4, [R0]\nADD R3, R3, R4\nADD R0, R0, 1\nSUB R1, R1, 1\nCMP R1, 0\nBNE sum_loop\nMOV R0, R3\nPOP R4\nPOP R3\nRET\n\nmain:\n',

  successConditions: [
    { type: 'memory', address: 0x40, expected: 60 },
    { type: 'memory', address: 0x41, expected: 45 },
    { type: 'instruction_used', op: 'CALL' },
    { type: 'instruction_used', op: 'STORE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET', 'PUSH', 'POP', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'array_sum は既に書かれています。あなたの仕事は main で呼び出すこと。\n\n配列 A：ベース 0x20、3 要素 → [0x40] に保存\n配列 B：ベース 0x30、3 要素 → [0x41] に保存\n\n関数呼び出しのたびに R0 と R1 を引数として設定し、戻ってきた R0 を STORE します。\n同じ関数を 2 度使うことで、コードの量が半分になります。',
      en: 'array_sum is already written. Your job is to call it from main.\n\nArray A: base 0x20, 3 elements → store at [0x40]\nArray B: base 0x30, 3 elements → store at [0x41]\n\nFor each call, set R0 and R1 as arguments, then STORE the returned R0.\nCalling the same function twice cuts the code in half.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                                  // アセンブラ\nint sum_a = array_sum(0x20, 3);  →    MOV R0, 0x20\n                                       MOV R1, 3\n                                       CALL array_sum\nmem[0x40] = sum_a;               →    STORE R0, [0x40]\n\nint sum_b = array_sum(0x30, 3);  →    MOV R0, 0x30\n                                       MOV R1, 3\n                                       CALL array_sum\nmem[0x41] = sum_b;               →    STORE R0, [0x41]',
      en: 'C-to-assembly mapping:\n\n// C                                      // Assembly\nint sum_a = array_sum(0x20, 3);  →    MOV R0, 0x20\n                                       MOV R1, 3\n                                       CALL array_sum\nmem[0x40] = sum_a;               →    STORE R0, [0x40]\n\nint sum_b = array_sum(0x30, 3);  →    MOV R0, 0x30\n                                       MOV R1, 3\n                                       CALL array_sum\nmem[0x41] = sum_b;               →    STORE R0, [0x41]',
    },
    {
      kind: 'answer',
      ja: 'JMP main\n\narray_sum:\nPUSH R3\nPUSH R4\nMOV R3, 0\nsum_loop:\nLOAD R4, [R0]\nADD R3, R3, R4\nADD R0, R0, 1\nSUB R1, R1, 1\nCMP R1, 0\nBNE sum_loop\nMOV R0, R3\nPOP R4\nPOP R3\nRET\n\nmain:\nMOV R0, 0x20\nMOV R1, 3\nCALL array_sum\nSTORE R0, [0x40]\n\nMOV R0, 0x30\nMOV R1, 3\nCALL array_sum\nSTORE R0, [0x41]\n\nHALT',
      en: 'JMP main\n\narray_sum:\nPUSH R3\nPUSH R4\nMOV R3, 0\nsum_loop:\nLOAD R4, [R0]\nADD R3, R3, R4\nADD R0, R0, 1\nSUB R1, R1, 1\nCMP R1, 0\nBNE sum_loop\nMOV R0, R3\nPOP R4\nPOP R3\nRET\n\nmain:\nMOV R0, 0x20\nMOV R1, 3\nCALL array_sum\nSTORE R0, [0x40]\n\nMOV R0, 0x30\nMOV R1, 3\nCALL array_sum\nSTORE R0, [0x41]\n\nHALT',
    },
  ],
}
