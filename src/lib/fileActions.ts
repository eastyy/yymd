import { getMarkdown, replaceAll } from "@milkdown/utils";
import { editorViewCtx } from "@milkdown/core";
import { useAppStore, displayName } from "../store/useAppStore";
import { getCurrentEditor } from "./editorRef";
import { countStats } from "./stats";
import {
  isTauri,
  readFile,
  writeFile,
  pickOpenFile,
  pickSaveFile,
} from "./bridge";

function setDocTitle(name: string, dirty: boolean) {
  const title = `${dirty ? "● " : ""}${name} - Yymd`;
  document.title = title;
  if (isTauri) {
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      getCurrentWindow().setTitle(title).catch(() => {});
    });
  }
}

export function syncStats(md: string) {
  const stats = countStats(md);
  useAppStore.getState().setStats(stats.words, stats.chars);
}

export async function newDoc() {
  const s = useAppStore.getState();
  s.reset();
  s.setMarkdown("");
  const ed = getCurrentEditor();
  if (ed) ed.action(replaceAll(""));
  syncStats("");
  setDocTitle("未命名", false);
}

export async function openFile(path: string) {
  const content = await readFile(path);
  const s = useAppStore.getState();
  s.setFilePath(path);
  s.setMarkdown(content);
  s.setDirty(false);
  const ed = getCurrentEditor();
  if (ed) ed.action(replaceAll(content));
  syncStats(content);
  useAppStore.getState().addRecent(path);
  setDocTitle(displayName(path), false);
}

export async function openDoc() {
  if (!isTauri) return;
  const path = await pickOpenFile();
  if (path) await openFile(path);
}

export async function saveDoc(): Promise<void> {
  const s = useAppStore.getState();
  const ed = getCurrentEditor();
  const md = ed && s.viewMode === "wysiwyg" ? await ed.action(getMarkdown()) : s.markdown;
  let path = s.filePath;
  if (!path) {
    if (!isTauri) return;
    path = await pickSaveFile();
    if (!path) return;
  }
  await writeFile(path, md);
  useAppStore.getState().setFilePath(path);
  useAppStore.getState().setDirty(false);
  setDocTitle(displayName(path), false);
}

export async function saveAsDoc(): Promise<void> {
  if (!isTauri) return;
  const s = useAppStore.getState();
  const ed = getCurrentEditor();
  const md = ed && s.viewMode === "wysiwyg" ? await ed.action(getMarkdown()) : s.markdown;
  const path = await pickSaveFile(displayName(s.filePath));
  if (!path) return;
  await writeFile(path, md);
  useAppStore.getState().setFilePath(path);
  useAppStore.getState().setDirty(false);
  setDocTitle(displayName(path), false);
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/** 防抖自动保存(仅在已存在文件路径时生效) */
export function scheduleAutoSave(delay = 1500) {
  if (!useAppStore.getState().filePath) return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    void saveDoc();
  }, delay);
}

export async function toggleSourceMode() {
  const s = useAppStore.getState();
  if (s.viewMode === "wysiwyg") {
    const ed = getCurrentEditor();
    if (ed) {
      const md = await ed.action(getMarkdown());
      useAppStore.getState().setMarkdown(md);
      syncStats(md);
    }
    useAppStore.getState().setViewMode("source");
  } else {
    useAppStore.getState().setViewMode("wysiwyg");
    // EditorPane 重新挂载时会以 store.markdown 作为初始值
  }
}

/** 滚动编辑器到指定行(大纲点击用) */
export async function scrollToLine(line: number) {
  const ed = getCurrentEditor();
  if (!ed) return;
  try {
    const view = await ed.action((ctx) => ctx.get(editorViewCtx));
    const doc = view.state.doc;
    const text = doc.textBetween(0, doc.content.size, "\n");
    const lines = text.split("\n");
    let pos = 0;
    const target = Math.min(line, lines.length - 1);
    for (let i = 0; i < target; i++) pos += lines[i].length + 1;
    pos = Math.min(pos, doc.content.size - 1);
    const coords = view.coordsAtPos(pos);
    const scroller = (view.dom.closest(".editor-scroll") as HTMLElement) || document.scrollingElement;
    if (scroller) {
      const rect = (scroller as HTMLElement).getBoundingClientRect();
      scroller.scrollTo({ top: coords.top - rect.top + scroller.scrollTop - 80, behavior: "smooth" });
    }
  } catch {
    /* ignore */
  }
}
