import { useEffect, useRef, useState } from "react";
import { editorViewCtx } from "@milkdown/core";
import type { EditorView } from "@milkdown/prose/view";
import { useAppStore } from "../store/useAppStore";
import { getCurrentEditor } from "../lib/editorRef";
import {
  setSearchQuery,
  searchNext,
  searchPrev,
  clearSearch,
  getSearchState,
} from "../lib/searchPlugin";

async function getView(): Promise<EditorView | null> {
  const ed = getCurrentEditor();
  if (!ed) return null;
  return ed.action((ctx) => ctx.get(editorViewCtx));
}

export default function SearchBar() {
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function refresh(view: EditorView) {
    const s = getSearchState(view);
    setTotal(s?.results.length ?? 0);
    setCurrent(s && s.active >= 0 ? s.active + 1 : 0);
  }

  async function onChange(value: string) {
    setQuery(value);
    const view = await getView();
    if (!view) return;
    setSearchQuery(view, value);
    refresh(view);
  }

  async function next() {
    const view = await getView();
    if (!view) return;
    searchNext(view);
    refresh(view);
  }

  async function prev() {
    const view = await getView();
    if (!view) return;
    searchPrev(view);
    refresh(view);
  }

  async function close() {
    const view = await getView();
    if (view) {
      clearSearch(view);
      view.focus();
    }
    setSearchOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) prev();
      else next();
    }
  }

  return (
    <div className="searchbar">
      <input
        ref={inputRef}
        value={query}
        placeholder="在文档中查找…"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {query && (
        <span className="search-count">
          {total === 0 ? "无结果" : `${current}/${total}`}
        </span>
      )}
      <button onClick={prev} title="上一个 (Shift+Enter)">
        ↑
      </button>
      <button onClick={next} title="下一个 (Enter)">
        ↓
      </button>
      <button onClick={close} title="关闭 (Esc)">
        ✕
      </button>
    </div>
  );
}
