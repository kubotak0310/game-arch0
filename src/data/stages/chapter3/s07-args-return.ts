import type { Stage } from '../../../core/stages/types.ts'

export const stage7: Stage = {
  id: 'c3-s07-args-return',
  chapter: 3,
  order: 7,
  title: { ja: '引数と戻り値', en: 'Arguments and Return Value' },
  objective: { ja: 'add_r1_r2 を 2 回呼んで、7+8 を R3 に、10+20 を R4 に格納せよ', en: 'Call add_r1_r2 twice. Store 7+8 in R3 and 10+20 in R4' },

  initialMemory: [],
  initialSource: 'JMP main\n\n; R1, R2 を引数として受け取り、R1 + R2 を R1 に返す\nadd_r1_r2:\nADD R1, R1, R2\nRET\n\nmain:\n',

  successConditions: [
    { type: 'register', target: 'R3', expected: 15 },
    { type: 'register', target: 'R4', expected: 30 },
    { type: 'instruction_used', op: 'CALL' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: '関数の引数は R1 と R2 に置く約束です。戻り値は R1 で返ります。\n\n手順：\n  ① R1 に 7、R2 に 8 を置いて CALL add_r1_r2\n  ② R1 に答え 15 が入っているので、R3 に保存（次の呼び出しで R1 が上書きされる前に）\n  ③ R1 に 10、R2 に 20 を置いて CALL add_r1_r2\n  ④ R1 の答え 30 を R4 に保存\n  ⑤ HALT',
      en: 'Function arguments go in R1 and R2 by convention. The return value comes back in R1.\n\nSteps:\n  ① Put 7 in R1, 8 in R2 → CALL add_r1_r2\n  ② R1 now holds 15. Save it to R3 (before the next call overwrites R1)\n  ③ Put 10 in R1, 20 in R2 → CALL add_r1_r2\n  ④ Save R1 (30) to R4\n  ⑤ HALT',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                          // アセンブラ\nint add(int a, int b) {     →    add_r1_r2:        ; (initialSource)\n    return a + b;           →      ADD R1, R1, R2\n}                           →      RET\n\nint main() {                →    main:             ; (initialSource)\n    int r3 = add(7, 8);     →      MOV R1, 7\n                                   MOV R2, 8\n                                   CALL add_r1_r2\n                                   MOV R3, R1       ; 戻り値を保存\n    int r4 = add(10, 20);   →      MOV R1, 10\n                                   MOV R2, 20\n                                   CALL add_r1_r2\n                                   MOV R4, R1\n    return 0;               →      HALT\n}',
      en: 'C-to-assembly mapping:\n\n// C                              // Assembly\nint add(int a, int b) {     →    add_r1_r2:        ; (initialSource)\n    return a + b;           →      ADD R1, R1, R2\n}                           →      RET\n\nint main() {                →    main:             ; (initialSource)\n    int r3 = add(7, 8);     →      MOV R1, 7\n                                   MOV R2, 8\n                                   CALL add_r1_r2\n                                   MOV R3, R1       ; save return value\n    int r4 = add(10, 20);   →      MOV R1, 10\n                                   MOV R2, 20\n                                   CALL add_r1_r2\n                                   MOV R4, R1\n    return 0;               →      HALT\n}',
    },
    {
      kind: 'answer',
      ja: 'JMP main\n\nadd_r1_r2:\nADD R1, R1, R2\nRET\n\nmain:\nMOV R1, 7\nMOV R2, 8\nCALL add_r1_r2\nMOV R3, R1\n\nMOV R1, 10\nMOV R2, 20\nCALL add_r1_r2\nMOV R4, R1\n\nHALT',
      en: 'JMP main\n\nadd_r1_r2:\nADD R1, R1, R2\nRET\n\nmain:\nMOV R1, 7\nMOV R2, 8\nCALL add_r1_r2\nMOV R3, R1\n\nMOV R1, 10\nMOV R2, 20\nCALL add_r1_r2\nMOV R4, R1\n\nHALT',
    },
  ],
}
