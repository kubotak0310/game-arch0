import type { Stage } from '../../../core/stages/types.ts'

export const stage4: Stage = {
  id: 'c3-s04-signed-compare',
  chapter: 3,
  order: 4,
  title: { ja: '大きい方を取る', en: 'Take the Larger' },
  objective: { ja: 'R0 と R1 のうち大きい方を R2 に格納せよ', en: 'Store the larger of R0 and R1 into R2' },

  initialMemory: [],
  initialSource: 'MOV R0, 7\nMOV R1, 12\n',

  successConditions: [
    { type: 'register', target: 'R2', expected: 12 },
    { type: 'instruction_used', op: 'CMP' },
    { type: 'instruction_used', op: 'BGE' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'HALT'],

  hints: [
    {
      kind: 'hint',
      ja: '今までは BEQ / BNE（等しい・等しくない）だけでした。\n「大きい・小さい」を判定するには、新しい分岐命令が必要です：\n\n  BLT — 小さければ分岐（Less Than）\n  BGT — 大きければ分岐（Greater Than）\n  BLE — 以下なら分岐（Less or Equal）\n  BGE — 以上なら分岐（Greater or Equal）\n\nCMP の後にこれらを使います。',
      en: 'So far we only used BEQ / BNE (equal / not equal).\nTo decide "greater / less," we need new branch instructions:\n\n  BLT — branch if less than\n  BGT — branch if greater than\n  BLE — branch if less or equal\n  BGE — branch if greater or equal\n\nUse them after CMP.',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語              // アセンブラ\nint r3 = r1;     →   MOV R2, R0     ; 仮に R0 を答えとする\nif (r2 > r1)     →   CMP R2, R1     ; R2 と R1 を比較\n                     BGE skip       ; R2 >= R1 なら更新しない\n    r3 = r2;     →   MOV R2, R1     ; そうでなければ R2 = R1\n                     skip:\n\n「更新する条件」より「更新しない条件」で分岐するのがアセンブラの定石です。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                  // Assembly\nint r3 = r1;     →   MOV R2, R0     ; tentatively R2 = R0\nif (r2 > r1)     →   CMP R2, R1     ; compare R2 with R1\n                     BGE skip       ; if R2 >= R1, do not update\n    r3 = r2;     →   MOV R2, R1     ; otherwise R2 = R1\n                     skip:\n\nBranching on "do not update" is the standard assembly idiom.',
    },
    {
      kind: 'answer',
      ja: 'MOV R0, 7\nMOV R1, 12\nMOV R2, R0\nCMP R2, R1\nBGE skip\nMOV R2, R1\nskip:\nHALT',
      en: 'MOV R0, 7\nMOV R1, 12\nMOV R2, R0\nCMP R2, R1\nBGE skip\nMOV R2, R1\nskip:\nHALT',
    },
  ],
}
