<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { minimalSetup, EditorView } from 'codemirror'
import { EditorState, StateField, StateEffect, Compartment, Prec } from '@codemirror/state'
import { Decoration, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { autocompletion, completionKeymap, acceptCompletion } from '@codemirror/autocomplete'
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { keymap } from '@codemirror/view'

const props = defineProps<{
  modelValue: string
  activeLine?: number | null
  lineToPc?: Map<number, number>
  errorLines?: readonly number[]
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── 補完候補 ──

const ALL_MNEMONICS = [
  'MOV', 'ADD', 'SUB',
  'LOAD', 'STORE',
  'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP',
  'CALL', 'RET', 'PUSH', 'POP',
  'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR',
  'HALT',
]
const ALL_REGISTERS = ['R1', 'R2', 'R3', 'R4', 'R5', 'SP', 'LR']

function makeCompletionSource(instructions: readonly string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos)
    const col = context.pos - line.from
    const textBefore = line.text.slice(0, col)
    const trimmed = textBefore.trimStart()

    // コメント行は補完しない
    if (trimmed.startsWith(';')) return null

    // ラベル定義のプレフィックスを除去: "loop: "
    const noLabel = trimmed.replace(/^[A-Za-z_][A-Za-z0-9_]*:\s*/, '')

    const hasSpace = /\s/.test(noLabel)

    if (!hasSpace) {
      // ニーモニック入力中
      const word = context.matchBefore(/[A-Za-z][A-Za-z0-9]*/)
      if (!word && !context.explicit) return null
      return {
        from: word?.from ?? context.pos,
        options: instructions.map(inst => ({ label: inst, type: 'keyword' as const })),
        validFor: /^[A-Za-z0-9]*$/,
      }
    } else {
      // オペランド入力中（レジスタ補完）
      const word = context.matchBefore(/[A-Za-z][A-Za-z0-9]*/)
      if (!word) return null
      return {
        from: word.from,
        options: ALL_REGISTERS.map(r => ({ label: r, type: 'variable' as const })),
        validFor: /^[A-Za-z0-9]*$/,
      }
    }
  }
}

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

// ── エラー行ハイライト用 StateEffect / StateField ──

const setErrorLines = StateEffect.define<readonly number[]>()

const errorLineDecoration = Decoration.line({
  attributes: { class: 'cm-error-line' },
})

// エラー行番号を保持
const errorLinesState = StateField.define<readonly number[]>({
  create: () => [],
  update(lines, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorLines)) return effect.value
    }
    return lines
  },
})

// カーソルがいる行はハイライトしない（タイピング中の行は除外）
const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    if (!tr.effects.some(e => e.is(setErrorLines)) && !tr.selection && !tr.docChanged) {
      return deco.map(tr.changes)
    }
    const lines = tr.state.field(errorLinesState)
    const cursorLine = tr.state.doc.lineAt(tr.state.selection.main.head).number
    const decos = [...new Set(lines)]
      .filter(n => n !== cursorLine)
      .flatMap(n => {
        try { return [errorLineDecoration.range(tr.state.doc.line(n).from)] }
        catch { return [] }
      })
      .sort((a, b) => a.from - b.from)
    return Decoration.set(decos)
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
      errorLinesState,
      errorLineField,
      autocompletion({ override: [makeCompletionSource(ALL_MNEMONICS)] }),
      Prec.high(keymap.of([{ key: 'Tab', run: acceptCompletion }, ...completionKeymap])),
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
        '.cm-error-line': {
          backgroundColor: `${css('--color-accent-coral')}55`,
          boxShadow: `inset 3px 0 0 ${css('--color-accent-coral')}`,
        },
        // ── オートコンプリート ──
        '.cm-tooltip': {
          backgroundColor: css('--color-surface-2'),
          border: `1px solid ${css('--color-border')}`,
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        },
        '.cm-tooltip-autocomplete ul': {
          fontFamily: 'ui-monospace, Consolas, monospace',
          fontSize: '13px',
          padding: '4px',
          margin: '0',
        },
        '.cm-tooltip-autocomplete ul li': {
          padding: '4px 10px',
          borderRadius: '4px',
          color: css('--color-text'),
        },
        '.cm-tooltip-autocomplete ul li[aria-selected]': {
          backgroundColor: `${css('--color-accent-blue')}33`,
          color: css('--color-text'),
        },
        '.cm-completionMatchedText': {
          color: css('--color-accent-blue'),
          textDecoration: 'none',
          fontWeight: '600',
        },
        '.cm-completionIcon': {
          opacity: '0.5',
          paddingRight: '4px',
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

// PC 行番号の更新
watch(() => props.lineToPc, map => {
  if (!view) return
  view.dispatch({ effects: lineNumCompartment.reconfigure(makePcLineNumbers(map)) })
})

// エラー行ハイライトの更新
watch(() => props.errorLines, lines => {
  if (!view) return
  view.dispatch({ effects: setErrorLines.of(lines ?? []) })
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
