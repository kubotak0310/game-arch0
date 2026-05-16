import { describe, it, expect } from 'vitest'
import { tokenize } from '../../src/core/assembler/lexer.ts'
import { parse } from '../../src/core/assembler/parser.ts'

describe('Lexer', () => {
  describe('基本トークン化', () => {
    it('ニーモニックを MNEMONIC として認識する', () => {
      const { tokens } = tokenize('MOV R1, #2')
      expect(tokens[0].kind).toBe('MNEMONIC')
      expect(tokens[0].value).toBe('MOV')
    })

    it('レジスタを REGISTER として認識する', () => {
      const { tokens } = tokenize('MOV R1, #2')
      expect(tokens[1].kind).toBe('REGISTER')
      expect(tokens[1].value).toBe('R1')
    })

    it('即値(#数値)を IMMEDIATE として認識する', () => {
      const { tokens } = tokenize('MOV R1, #5')
      const imm = tokens.find(t => t.kind === 'IMMEDIATE')
      expect(imm?.value).toBe('5')
    })

    it('16進即値 #0x10 を正しくパースする', () => {
      const { tokens } = tokenize('MOV R1, #0x10')
      const imm = tokens.find(t => t.kind === 'IMMEDIATE')
      expect(imm?.value).toBe('16')
    })

    it('2進即値 #0b101 を正しくパースする', () => {
      const { tokens } = tokenize('MOV R1, #0b101')
      const imm = tokens.find(t => t.kind === 'IMMEDIATE')
      expect(imm?.value).toBe('5')
    })

    it('制御レジスタ LR, SP, PC を認識する', () => {
      const { tokens: lrTokens } = tokenize('MOV LR, #0')
      expect(lrTokens[1].kind).toBe('REGISTER')
      expect(lrTokens[1].value).toBe('LR')
    })

    it('ラベル定義を LABEL_DEF として認識する（大文字で正規化）', () => {
      const { tokens } = tokenize('loop:')
      expect(tokens[0].kind).toBe('LABEL_DEF')
      expect(tokens[0].value).toBe('LOOP')
    })

    it('ラベル参照を LABEL_REF として認識する', () => {
      const { tokens } = tokenize('JMP loop_start')
      expect(tokens[1].kind).toBe('LABEL_REF')
      expect(tokens[1].value).toBe('LOOP_START') // 大文字に正規化
    })

    it('カンマを COMMA として認識する', () => {
      const { tokens } = tokenize('MOV R1, #2')
      expect(tokens[2].kind).toBe('COMMA')
    })

    it('コメント(;以降)を除去する', () => {
      const { tokens } = tokenize('MOV R1, #2 ; これはコメント')
      const values = tokens.map(t => t.value)
      expect(values).not.toContain(';')
      expect(values).not.toContain('これはコメント')
    })

    it('空行ではトークンを生成しない（NEWLINEなし）', () => {
      const { tokens } = tokenize('\n\n')
      expect(tokens.filter(t => t.kind === 'NEWLINE')).toHaveLength(0)
    })

    it('行番号が正しく付与される', () => {
      const { tokens } = tokenize('MOV R1, #2\nADD R3, R1, R2')
      const addToken = tokens.find(t => t.value === 'ADD')
      expect(addToken?.line).toBe(2)
    })

    it('[ と ] を LBRACKET / RBRACKET として認識する', () => {
      const { tokens } = tokenize('LOAD R1, [R2]')
      const lb = tokens.find(t => t.kind === 'LBRACKET')
      const rb = tokens.find(t => t.kind === 'RBRACKET')
      expect(lb?.kind).toBe('LBRACKET')
      expect(rb?.kind).toBe('RBRACKET')
    })
  })

  describe('エラー検出', () => {
    it('全角文字を検出してエラーを返す（実行は継続）', () => {
      const { errors } = tokenize('ＭＯＶ R1, #2')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message.ja).toContain('全角文字')
    })

    it('エラーがあってもスキャンを継続する', () => {
      const { tokens } = tokenize('MOV R1, #2\n@invalid\nHALT')
      const halt = tokens.find(t => t.value === 'HALT')
      expect(halt).toBeDefined()
    })
  })
})

