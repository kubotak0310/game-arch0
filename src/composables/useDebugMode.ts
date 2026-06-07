/**
 * デバッグモードの検出。
 *
 * URL クエリに `?debug` が含まれているときに ON。`true` になると、
 * 各章の `unlockedInstructions` を無視して全命令を使えるようにしたり、
 * 隠し UI（フラグ・スタック）を全章で表示したりする。
 *
 * モジュール読み込み時に 1 度だけ判定するため、URL を後から書き換えても反映されない（仕様）。
 */
import { readonly, ref } from 'vue'

const _isDebugMode = ref(new URLSearchParams(window.location.search).has('debug'))

/** デバッグモードの値を readonly な ref として取り出す。 */
export function useDebugMode() {
  return { isDebugMode: readonly(_isDebugMode) }
}
