import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { isTauri, listFilesRecursive, type DirEntry } from "../lib/bridge";
import { openFile } from "../lib/fileActions";

function shortName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
function shortDir(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.slice(Math.max(0, parts.length - 3), -1).join("/");
}

/** 快速打开(Cmd+P):最近文件 + 当前文件夹下所有 md 文件,模糊过滤 */
export default function QuickOpen() {
  const setQuickOpenOpen = useAppStore((s) => s.setQuickOpenOpen);
  const recentFiles = useAppStore((s) => s.recentFiles);
  const rootDir = useAppStore((s) => s.rootDir);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // query 变化时重置高亮项(渲染期调整,代替 effect 内 setState)
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setActive(0);
  }
  const [files, setFiles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isTauri || !rootDir) return;
    let cancelled = false;
    listFilesRecursive(rootDir, 800)
      .then((entries: DirEntry[]) => {
        if (!cancelled) setFiles(entries.map((e) => e.path));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [rootDir]);

  const items = useMemo(() => {
    const all = [...recentFiles, ...files.filter((p) => !recentFiles.includes(p))];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 30);
    return all
      .filter((p) => p.toLowerCase().includes(q))
      .slice(0, 30);
  }, [recentFiles, files, query]);

  async function choose(path: string) {
    setQuickOpenOpen(false);
    try {
      await openFile(path);
      useAppStore.getState().addRecent(path);
    } catch (e) {
      console.error(e);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuickOpenOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) void choose(items[active]);
    }
  }

  return (
    <div className="quickopen-mask" onClick={() => setQuickOpenOpen(false)}>
      <div className="quickopen" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          placeholder="输入文件名快速打开…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <ul className="quickopen-list">
          {items.length === 0 && <li className="quickopen-empty">无匹配文件</li>}
          {items.map((p, i) => (
            <li
              key={p}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onClick={() => void choose(p)}
            >
              <span className="qo-name">{shortName(p)}</span>
              <span className="qo-dir">{shortDir(p)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
