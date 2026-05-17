import type { Stage } from '../../../core/stages/types.ts'

export const stage5: Stage = {
  id: 'c1-s05-swap',
  chapter: 1,
  order: 5,
  title: { ja: '値の交換', en: 'Swap Values' },
  objective: { ja: 'R1 と R2 の値を入れ替えよ', en: 'Swap the values in R1 and R2' },

  initialMemory: [],
  initialSource: 'MOV R1, 5\nMOV R2, 8\n',

  successConditions: [
    { type: 'register', target: 'R1', expected: 8 },
    { type: 'register', target: 'R2', expected: 5 },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'HALT'],

  hints: [
    {
      ja: 'C言語で書くとこうなります：\n\nint temp = r1;\nr1 = r2;\nr2 = temp;\n\n2つの変数を直接入れ替えることはできないので、\n一時的な変数 temp が必要です。\nアセンブラでは R3 を temp として使いましょう。',
      en: 'In C, this looks like:\n\nint temp = r1;\nr1 = r2;\nr2 = temp;\n\nYou cannot swap two variables directly,\nso a temporary variable temp is needed.\nUse R3 as temp in assembly.',
    },
    {
      ja: 'C言語との対応はこうなります：\n\n// C言語        // アセンブラ\ntemp = r1;  →  MOV R3, R1\nr1 = r2;    →  MOV R1, R2\nr2 = temp;  →  MOV R2, R3',
      en: 'Here is the C-to-assembly mapping:\n\n// C            // Assembly\ntemp = r1;  →  MOV R3, R1\nr1 = r2;    →  MOV R1, R2\nr2 = temp;  →  MOV R2, R3',
    },
    {
      ja: '答え:\nMOV R1, 5\nMOV R2, 8\nMOV R3, R1\nMOV R1, R2\nMOV R2, R3',
      en: 'Answer:\nMOV R1, 5\nMOV R2, 8\nMOV R3, R1\nMOV R1, R2\nMOV R2, R3',
    },
  ],
}
