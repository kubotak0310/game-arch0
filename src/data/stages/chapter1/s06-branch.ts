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

  interlude: {
    ja: [
      {
        date: '1986 年 秋',
        body: `分岐命令は、条件に応じて進む方向を変える。
計算機が「判断している」わけではない。

比較した結果のフラグを読んで、
次の命令アドレスを変えるだけだ。
それで十分、あらゆる分岐が表現できる。`,
      },
      {
        diagram: 'flags' as const,
        body: `フラグは、直前の演算結果を4ビットで記録する。

N — 結果が負だった
Z — 結果がゼロだった
C — 桁上がりが発生した
V — 符号付き演算で溢れた

CMP命令は、引き算を行ってフラグだけを更新する。
結果はどこにも格納されない。`,
      },
    ],
    en: [
      {
        date: 'Autumn, 1986',
        body: `A branch instruction changes the direction of execution.
The machine is not "making a decision."

It reads the flags left by a comparison
and changes the next instruction address.
That is all. And that is enough for any branch.`,
      },
      {
        diagram: 'flags' as const,
        body: `Flags record the result of the last operation in 4 bits.

N — result was negative
Z — result was zero
C — a carry occurred
V — signed overflow occurred

CMP subtracts and updates the flags only.
The result is not stored anywhere.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: 'C言語で書くとこうなります：\n\nint rslt = 0;\nif (r1 == r2) {\n    rslt = 1;\n}\n\nこれをアセンブラに翻訳します。\nR3 を rslt として使いましょう。',
      en: 'In C, this looks like:\n\nint rslt = 0;\nif (r1 == r2) {\n    rslt = 1;\n}\n\nTranslate this to assembly.\nUse R3 for rslt.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語            // アセンブラ\nrslt = 0;     →   MOV R3, 0\n              →   CMP R1, R2\nif (r1==r2)   →   BNE done  ← 等しくなければ(Z==0)スキップ\n  rslt = 1;   →   MOV R3, 1\n              →   done:\n\nBNE（Branch if Not Equal）は「等しくなければジャンプ」です。\n条件の否定でif本体をスキップするのがアセンブラのイディオムです。',
      en: 'Here is the C-to-assembly mapping:\n\n// C               // Assembly\nrslt = 0;    →   MOV R3, 0\n             →   CMP R1, R2\nif (r1==r2)  →   BNE done  ← skip if not equal (Z==0)\n  rslt = 1;  →   MOV R3, 1\n             →   done:\n\nBNE (Branch if Not Equal) jumps when values differ.\nNegating the condition to skip the if-body is the standard assembly idiom.',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 5\nMOV R2, 5\nMOV R3, 0\nCMP R1, R2\nBNE done\nMOV R3, 1\ndone:',
      en: 'MOV R1, 5\nMOV R2, 5\nMOV R3, 0\nCMP R1, R2\nBNE done\nMOV R3, 1\ndone:',
    },
  ],
}
