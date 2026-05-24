import { describe, it, expect } from 'vitest'
import { Cpu, execute } from '../../src/core/cpu/cpu.ts'

describe('MOV 命令', () => {
  it('MOV R1, 2 でR1に2が入る', () => {
    const result = execute('MOV R1, 2')
    expect(result.snapshot.registers.R1).toBe(2)
  })

  it('R0 にも普通に書ける', () => {
    const result = execute('MOV R0, 5')
    expect(result.snapshot.registers.R0).toBe(5)
  })

  it('レジスタ間コピー MOV R2, R1', () => {
    const result = execute('MOV R1, 7\nMOV R2, R1')
    expect(result.snapshot.registers.R2).toBe(7)
  })

  it('R0 から R4 まで全レジスタに書ける', () => {
    const result = execute(`
      MOV R0, 0
      MOV R1, 1
      MOV R2, 2
      MOV R3, 3
      MOV R4, 4
    `)
    expect(result.snapshot.registers.R0).toBe(0)
    expect(result.snapshot.registers.R1).toBe(1)
    expect(result.snapshot.registers.R2).toBe(2)
    expect(result.snapshot.registers.R3).toBe(3)
    expect(result.snapshot.registers.R4).toBe(4)
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
    cpu.load('MOV R1, 0') // R1 は初期値も 0 なので変化なし
    const result = cpu.stepForward()
    expect(result.changedRegisters).not.toContain('R1')
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

describe('条件付き分岐 (BEQ/BNE/BLT/BGT/BLE/BGE)', () => {
  it('BNE: 等しければジャンプしない（PC は次へ進む）', () => {
    // R1=R2=5, BNE は飛ばず MOV R3, 1 が実行される
    const result = execute(`
      MOV R1, 5
      MOV R2, 5
      MOV R3, 0
      CMP R1, R2
      BNE done
      MOV R3, 1
      done:
    `)
    expect(result.snapshot.registers.R3).toBe(1)
  })

  it('BNE: 等しくなければジャンプする', () => {
    // R1=5, R2=3, BNE で MOV R3, 1 をスキップ
    const result = execute(`
      MOV R1, 5
      MOV R2, 3
      MOV R3, 0
      CMP R1, R2
      BNE done
      MOV R3, 1
      done:
    `)
    expect(result.snapshot.registers.R3).toBe(0)
  })

  it('BEQ: 等しければジャンプする', () => {
    const result = execute(`
      MOV R1, 5
      MOV R2, 5
      MOV R3, 0
      CMP R1, R2
      BEQ done
      MOV R3, 1
      done:
    `)
    expect(result.snapshot.registers.R3).toBe(0)
  })

  it('BEQ: 等しくなければジャンプしない', () => {
    const result = execute(`
      MOV R1, 5
      MOV R2, 3
      MOV R3, 0
      CMP R1, R2
      BEQ done
      MOV R3, 1
      done:
    `)
    expect(result.snapshot.registers.R3).toBe(1)
  })

  it('JMP: 無条件ジャンプ', () => {
    const result = execute(`
      MOV R1, 0
      JMP skip
      MOV R1, 99
      skip:
      MOV R1, 1
    `)
    expect(result.snapshot.registers.R1).toBe(1)
  })

  it('ループ: 1から5までの累積', () => {
    // C: int sum=0,i=1; while(i!=6){sum+=i;i++;}
    const result = execute(`
      MOV R1, 0
      MOV R2, 1
      loop:
      ADD R1, R1, R2
      ADD R2, R2, 1
      CMP R2, 6
      BNE loop
    `)
    expect(result.snapshot.registers.R1).toBe(15) // 1+2+3+4+5
  })

  it('条件分岐が成立しないときに PC が無限ループしない（回帰テスト）', () => {
    // BNE が条件不成立で PC が進まないバグの回帰防止
    const cpu = new Cpu()
    cpu.load('MOV R1, 5\nMOV R2, 5\nCMP R1, R2\nBNE loop_back\nMOV R3, 1\nloop_back:')
    const result = cpu.runAll(100)
    expect(result.snapshot.registers.R3).toBe(1)
    // 100ステップ以内で停止していること（無限ループでない）
    expect(result.snapshot.halted || result.snapshot.pc >= 5).toBe(true)
  })
})

describe('instructionsUsed の追跡', () => {
  it('実行された命令タイプが instructionsUsed に記録される', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 5\nADD R1, R1, 3')
    cpu.runAll()
    expect(cpu.snapshot.instructionsUsed).toContain('MOV')
    expect(cpu.snapshot.instructionsUsed).toContain('ADD')
  })

  it('実行されていない命令は instructionsUsed に含まれない', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 5')
    cpu.runAll()
    expect(cpu.snapshot.instructionsUsed).not.toContain('ADD')
    expect(cpu.snapshot.instructionsUsed).not.toContain('SUB')
  })

  it('同じ命令を複数回実行しても1度だけ記録される', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 1\nMOV R2, 2\nMOV R3, 3')
    cpu.runAll()
    const movCount = cpu.snapshot.instructionsUsed.filter(t => t === 'MOV').length
    expect(movCount).toBe(1)
  })

  it('巻き戻し時に instructionsUsed が正しく復元される', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 5\nADD R1, R1, 3')
    cpu.stepForward() // MOV のみ
    expect(cpu.snapshot.instructionsUsed).toContain('MOV')
    expect(cpu.snapshot.instructionsUsed).not.toContain('ADD')
    cpu.stepForward() // ADD も
    expect(cpu.snapshot.instructionsUsed).toContain('ADD')
    cpu.stepBackward() // ADD 実行前に戻る
    expect(cpu.snapshot.instructionsUsed).toContain('MOV')
    expect(cpu.snapshot.instructionsUsed).not.toContain('ADD')
  })
})

