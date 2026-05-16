<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { minimalSetup, EditorView } from 'codemirror'
import { EditorState, StateField, StateEffect, Compartment } from '@codemirror/state'
import { Decoration, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'

const props = defineProps<{
  modelValue: string
  activeLine?: number | null  // 1始まりのソース行番号
  lineToPc?: Map<number, number>  // ソース行番号 → PC インデックス
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── アクティブ行ハイライト用 StateEffect / StateField ──

const setActiveLine = StateEffect.define<number | null>()

const activeLineDecoration = Decoration.line({
  attributes: { class: 'cm-executing-line' },
})

const activeLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setActiveLine)) {
        if (effect.value === null) return Decoration.none
        try {
          const line = tr.state.doc.line(effect.value)
          return Decoration.set([activeLineDecoration.range(line.from)])
        } catch {
          return Decoration.none
        }
      }
    }
    return deco.map(tr.changes)
  },
  provide: f => EditorView.decorations.from(f),
})

// ── PC 行番号 ──

const lineNumCompartment = new Compartment()

function makePcLineNumbers(map: Map<number, number> | undefined) {
  return lineNumbers({
    formatNumber: (lineNo: number) => {
      const pc = map?.get(lineNo)
      return pc !== undefined ? String(pc) : ''
    },
  })
}

// ── エディタ本体 ──

const container = shallowRef<HTMLDivElement | null>(null)
let view: EditorView | null = null

onMounted(() => {
  if (!container.value) return

  const css = (v: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim()

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      minimalSetup,
      lineNumCompartment.of(makePcLineNumbers(props.lineToPc)),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      activeLineField,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '16px',
          fontFamily: 'ui-monospace, Consolas, monospace',
          backgroundColor: css('--color-surface'),
          color: css('--color-text'),
        },
        '.cm-content': { caretColor: css('--color-text') },
        '.cm-cursor': { borderLeftColor: css('--color-text') },
        '.cm-gutters': {
          backgroundColor: css('--color-surface-2'),
          borderRight: `1px solid ${css('--color-border')}`,
          color: css('--color-text-tertiary'),
        },
        '.cm-activeLineGutter': { backgroundColor: css('--color-surface-3') },
        '.cm-activeLine': { backgroundColor: `${css('--color-surface-3')}66` },
        '.cm-selectionBackground, ::selection': { backgroundColor: `${css('--color-selection')} !important` },
        '.cm-focused .cm-selectionBackground': { backgroundColor: css('--color-selection') },
        '.cm-executing-line': {
          backgroundColor: `${css('--color-accent-amber')}1f`,
          boxShadow: `inset 3px 0 0 ${css('--color-accent-amber')}`,
        },
        '.cm-executing-line .cm-activeLineGutter': {
          backgroundColor: `${css('--color-accent-amber')}1f`,
        },
      }, { dark: true }),
    ],
  })

  view = new EditorView({ state, parent: container.value })
})

// ソース変更の同期
watch(() => props.modelValue, value => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current !== value) {
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
  }
})

// アクティブ行ハイライトの更新
watch(() => props.activeLine, line => {
  if (!view) return
  view.dispatch({ effects: setActiveLine.of(line ?? null) })
})

// PC 行番号の更新（ソース変更のたびに再設定）
watch(() => props.lineToPc, map => {
  if (!view) return
  view.dispatch({ effects: lineNumCompartment.reconfigure(makePcLineNumbers(map)) })
})

onBeforeUnmount(() => {
  view?.destroy()
})
</script>

<template>
  <div ref="container" class="editor-container" />
</template>

<style scoped>
.editor-container {
  height: 100%;
  overflow: hidden;
}
.editor-container :deep(.cm-editor) {
  height: 100%;
}
.editor-container :deep(.cm-scroller) {
  overflow: auto;
}
</style>
