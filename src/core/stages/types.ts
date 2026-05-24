import type { InstructionType, AnyRegisterName, Flags, Registers } from '../cpu/types.ts'

export interface I18nText {
  ja: string
  en: string
}

export interface Hint extends I18nText {
  kind: 'hint' | 'answer'
}

export type DiagramType = 'registers' | 'flags' | 'alu' | 'chain' | 'swap' | 'loop'

export interface NotePage {
  date?: string
  body: string
  diagram?: DiagramType
}

export interface NoteInterlude {
  ja: NotePage[]
  en: NotePage[]
}

export type SuccessCondition =
  | { type: 'register'; target: AnyRegisterName; expected: number }
  | { type: 'memory'; address: number; expected: number }
  | { type: 'flag'; flag: keyof Flags; expected: boolean }
  | { type: 'instruction_used'; op: InstructionType }

export interface OptimizationGoal {
  type: 'instruction_count' | 'cycle_count' | 'memory_usage'
  threshold: number
  label: I18nText
}

export interface Stage {
  id: string
  chapter: number
  order: number
  title: I18nText
  objective: I18nText

  initialRegisters?: Partial<Omit<Registers, 'R0'>>
  initialMemory?: Array<{ address: number; value: number }>
  initialSource?: string

  successConditions: SuccessCondition[]
  unlockedInstructions?: InstructionType[]
  optimizationGoals?: OptimizationGoal[]
  hints: Hint[]
  interlude?: NoteInterlude
}
