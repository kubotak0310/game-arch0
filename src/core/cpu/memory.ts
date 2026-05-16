export class Memory {
  private readonly data: Uint16Array

  constructor(sizeWords = 0x10000) {
    this.data = new Uint16Array(sizeWords)
  }

  read(address: number): number {
    return this.data[address & 0xFFFF]
  }

  write(address: number, value: number): void {
    this.data[address & 0xFFFF] = value & 0xFFFF
  }

  clone(): Uint16Array {
    return new Uint16Array(this.data)
  }

  loadSnapshot(data: Uint16Array): void {
    this.data.set(data)
  }
}
