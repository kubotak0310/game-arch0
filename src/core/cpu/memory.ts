/**
 * 16ビット語×64K の主記憶を扱うシンプルなラッパー。
 *
 * - データ実体は `Uint16Array` で確保する。
 * - 命令メモリは別管理（`Cpu` 側で `Instruction[]` を保持）。本クラスは
 *   `LOAD` / `STORE` のデータアクセス専用。
 * - アドレス・値とも 16bit にマスクして格納するため、配列外アクセスは発生しない。
 */
export class Memory {
  private readonly data: Uint16Array

  /**
   * @param sizeWords ワード数（16bit 単位）。デフォルトは 0x10000 = 64K ワード。
   */
  constructor(sizeWords = 0x10000) {
    this.data = new Uint16Array(sizeWords)
  }

  /**
   * 指定アドレスから 1 ワード読む。アドレスは下位 16bit のみ使う。
   */
  read(address: number): number {
    return this.data[address & 0xFFFF]
  }

  /**
   * 指定アドレスに 1 ワード書く。値もアドレスも 16bit にマスクする。
   */
  write(address: number, value: number): void {
    this.data[address & 0xFFFF] = value & 0xFFFF
  }

  /**
   * 現在のメモリ内容をコピーした新しい `Uint16Array` を返す。
   * スナップショット保存に使い、参照渡しによる過去状態の破壊を防ぐ。
   */
  clone(): Uint16Array {
    return new Uint16Array(this.data)
  }

  /**
   * 既存スナップショットからメモリ内容を復元する（巻き戻し用）。
   * 元の `Uint16Array` を保ったまま値だけ上書きするため、参照は変わらない。
   */
  loadSnapshot(data: Uint16Array): void {
    this.data.set(data)
  }
}
