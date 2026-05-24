import type { Stage } from '../../../core/stages/types.ts'

export const stage9: Stage = {
  id: 'c3-s09-nested-call',
  chapter: 3,
  order: 9,
  title: { ja: 'ネストした関数', en: 'Nested Function Calls' },
  objective: { ja: 'main から outer を呼び、outer の中で inner を呼んで、R0 を 43 にせよ', en: 'Call outer from main; outer calls inner. R0 should end as 43' },

  initialMemory: [],
  initialSource: 'JMP main\n\ninner:\nMOV R0, 42\nRET\n\n; outer は inner を呼ぶ。main に戻れるよう、LR を保存する必要がある。\nouter:\n\nmain:\nCALL outer\n',

  successConditions: [
    { type: 'register', target: 'R0', expected: 43 },
    { type: 'instruction_used', op: 'CALL' },
    { type: 'instruction_used', op: 'PUSH' },
    { type: 'instruction_used', op: 'POP' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET', 'PUSH', 'POP', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'CALL は戻り先アドレスを LR に書き込みます。だから関数 A が関数 B を呼ぶと、A 自身が戻る先（LR の元の値）が上書きされて消えます。\n\nこの問題では：\n  main → outer → inner\n\nouter の中で CALL inner を実行した瞬間、LR は inner からの戻り先になり、main への戻り先は失われます。\n対策は単純です。outer の入口で LR を PUSH し、出口で POP すれば、main へ正しく戻れます。',
      en: 'CALL writes the return address into LR. So when function A calls function B, A\'s own return address (the previous LR value) gets overwritten and lost.\n\nIn this puzzle:\n  main → outer → inner\n\nThe instant CALL inner executes inside outer, LR is set to the return address inside outer, and the return address to main is lost.\nThe fix is simple: PUSH LR on entry to outer, POP LR before returning.',
    },
    {
      kind: 'hint',
      ja: 'outer の中身はこうなります：\n\n// C言語                                // アセンブラ\nvoid outer() {                    →    outer:\n    // LR を退避（CALL で壊れる）        →      PUSH LR\n    inner();                      →      CALL inner\n    r0 += 1;                      →      ADD R0, R0, 1\n    // LR を復元                          →      POP LR\n}                                 →      RET\n\nmain の CALL outer の後には HALT を忘れずに。',
      en: 'The body of outer:\n\n// C                                    // Assembly\nvoid outer() {                    →    outer:\n    // save LR (CALL will overwrite)  →      PUSH LR\n    inner();                      →      CALL inner\n    r0 += 1;                      →      ADD R0, R0, 1\n    // restore LR                       →      POP LR\n}                                 →      RET\n\nDon\'t forget HALT after CALL outer in main.',
    },
    {
      kind: 'answer',
      ja: 'JMP main\n\ninner:\nMOV R0, 42\nRET\n\nouter:\nPUSH LR\nCALL inner\nADD R0, R0, 1\nPOP LR\nRET\n\nmain:\nCALL outer\nHALT',
      en: 'JMP main\n\ninner:\nMOV R0, 42\nRET\n\nouter:\nPUSH LR\nCALL inner\nADD R0, R0, 1\nPOP LR\nRET\n\nmain:\nCALL outer\nHALT',
    },
  ],
}
