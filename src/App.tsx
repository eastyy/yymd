import { useEffect } from "react";
import { useAppStore, type ThemeName } from "./store/useAppStore";
import { isTauri, loadSettings, saveSettings } from "./lib/bridge";
import { newDoc, openDoc, saveDoc, saveAsDoc, toggleSourceMode, syncStats } from "./lib/fileActions";
import { WELCOME_DOC } from "./lib/welcome";
import Sidebar from "./components/Sidebar";
import EditorPane from "./components/EditorPane";
import SourceEditor from "./components/SourceEditor";
import StatusBar from "./components/StatusBar";
import SearchBar from "./components/SearchBar";
import QuickOpen from "./components/QuickOpen";

interface Settings {
  theme?: ThemeName;
  recent?: string[];
}

export default function App() {
  const viewMode = useAppStore((s) => s.viewMode);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const focusMode = useAppStore((s) => s.focusMode);
  const setTheme = useAppStore((s) => s.setTheme);
  const searchOpen = useAppStore((s) => s.searchOpen);
  const quickOpenOpen = useAppStore((s) => s.quickOpenOpen);

  // 应用主题
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  // 启动:加载设置 + 欢迎文档
  useEffect(() => {
    const s = useAppStore.getState();
    s.setMarkdown(WELCOME_DOC);
    syncStats(WELCOME_DOC);
    if (isTauri) {
      loadSettings<Settings>()
        .then((cfg) => {
          if (cfg.theme) setTheme(cfg.theme);
          if (Array.isArray(cfg.recent)) useAppStore.getState().setRecentFiles(cfg.recent);
        })
        .catch(() => {});
    }
    // 关闭前保存设置
  }, [setTheme]);

  // 持久化设置(主题 + 最近文件)
  const recentFiles = useAppStore((s) => s.recentFiles);
  useEffect(() => {
    if (isTauri) saveSettings({ theme, recent: recentFiles }).catch(() => {});
  }, [theme, recentFiles]);

  // 监听原生菜单事件
  useEffect(() => {
    if (!isTauri) return;
    const unlisteners: Promise<() => void>[] = [];
    import("@tauri-apps/api/event").then(({ listen }) => {
      const handlers: [string, () => void][] = [
        ["menu://file.new", () => newDoc()],
        ["menu://file.open", () => openDoc()],
        ["menu://file.save", () => saveDoc()],
        ["menu://file.save_as", () => saveAsDoc()],
      ];
      handlers.forEach(([evt, fn]) => unlisteners.push(listen(evt, fn)));
    });
    return () => {
      unlisteners.forEach((p) => p.then((u) => u()).catch(() => {}));
    };
  }, []);

  // 关闭前确认保存
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | null = null;
    import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      unlisten = await win.onCloseRequested(async (event) => {
        if (!useAppStore.getState().dirty) return;
        event.preventDefault();
        const { ask } = await import("@tauri-apps/plugin-dialog");
        const shouldSave = await ask("有未保存的更改,退出前是否保存?", {
          title: "Yymd",
          kind: "warning",
          okLabel: "保存并退出",
          cancelLabel: "取消",
        });
        if (shouldSave) {
          await saveDoc();
          await win.destroy();
        }
      });
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 全局快捷键
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        if (e.shiftKey) saveAsDoc();
        else saveDoc();
      } else if (key === "o") {
        e.preventDefault();
        openDoc();
      } else if (key === "n") {
        e.preventDefault();
        newDoc();
      } else if (key === "f") {
        if (useAppStore.getState().viewMode === "wysiwyg") {
          e.preventDefault();
          useAppStore.getState().setSearchOpen(true);
        }
      } else if (key === "p") {
        e.preventDefault();
        useAppStore.getState().setQuickOpenOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        toggleSourceMode();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`app ${focusMode ? "focus" : ""}`}>
      {sidebarOpen && <Sidebar />}
      <main className="editor-main">
        {searchOpen && viewMode === "wysiwyg" && <SearchBar />}
        {viewMode === "wysiwyg" ? <EditorPane /> : <SourceEditor />}
      </main>
      <StatusBar />
      {quickOpenOpen && <QuickOpen />}
    </div>
  );
}
