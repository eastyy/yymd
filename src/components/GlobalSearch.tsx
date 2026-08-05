import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { isTauri, listFilesRecursive, readFile, type DirEntry } from "../lib/bridge";
import { openFile, scrollToLine } from "../lib/fileActions";
import { searchLines, groupResults, type FileResult } from "../lib/globalSearch";

function shortName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

/** 文件夹全局搜索(⌘⇧F):搜索 rootDir 下所有 markdown 文件内容 */
export default function GlobalSearch() {
  const rootDir = useAppStore((s) => s.rootDir);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const q = query.trim();
    if (!q || !isTauri || !rootDir) {
      setResults(null);
      setStatus("");
      return;
    }
    setSearching(true);
    timer.current = window.setTimeout(async () => {
      try {
        const entries: DirEntry[] = await listFilesRecursive(rootDir, 800);
        const hits = [];
        let scanned = 0;
        for (const e of entries) {
          if (scanned++ > 800) break;
          try {
            const content = await readFile(e.path);
            hits.push(...searchLines(e.path, content, q, 20));
            if (hits.length > 500) break;
          } catch {
            /* 二进制/不可读文件跳过 */
          }
        }
        const grouped = groupResults(hits).slice(0, 100);
        setResults(grouped);
        const total = grouped.reduce((n, g) => n + g.hits.length, 0);
        setStatus(`扫描 ${scanned} 个文件,命中 ${total} 处(最多显示前 100 个文件)`);
      } catch (e) {
        setStatus(String(e));
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query, rootDir]);

  function close() {
    useAppStore.getState().setGlobalSearchOpen(false);
  }

  async function goto(file: string, line: number) {
    close();
    try {
      await openFile(file);
      // 等编辑器替换完成后再滚动
      await scrollToLine(line);
    } catch (e) {
      console.error(e);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className="quickopen-mask" onClick={close}>
      <div className="quickopen globalsearch" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          placeholder={rootDir ? "在文件夹中搜索…" : "请先打开一个文件夹"}
          disabled={!rootDir}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="gs-status">
          {searching ? "搜索中…" : status}
        </div>
        <div className="gs-results">
          {results && results.length === 0 && <div className="quickopen-empty">无匹配结果</div>}
          {results?.map((g) => (
            <div key={g.file} className="gs-file">
              <div className="gs-filename">{shortName(g.file)}</div>
              {g.hits.map((h) => (
                <div
                  key={`${h.file}:${h.line}`}
                  className="gs-hit"
                  onClick={() => void goto(h.file, h.line)}
                >
                  <span className="gs-line">{h.line}</span>
                  <span className="gs-text">{h.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