describe('Parser', () => {
  describe('基本命令パース', () => {
    it('MOV Rd, #imm をパースする', () => {
      const { tokens } = tokenize('MOV R1, #2')
      const { instructions, errors } = parse(tokens)
      expect(errors).toHaveLength(0)
      expect(instructions[0].type).toBe('MOV')
      expect(instructions[0].operands[0]).toEqual({ type: 'register', name: 'R1' })
      expect(instructions[0].operands[1]).toEqual({ type: 'immediate', value: 2 })
    })

    it('MOV Rd, Rs をパースする', () => {
      const { tokens } = tokenize('MOV R2, R1')
      const { instructions, errors } = parse(tokens)
      expect(errors).toHaveLength(0)
      expect(instructions[0].operands[1]).toEqual({ type: 'register', name: 'R1' })
    })

    it('ADD Rd, Rs1, Rs2 をパースする', () => {
      const { tokens } = tokenize('ADD R3, R1, R2')
      const { instructions, errors } = parse(tokens)
      expect(errors).toHaveLength(0)
      expect(instructions[0].type).toBe('ADD')
      expect(instructions[0].operands).toHaveLength(3)
    })

    it('ADD Rd, Rs, #imm をパースする', () => {
      const { tokens } = tokenize('ADD R1, R1, #5')
      const { instructions, errors } = parse(tokens)
      expect(errors).toHaveLength(0)
      expect(instructions[0].operands[2]).toEqual({ type: 'immediate', value: 5 })
    })

    it('HALT をパースする（オペランドなし）', () => {
      const { tokens } = tokenize('HALT')
      const { instructions, errors } = parse(tokens)
      expect(errors).toHaveLength(0)
      expect(instructions[0].type).toBe('HALT')
      expect(instructions[0].operands).toHaveLength(0)
    })

    it('sourceLine が正しく設定される', () => {
      const { tokens } = tokenize('MOV R1, #2\nHALT')
      const { instructions } = parse(tokens)
      expect(instructions[0].sourceLine).toBe(1)
      expect(instructions[1].sourceLine).toBe(2)
    })
  })

  describe('ラベル', () => {
    it('ラベル定義が labels Map に記録される（大文字で正規化）', () => {
      const { tokens } = tokenize('loop:\nMOV R1, #0')
      const { labels } = parse(tokens)
      expect(labels.get('LOOP')).toBe(0)
    })

    it('ラベル参照が命令インデックスに解決される', () => {
      const src = 'MOV R1, #0\nloop:\nMOV R1, #1\nJMP loop'
      const { tokens } = tokenize(src)
      const { instructions, errors } = parse(tokens)
      expect(errors).toHaveLength(0)
      // JMP の operand は label → immediate (インデックス1)
      const jmp = instructions[instructions.length - 1]
      expect(jmp.type).toBe('JMP')
      expect(jmp.operands[0]).toEqual({ type: 'immediate', value: 1 })
    })

    it('未定義ラベルはエラーになる', () => {
      const { tokens } = tokenize('JMP nowhere')
      const { errors } = parse(tokens)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message.ja).toContain('NOWHERE')
    })
  })

  describe('エラーメッセージ', () => {
    it('タイポニーモニックの修正提案を出す（MOC → MOV）', () => {
      const { tokens } = tokenize('MOC R1, #2')
      const { errors } = parse(tokens)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].suggestion?.ja).toContain('MOV')
    })

    it('カンマ忘れのエラーを検出する', () => {
      const { tokens } = tokenize('MOV R1 #2')
      const { errors } = parse(tokens)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message.ja).toContain('カンマ')
    })

    it('allowedInstructions に含まれない命令はエラー', () => {
      const { tokens } = tokenize('LOAD R1, [R2]')
      const { errors } = parse(tokens, ['MOV', 'HALT'])
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message.ja).toContain('まだ使えません')
    })

    it('エラーメッセージには ja と en が両方ある', () => {
      const { tokens } = tokenize('MOC R1, #2')
      const { errors } = parse(tokens)
      expect(errors[0].message.ja).toBeTruthy()
      expect(errors[0].message.en).toBeTruthy()
    })
  })
})
