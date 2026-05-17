import { describe, it, expect } from 'vitest'
import { Cpu, execute } from '../../src/core/cpu/cpu.ts'

describe('MOV 命令', () => {
  it('MOV R1, 2 でR1に2が入る', () => {
    const result = execute('MOV R1, 2')
    expect(result.snapshot.registers.R1).toBe(2)
  })

  it('R0への書き込みは無視される', () => {
    const result = execute('MOV R0, 5')
    expect(result.snapshot.registers.R0).toBe(0)
  })

  it('レジスタ間コピー MOV R2, R1', () => {
    const result = execute('MOV R1, 7\nMOV R2, R1')
    expect(result.snapshot.registers.R2).toBe(7)
  })

  it('R5まで全レジスタに書ける', () => {
    const result = execute(`
      MOV R1, 1
      MOV R2, 2
      MOV R3, 3
      MOV R4, 4
      MOV R5, 5
    `)
    expect(result.snapshot.registers.R1).toBe(1)
    expect(result.snapshot.registers.R2).toBe(2)
    expect(result.snapshot.registers.R3).toBe(3)
    expect(result.snapshot.registers.R4).toBe(4)
    expect(result.snapshot.registers.R5).toBe(5)
  })
})

describe('ADD 命令', () => {
  it('ADD R3, R1, R2 でR3にR1+R2が入る', () => {
    const result = execute(`
      MOV R1, 2
      MOV R2, 3
      ADD R3, R1, R2
    `)
    expect(result.snapshot.registers.R3).toBe(5)
  })

  it('ADD 即値形式: ADD R1, R1, 10', () => {
    const result = execute('MOV R1, 5\nADD R1, R1, 10')
    expect(result.snapshot.registers.R1).toBe(15)
  })

  it('16ビット折り返し: 0xFFFF + 1 = 0', () => {
    const result = execute('MOV R1, 0xFFFF\nADD R1, R1, 1')
    expect(result.snapshot.registers.R1).toBe(0)
  })

  it('キャリーフラグ: 0xFFFF + 1 で C=true', () => {
    const result = execute('MOV R1, 0xFFFF\nADD R2, R1, 1')
    expect(result.snapshot.flags.C).toBe(true)
  })

  it('ゼロフラグ: 結果が0でZ=true', () => {
    const result = execute('MOV R1, 0xFFFF\nADD R2, R1, 1')
    expect(result.snapshot.flags.Z).toBe(true)
  })

  it('ネガティブフラグ: bit15が1でN=true', () => {
    const result = execute('MOV R1, 0x7FFF\nADD R1, R1, 1')
    expect(result.snapshot.flags.N).toBe(true)
  })

  it('オーバーフローフラグ V: 正+正=負でV=true', () => {
    // 0x7FFF + 1 = 0x8000 (符号付き: 32767 + 1 = -32768)
    const result = execute('MOV R1, 0x7FFF\nADD R1, R1, 1')
    expect(result.snapshot.flags.V).toBe(true)
  })
})

describe('SUB 命令', () => {
  it('基本減算: 5 - 3 = 2', () => {
    const result = execute('MOV R1, 5\nMOV R2, 3\nSUB R3, R1, R2')
    expect(result.snapshot.registers.R3).toBe(2)
  })

  it('即値形式: SUB R1, R1, 3', () => {
    const result = execute('MOV R1, 10\nSUB R1, R1, 3')
    expect(result.snapshot.registers.R1).toBe(7)
  })

  it('ゼロフラグ: 3 - 3 = 0 でZ=true', () => {
    const result = execute('MOV R1, 3\nSUB R1, R1, 3')
    expect(result.snapshot.flags.Z).toBe(true)
  })

  it('ネガティブフラグ: 2 - 3 でN=true', () => {
    const result = execute('MOV R1, 2\nSUB R1, R1, 3')
    expect(result.snapshot.flags.N).toBe(true)
  })

  it('ボロー(C): a < b で C=true', () => {
    const result = execute('MOV R1, 2\nSUB R1, R1, 3')
    expect(result.snapshot.flags.C).toBe(true)
  })

  it('16ビット折り返し: 0 - 1 = 0xFFFF', () => {
    const result = execute('MOV R1, 0\nSUB R1, R1, 1')
    expect(result.snapshot.registers.R1).toBe(0xFFFF)
  })
})

