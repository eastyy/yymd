import { getMarkdown, replaceAll } from "@milkdown/utils";
import { editorViewCtx } from "@milkdown/core";
import { useAppStore, displayName } from "../store/useAppStore";
import { getCurrentEditor } from "./editorRef";
import { countStats } from "./stats";
import { isTauri, readFile, writeFile, pickOpenFile, pickSaveFile } from "./bridge";
import { wrapHtmlDocument, downloadHtml, printToPdf, type ExportTheme } from "./export";

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

/** 导出当前文档为 HTML / PDF(需在 WYSIWYG 视图) */
export function exportCurrent(kind: "html" | "pdf") {
  const state = useAppStore.getState();
  const bodyHtml = document.querySelector(".ProseMirror")?.innerHTML ?? "";
  const title = displayName(state.filePath);
  const theme: ExportTheme = state.theme === "github-dark" || state.theme === "night" ? "github-dark" : "github";
  const html = wrapHtmlDocument(bodyHtml, title, theme);
  if (kind === "html") {
    downloadHtml(title.replace(/\.(md|markdown|mdown|txt)$/i, "") + ".html", html);
  } else {
    printToPdf(html);
  }
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

import type { EditorView } from "@milkdown/prose/view";

/** 把编辑器滚动到文档内某个位置 */
function scrollViewToPos(view: EditorView, pos: number) {
  const coords = view.coordsAtPos(pos);
  const scroller = (view.dom.closest(".editor-scroll") as HTMLElement) || document.scrollingElement;
  if (scroller) {
    const rect = (scroller as HTMLElement).getBoundingClientRect();
    scroller.scrollTo({ top: coords.top - rect.top + scroller.scrollTop - 80, behavior: "smooth" });
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
    scrollViewToPos(view, pos);
  } catch {
    /* ignore */
  }
}

/** 滚动到标题文本匹配的位置(文档内锚点链接用) */
export async function scrollToHeading(text: string) {
  const ed = getCurrentEditor();
  if (!ed) return;
  const wanted = text.trim().toLowerCase();
  if (!wanted) return;
  try {
    const view = await ed.action((ctx) => ctx.get(editorViewCtx));
    let pos = -1;
    view.state.doc.descendants((node, p) => {
      if (pos < 0 && node.type.name === "heading") {
        const t = node.textContent.trim().toLowerCase();
        if (t === wanted) pos = p;
      }
    });
    if (pos >= 0) scrollViewToPos(view, pos);
  } catch {
    /* ignore */
  }
}
