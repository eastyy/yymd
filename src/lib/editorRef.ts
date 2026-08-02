import type { Editor } from "@milkdown/core";

let current: Editor | null = null;

export function setCurrentEditor(editor: Editor | null) {
  current = editor;
}

export function getCurrentEditor(): Editor | null {
  return current;
}