describe('HALT 命令', () => {
  it('HALT で実行が停止する', () => {
    const result = execute('HALT\nMOV R1, 99')
    expect(result.snapshot.halted).toBe(true)
    expect(result.snapshot.registers.R1).toBe(0) // HALT後の命令は実行されない
  })

  it('HALT後に stepForward しても状態が変わらない', () => {
    const cpu = new Cpu()
    cpu.load('HALT')
    cpu.stepForward() // HALT を実行
    const snap1 = cpu.snapshot
    cpu.stepForward() // 追加の stepForward
    const snap2 = cpu.snapshot
    expect(snap1.registers.R1).toBe(snap2.registers.R1)
  })
})

describe('ステップ実行と巻き戻し', () => {
  it('ステップ実行で巻き戻しができる', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 2\nMOV R2, 3')
    cpu.stepForward()
    expect(cpu.snapshot.registers.R1).toBe(2)
    cpu.stepBackward()
    expect(cpu.snapshot.registers.R1).toBe(0)
  })

  it('複数ステップの巻き戻し', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 1\nMOV R2, 2\nMOV R3, 3')
    cpu.stepForward()
    cpu.stepForward()
    cpu.stepForward()
    cpu.stepBackward()
    cpu.stepBackward()
    expect(cpu.snapshot.registers.R1).toBe(1)
    expect(cpu.snapshot.registers.R2).toBe(0)
    expect(cpu.snapshot.registers.R3).toBe(0)
  })

  it('stepBackward() が先頭で null を返す', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 1')
    const result = cpu.stepBackward()
    expect(result).toBeNull()
  })

  it('reset() が初期状態に戻す', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 42\nMOV R2, 99')
    cpu.stepForward()
    cpu.stepForward()
    cpu.reset()
    expect(cpu.snapshot.registers.R1).toBe(0)
    expect(cpu.snapshot.registers.R2).toBe(0)
  })

  it('巻き戻し後の stepForward で履歴が分岐する', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 1\nMOV R2, 2')
    cpu.stepForward() // R1 = 1
    cpu.stepBackward() // 巻き戻し
    cpu.stepForward() // 再び R1 = 1 (R2への分岐は破棄)
    expect(cpu.snapshot.registers.R1).toBe(1)
    expect(cpu.snapshot.registers.R2).toBe(0)
  })
})

describe('ExecutionResult の差分', () => {
  it('changedRegisters に変化したレジスタが含まれる', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 5')
    const result = cpu.stepForward()
    expect(result.changedRegisters).toContain('R1')
    expect(result.changedRegisters).not.toContain('R2')
  })

  it('changedFlags に変化したフラグが含まれる', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 0xFFFF\nADD R1, R1, 1')
    cpu.stepForward() // MOV
    const result = cpu.stepForward() // ADD (C, Z flags change)
    expect(result.changedFlags).toContain('C')
    expect(result.changedFlags).toContain('Z')
  })

  it('変化なしなら changedRegisters は空', () => {
    const cpu = new Cpu()
    cpu.load('MOV R0, 5') // R0は書き込み破棄なので変化なし
    const result = cpu.stepForward()
    expect(result.changedRegisters).not.toContain('R0')
  })
})

describe('パースエラー', () => {
  it('パースエラーがある場合 cpu.errors に格納される', () => {
    const cpu = new Cpu()
    cpu.load('MOC R1, 2') // typo
    expect(cpu.errors.length).toBeGreaterThan(0)
  })

  it('パースエラーがあっても runAll は実行される（命令なし）', () => {
    const cpu = new Cpu()
    cpu.load('MOC R1, 2')
    const result = cpu.runAll()
    expect(result.snapshot.registers.R1).toBe(0) // 命令なしなので変化なし
  })
})
