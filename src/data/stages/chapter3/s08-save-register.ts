import type { Stage } from '../../../core/stages/types.ts'

export const stage8: Stage = {
  id: 'c3-s08-save-register',
  chapter: 3,
  order: 8,
  title: { ja: 'レジスタを保存', en: 'Save a Register' },
  objective: { ja: 'CALL の後でも R3 が 5 のままになるよう、関数を修正せよ（R0 は 109 になる）', en: 'Modify the function so R3 remains 5 after CALL (R0 should be 109)' },

  initialMemory: [],
  initialSource: 'JMP main\n\n; この関数は内部で R3 を書き換える。\n; main の R3 を壊さないよう、関数の入口で保存し、出口で復元する必要がある。\ndo_work:\nMOV R3, 99\nADD R0, R0, R3\nRET\n\nmain:\nMOV R0, 10\nMOV R3, 5\nCALL do_work\n',

  successConditions: [
    { type: 'register', target: 'R0', expected: 109 },
    { type: 'register', target: 'R3', expected: 5 },
    { type: 'instruction_used', op: 'PUSH' },
    { type: 'instruction_used', op: 'POP' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET', 'PUSH', 'POP', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: 'まず HALT を付けて実行してみてください。R0 は 109 になりますが、R3 が 5 でなく 99 になっているはずです。\n\nなぜなら do_work が R3 を上書きしているからです。\n呼び出し元の R3 を守るのは、関数の責任です。これを「callee-saved」と呼びます。\n\nR3, R4 は callee-saved（関数が壊してはいけない）。\nR0, R1, R2 は caller-saved（関数が自由に使ってよい）。\n\n新しい命令：\n  PUSH Rs  ; レジスタの値をスタックに積む\n  POP  Rd  ; スタックから値を取り出す',
      en: 'First, just add HALT and run. R0 becomes 109, but R3 is 99 instead of 5.\n\nThis is because do_work overwrites R3.\nProtecting the caller\'s R3 is the function\'s responsibility — called "callee-saved."\n\nR3, R4 are callee-saved (function must not destroy them).\nR0, R1, R2 are caller-saved (function may use them freely).\n\nNew instructions:\n  PUSH Rs  ; push a register value onto the stack\n  POP  Rd  ; pop a value off the stack into a register',
    },
    {
      kind: 'hint',
      ja: '関数の入口で PUSH、出口で POP を使い、R3 を保存・復元します：\n\n// C言語                            // アセンブラ\nvoid do_work() {              →    do_work:\n    // R3 を一時的に退避          →      PUSH R3       ; 入口で保存\n    r3 = 99;                  →      MOV R3, 99\n    r0 += r3;                 →      ADD R0, R0, R3\n    // R3 を元に戻す              →      POP R3        ; 出口で復元\n}                             →      RET\n\nPUSH と POP は対称的に使います。入った順序の逆で取り出されます。',
      en: 'Use PUSH at the entry and POP at the exit to save/restore R3:\n\n// C                                // Assembly\nvoid do_work() {              →    do_work:\n    // save R3 temporarily       →      PUSH R3       ; save on entry\n    r3 = 99;                  →      MOV R3, 99\n    r0 += r3;                 →      ADD R0, R0, R3\n    // restore R3                →      POP R3        ; restore on exit\n}                             →      RET\n\nPUSH and POP are symmetric — values come off in reverse order.',
    },
    {
      kind: 'answer',
      ja: 'JMP main\n\ndo_work:\nPUSH R3\nMOV R3, 99\nADD R0, R0, R3\nPOP R3\nRET\n\nmain:\nMOV R0, 10\nMOV R3, 5\nCALL do_work\nHALT',
      en: 'JMP main\n\ndo_work:\nPUSH R3\nMOV R3, 99\nADD R0, R0, R3\nPOP R3\nRET\n\nmain:\nMOV R0, 10\nMOV R3, 5\nCALL do_work\nHALT',
    },
  ],
}
