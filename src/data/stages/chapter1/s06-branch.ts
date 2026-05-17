import type { Stage } from '../../../core/stages/types.ts'

export const stage6: Stage = {
  id: 'c1-s06-branch',
  chapter: 1,
  order: 6,
  title: { ja: '分岐', en: 'Branch' },
  objective: { ja: 'R1 と R2 が等しければ R3 に 1 を、そうでなければ 0 を格納せよ', en: 'Store 1 in R3 if R1 equals R2, otherwise store 0' },

  initialMemory: [],
  initialSource: 'MOV R1, 5\nMOV R2, 5\n',

  successConditions: [
    { type: 'register',          target: 'R3', expected: 1 },
    { type: 'instruction_used', op: 'CMP' },
    { type: 'instruction_used', op: 'BNE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'HALT'],

  hints: [
    {
      ja: 'C言語で書くとこうなります：\n\nint rslt = 0;\nif (r1 == r2) {\n    rslt = 1;\n}\n\nこれをアセンブラに翻訳します。\nR3 を rslt として使いましょう。',
      en: 'In C, this looks like:\n\nint rslt = 0;\nif (r1 == r2) {\n    rslt = 1;\n}\n\nTranslate this to assembly.\nUse R3 for rslt.',
    },
    {
      ja: 'C言語との対応はこうなります：\n\n// C言語            // アセンブラ\nrslt = 0;     →   MOV R3, 0\n              →   CMP R1, R2\nif (r1==r2)   →   BNE done  ← 等しくなければ(Z==0)スキップ\n  rslt = 1;   →   MOV R3, 1\n              →   done:\n\nBNE（Branch if Not Equal）は「等しくなければジャンプ」です。\n条件の否定でif本体をスキップするのがアセンブラのイディオムです。',
      en: 'Here is the C-to-assembly mapping:\n\n// C               // Assembly\nrslt = 0;    →   MOV R3, 0\n             →   CMP R1, R2\nif (r1==r2)  →   BNE done  ← skip if not equal (Z==0)\n  rslt = 1;  →   MOV R3, 1\n             →   done:\n\nBNE (Branch if Not Equal) jumps when values differ.\nNegating the condition to skip the if-body is the standard assembly idiom.',
    },
    {
      ja: '答え:\nMOV R1, 5\nMOV R2, 5\nMOV R3, 0\nCMP R1, R2\nBNE done\nMOV R3, 1\ndone:',
      en: 'Answer:\nMOV R1, 5\nMOV R2, 5\nMOV R3, 0\nCMP R1, R2\nBNE done\nMOV R3, 1\ndone:',
    },
  ],
}
