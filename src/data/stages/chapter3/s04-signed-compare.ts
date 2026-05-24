import type { Stage } from '../../../core/stages/types.ts'

export const stage4: Stage = {
  id: 'c3-s04-signed-compare',
  chapter: 3,
  order: 4,
  title: { ja: '大きい方を取る', en: 'Take the Larger' },
  objective: { ja: 'R1 と R2 のうち大きい方を R3 に格納せよ', en: 'Store the larger of R1 and R2 into R3' },

  initialMemory: [],
  initialSource: 'MOV R1, 7\nMOV R2, 12\n',

  successConditions: [
    { type: 'register', target: 'R3', expected: 12 },
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
      ja: 'C言語との対応はこうなります：\n\n// C言語              // アセンブラ\nint r3 = r1;     →   MOV R3, R1     ; 仮に R1 を答えとする\nif (r2 > r1)     →   CMP R3, R2     ; R3 と R2 を比較\n                     BGE skip       ; R3 >= R2 なら更新しない\n    r3 = r2;     →   MOV R3, R2     ; そうでなければ R3 = R2\n                     skip:\n\n「更新する条件」より「更新しない条件」で分岐するのがアセンブラの定石です。',
      en: 'Here is the C-to-assembly mapping:\n\n// C                  // Assembly\nint r3 = r1;     →   MOV R3, R1     ; tentatively R3 = R1\nif (r2 > r1)     →   CMP R3, R2     ; compare R3 with R2\n                     BGE skip       ; if R3 >= R2, do not update\n    r3 = r2;     →   MOV R3, R2     ; otherwise R3 = R2\n                     skip:\n\nBranching on "do not update" is the standard assembly idiom.',
    },
    {
      kind: 'answer',
      ja: 'MOV R1, 7\nMOV R2, 12\nMOV R3, R1\nCMP R3, R2\nBGE skip\nMOV R3, R2\nskip:\nHALT',
      en: 'MOV R1, 7\nMOV R2, 12\nMOV R3, R1\nCMP R3, R2\nBGE skip\nMOV R3, R2\nskip:\nHALT',
    },
  ],
}