describe('initialRegisters / initialMemory', () => {
  it('initialRegisters を渡すと該当レジスタに初期値がセットされる', () => {
    const cpu = new Cpu()
    cpu.load('MOV R3, R1', undefined, undefined, { R1: 42, R2: 7 })
    expect(cpu.snapshot.registers.R1).toBe(42)
    expect(cpu.snapshot.registers.R2).toBe(7)
    cpu.runAll()
    expect(cpu.snapshot.registers.R3).toBe(42)
  })

  it('initialMemory を渡すと該当アドレスに初期値がセットされる', () => {
    const cpu = new Cpu()
    cpu.load('', undefined, [{ address: 0x10, value: 99 }])
    expect(cpu.snapshot.memory[0x10]).toBe(99)
  })
})

describe('LOAD / STORE 命令', () => {
  it('STORE でメモリに書き込み、LOAD で読み出せる', () => {
    const result = execute(`
      MOV R1, 42
      MOV R2, 16
      STORE R1, [R2]
      LOAD R3, [R2]
    `)
    expect(result.snapshot.registers.R3).toBe(42)
  })

  it('LOAD with offset: [R2 + 4]', () => {
    const cpu = new Cpu()
    cpu.load('LOAD R1, [R2 + 4]', undefined, [{ address: 4, value: 123 }])
    cpu.runAll()
    expect(cpu.snapshot.registers.R1).toBe(123)
  })

  it('STORE with offset: [R2 + 2]', () => {
    const result = execute(`
      MOV R1, 7
      MOV R2, 8
      STORE R1, [R2 + 2]
    `)
    expect(result.snapshot.memory[10]).toBe(7) // 8 + 2
  })
})

describe('CALL / RET / PUSH / POP', () => {
  it('CALL は LR に戻り先を保存してジャンプする', () => {
    const cpu = new Cpu()
    cpu.load(`
      MOV R1, 1
      CALL sub
      MOV R3, R1
      HALT
      sub:
      MOV R1, 99
      RET
    `)
    cpu.runAll()
    expect(cpu.snapshot.registers.R3).toBe(99) // sub が R1=99 にして RET で戻った
  })

  it('PUSH と POP でスタック経由の値の保存・復元', () => {
    const result = execute(`
      MOV R1, 42
      PUSH R1
      MOV R1, 0
      POP R2
    `)
    expect(result.snapshot.registers.R2).toBe(42)
  })

  it('PUSH 後の SP は -2 される', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 1\nPUSH R1')
    const initialSp = cpu.snapshot.sp
    cpu.runAll()
    expect(cpu.snapshot.sp).toBe(initialSp - 2)
  })

  it('POP 後の SP は +2 される', () => {
    const cpu = new Cpu()
    cpu.load('MOV R1, 1\nPUSH R1\nPOP R2')
    cpu.runAll()
    expect(cpu.snapshot.sp).toBe(0xFFFE)
  })
})

describe('SHL / SHR / 論理演算', () => {
  it('SHL: 左シフト', () => {
    const result = execute('MOV R1, 1\nSHL R2, R1, 3')
    expect(result.snapshot.registers.R2).toBe(8)
  })

  it('SHR: 右シフト', () => {
    const result = execute('MOV R1, 16\nSHR R2, R1, 2')
    expect(result.snapshot.registers.R2).toBe(4)
  })

  it('AND: ビット論理積', () => {
    const result = execute('MOV R1, 12\nMOV R2, 10\nAND R3, R1, R2')
    expect(result.snapshot.registers.R3).toBe(12 & 10) // 8
  })

  it('OR: ビット論理和', () => {
    const result = execute('MOV R1, 12\nMOV R2, 10\nOR R3, R1, R2')
    expect(result.snapshot.registers.R3).toBe(12 | 10) // 14
  })

  it('XOR: ビット排他的論理和', () => {
    const result = execute('MOV R1, 12\nMOV R2, 10\nXOR R3, R1, R2')
    expect(result.snapshot.registers.R3).toBe(12 ^ 10) // 6
  })

  it('NOT: ビット反転（16ビットマスク）', () => {
    const result = execute('MOV R1, 0\nNOT R2, R1')
    expect(result.snapshot.registers.R2).toBe(0xFFFF)
  })
})
