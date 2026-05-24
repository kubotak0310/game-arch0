import type { Stage } from '../../../core/stages/types.ts'

export const stage7: Stage = {
  id: 'c3-s07-args-return',
  chapter: 3,
  order: 7,
  title: { ja: '引数と戻り値', en: 'Arguments and Return Value' },
  objective: { ja: 'add_r0_r1 を 2 回呼んで、7+8 を R3 に、10+20 を R4 に格納せよ', en: 'Call add_r0_r1 twice. Store 7+8 in R3 and 10+20 in R4' },

  initialMemory: [],
  initialSource: 'JMP main\n\n; R0, R1 を引数として受け取り、R0 + R1 を R0 に返す\nadd_r0_r1:\nADD R0, R0, R1\nRET\n\nmain:\n',

  successConditions: [
    { type: 'register', target: 'R3', expected: 15 },
    { type: 'register', target: 'R4', expected: 30 },
    { type: 'instruction_used', op: 'CALL' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: '関数の引数は R0 と R1 に置く約束です。戻り値は R0 で返ります。\n\n手順：\n  ① R0 に 7、R1 に 8 を置いて CALL add_r0_r1\n  ② R0 に答え 15 が入っているので、R3 に保存（次の呼び出しで R0 が上書きされる前に）\n  ③ R0 に 10、R1 に 20 を置いて CALL add_r0_r1\n  ④ R0 の答え 30 を R4 に保存\n  ⑤ HALT',
      en: 'Function arguments go in R0 and R1 by convention. The return value comes back in R0.\n\nSteps:\n  ① Put 7 in R0, 8 in R1 → CALL add_r0_r1\n  ② R0 now holds 15. Save it to R3 (before the next call overwrites R0)\n  ③ Put 10 in R0, 20 in R1 → CALL add_r0_r1\n  ④ Save R0 (30) to R4\n  ⑤ HALT',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                          // アセンブラ\nint add(int a, int b) {     →    add_r0_r1:        ; (initialSource)\n    return a + b;           →      ADD R0, R0, R1\n}                           →      RET\n\nint main() {                →    main:             ; (initialSource)\n    int r3 = add(7, 8);     →      MOV R0, 7\n                                   MOV R1, 8\n                                   CALL add_r0_r1\n                                   MOV R3, R0       ; 戻り値を保存\n    int r4 = add(10, 20);   →      MOV R0, 10\n                                   MOV R1, 20\n                                   CALL add_r0_r1\n                                   MOV R4, R0\n    return 0;               →      HALT\n}',
      en: 'C-to-assembly mapping:\n\n// C                              // Assembly\nint add(int a, int b) {     →    add_r0_r1:        ; (initialSource)\n    return a + b;           →      ADD R0, R0, R1\n}                           →      RET\n\nint main() {                →    main:             ; (initialSource)\n    int r3 = add(7, 8);     →      MOV R0, 7\n                                   MOV R1, 8\n                                   CALL add_r0_r1\n                                   MOV R3, R0       ; save return value\n    int r4 = add(10, 20);   →      MOV R0, 10\n                                   MOV R1, 20\n                                   CALL add_r0_r1\n                                   MOV R4, R0\n    return 0;               →      HALT\n}',
    },
    {
      kind: 'answer',
      ja: 'JMP main\n\nadd_r0_r1:\nADD R0, R0, R1\nRET\n\nmain:\nMOV R0, 7\nMOV R1, 8\nCALL add_r0_r1\nMOV R3, R0\n\nMOV R0, 10\nMOV R1, 20\nCALL add_r0_r1\nMOV R4, R0\n\nHALT',
      en: 'JMP main\n\nadd_r0_r1:\nADD R0, R0, R1\nRET\n\nmain:\nMOV R0, 7\nMOV R1, 8\nCALL add_r0_r1\nMOV R3, R0\n\nMOV R0, 10\nMOV R1, 20\nCALL add_r0_r1\nMOV R4, R0\n\nHALT',
    },
  ],
}
