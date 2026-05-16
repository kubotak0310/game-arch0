import { readonly, ref } from 'vue'

const _isDebugMode = ref(new URLSearchParams(window.location.search).has('debug'))

export function useDebugMode() {
  return { isDebugMode: readonly(_isDebugMode) }
}
