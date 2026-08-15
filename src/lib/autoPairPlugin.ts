/**
 * 选区自动包裹:有选中文本时按下成对符号(引号/括号/反引号等),
 * 用该符号包裹选区而不是替换它。Typora 行为。
 */
import { $prose } from "@milkdown/utils";
import { keymap } from "@milkdown/prose/keymap";
import type { EditorState, Transaction } from "@milkdown/prose/state";

const PAIRS: Record<string, [string, string]> = {
  "(": ["(", ")"],
  "[": ["[", "]"],
  "{": ["{", "}"],
  '"': ['"', '"'],
  "'": ["'", "'"],
  "`": ["`", "`"],
  "*": ["*", "*"],
  "_": ["_", "_"],
};

function wrapSelection(state: EditorState, dispatch: ((tr: Transaction) => void) | undefined, pair: [string, string]): boolean {
  const { from, to, empty } = state.selection;
  if (empty) return false;
  if (!dispatch) return true;
  const text = state.doc.textBetween(from, to);
  dispatch(state.tr.insertText(`${pair[0]}${text}${pair[1]}`, from, to));
  return true;
}

export const autoPairPlugin = $prose(() => {
  const bindings: Record<string, (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean> = {};
  for (const [ch, pair] of Object.entries(PAIRS)) {
    bindings[ch] = (state, dispatch) => wrapSelection(state, dispatch, pair);
  }
  return keymap(bindings);
});
