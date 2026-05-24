import type { Stage } from '../../../core/stages/types.ts'

export const stage6: Stage = {
  id: 'c3-s06-call-return',
  chapter: 3,
  order: 6,
  title: { ja: '関数を呼ぶ', en: 'Call a Function' },
  objective: { ja: '関数 set_value を呼び出して R3 に 99 を格納せよ', en: 'Call the set_value function so that R3 holds 99' },

  initialMemory: [],
  initialSource: 'JMP main\n\nset_value:\nMOV R3, 99\nRET\n\nmain:\n',

  successConditions: [
    { type: 'register', target: 'R3', expected: 99 },
    { type: 'instruction_used', op: 'CALL' },
    { type: 'instruction_used', op: 'RET' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET', 'LOAD', 'STORE', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: '新しい命令を 2 つ覚えます：\n\n  CALL label  ; 関数を呼ぶ（戻り先を LR に保存して label へ）\n  RET         ; 関数から戻る（LR の指す場所へ）\n\nコード冒頭の JMP main は、関数定義の上を飛び越すためです。\n関数は呼ばれたときだけ実行され、上から流れて実行されないようにします。',
      en: 'Two new instructions:\n\n  CALL label  ; call a function (save return address in LR, jump to label)\n  RET         ; return from a function (jump to where LR points)\n\nThe leading JMP main skips over the function body.\nFunctions should run only when called, not when execution falls through.',
    },
    {
      kind: 'hint',
      ja: 'main の中で CALL set_value を書き、その後に HALT を置きます。\n\nC言語との対応はこうなります：\n\n// C言語              // アセンブラ\nvoid set_value() {  →  set_value:    ; (initialSource)\n    r3 = 99;        →    MOV R3, 99\n}                   →    RET\n\nint main() {        →  main:         ; (initialSource)\n    set_value();    →    CALL set_value\n    return 0;       →    HALT\n}',
      en: 'In main, write CALL set_value followed by HALT.\n\nC-to-assembly mapping:\n\n// C                  // Assembly\nvoid set_value() {  →  set_value:    ; (initialSource)\n    r3 = 99;        →    MOV R3, 99\n}                   →    RET\n\nint main() {        →  main:         ; (initialSource)\n    set_value();    →    CALL set_value\n    return 0;       →    HALT\n}',
    },
    {
      kind: 'answer',
      ja: 'JMP main\n\nset_value:\nMOV R3, 99\nRET\n\nmain:\nCALL set_value\nHALT',
      en: 'JMP main\n\nset_value:\nMOV R3, 99\nRET\n\nmain:\nCALL set_value\nHALT',
    },
  ],
}
