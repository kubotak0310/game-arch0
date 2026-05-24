import type { Stage } from '../../../core/stages/types.ts'

export const stage9: Stage = {
  id: 'c2-s09-max',
  chapter: 2,
  order: 9,
  title: { ja: '最大値', en: 'Maximum' },
  objective: { ja: 'R2 が指す配列 3 要素の最大値を R1 に格納せよ', en: 'Store the maximum of the 3 elements pointed by R2 into R1' },

  initialMemory: [
    { address: 0x20, value: 5 },
    { address: 0x21, value: 12 },
    { address: 0x22, value: 7 },
  ],
  initialSource: 'MOV R2, 0x20\n',

  successConditions: [
    { type: 'register', target: 'R1', expected: 12 },
    { type: 'instruction_used', op: 'LOAD' },
    { type: 'instruction_used', op: 'CMP' },
  ],

  unlockedInstructions: ['MOV', 'ADD', 'SUB', 'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'STORE', 'LOAD', 'HALT'],

  interlude: {
    ja: [
      {
        body: `これまでの全部が、ここに集まる。
LOAD で読み、CMP で比べ、分岐で道を選ぶ。

最大値を見つけるには、こう考える：

  1 番目の値を仮の最大値として持つ。
  次の値と比べ、大きければ更新する。
  これを全要素について繰り返す。

3 つだから、比較は 2 回で済む。`,
        marginNote: `比べるには、基準がいる。
1 つ目の値を仮の答えにする — なかなか潔い。`,
      },
    ],
    en: [
      {
        body: `Everything so far comes together here.
LOAD to read, CMP to compare, branches to choose a path.

To find the maximum:

  Take the first value as the tentative max.
  Compare with the next, update if it's larger.
  Repeat for each element.

Three elements means only two comparisons.`,
        marginNote: `Comparison needs a baseline.
Taking the first as a provisional answer — clean, I think.`,
      },
    ],
  },

  hints: [
    {
      kind: 'hint',
      ja: '考え方：\n  ① 1 番目の要素を R1 にロード（仮の最大値）\n  ② 2 番目をロード → R1 と比較 → 大きければ R1 を更新\n  ③ 3 番目も同様',
      en: 'Approach:\n  ① LOAD the first element into R1 (tentative max)\n  ② LOAD the second → CMP with R1 → if larger, update R1\n  ③ Same for the third',
    },
    {
      kind: 'hint',
      ja: 'C言語との対応はこうなります：\n\n// C言語                          // アセンブラ\nint max = p[0];               →   LOAD R1, [R2]\nint x = p[1];                 →   LOAD R3, [R2 + 1]\nif (x > max) max = x;         →   CMP  R3, R1\n                                  BLE  skip1     ; R3 <= R1 ならスキップ\n                                  MOV  R1, R3\n                                  skip1:\nx = p[2];                     →   LOAD R3, [R2 + 2]\nif (x > max) max = x;         →   CMP  R3, R1\n                                  BLE  skip2\n                                  MOV  R1, R3\n                                  skip2:',
      en: 'Here is the C-to-assembly mapping:\n\n// C                             // Assembly\nint max = p[0];               →   LOAD R1, [R2]\nint x = p[1];                 →   LOAD R3, [R2 + 1]\nif (x > max) max = x;         →   CMP  R3, R1\n                                  BLE  skip1     ; skip if R3 <= R1\n                                  MOV  R1, R3\n                                  skip1:\nx = p[2];                     →   LOAD R3, [R2 + 2]\nif (x > max) max = x;         →   CMP  R3, R1\n                                  BLE  skip2\n                                  MOV  R1, R3\n                                  skip2:',
    },
    {
      kind: 'answer',
      ja: 'MOV  R2, 0x20\nLOAD R1, [R2]\nLOAD R3, [R2 + 1]\nCMP  R3, R1\nBLE  skip1\nMOV  R1, R3\nskip1:\nLOAD R3, [R2 + 2]\nCMP  R3, R1\nBLE  skip2\nMOV  R1, R3\nskip2:',
      en: 'MOV  R2, 0x20\nLOAD R1, [R2]\nLOAD R3, [R2 + 1]\nCMP  R3, R1\nBLE  skip1\nMOV  R1, R3\nskip1:\nLOAD R3, [R2 + 2]\nCMP  R3, R1\nBLE  skip2\nMOV  R1, R3\nskip2:',
    },
  ],
}
