import { useEffect } from "react";
import { useAppStore, type ThemeName } from "./store/useAppStore";
import { isTauri, loadSettings, saveSettings } from "./lib/bridge";
import { newDoc, openDoc, openFile, saveDoc, saveAsDoc, toggleSourceMode, syncStats, exportCurrent } from "./lib/fileActions";
import { WELCOME_DOC } from "./lib/welcome";
import { dlog } from "./lib/debugLog";
import Sidebar from "./components/Sidebar";
import EditorPane from "./components/EditorPane";
import SourceEditor from "./components/SourceEditor";
import StatusBar from "./components/StatusBar";
import SearchBar from "./components/SearchBar";
import QuickOpen from "./components/QuickOpen";
import GlobalSearch from "./components/GlobalSearch";

interface Settings {
  theme?: ThemeName;
  recent?: string[];
  lastFile?: string;
  fontSize?: number;
}

export default function App() {
  const viewMode = useAppStore((s) => s.viewMode);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const focusMode = useAppStore((s) => s.focusMode);
  const setTheme = useAppStore((s) => s.setTheme);
  const searchOpen = useAppStore((s) => s.searchOpen);
  const quickOpenOpen = useAppStore((s) => s.quickOpenOpen);
  const globalSearchOpen = useAppStore((s) => s.globalSearchOpen);
  const fontSize = useAppStore((s) => s.fontSize);
  const setFontSize = useAppStore((s) => s.setFontSize);

  // 应用主题
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  // 应用编辑区字号
  useEffect(() => {
    document.documentElement.style.setProperty("--editor-font-size", `${fontSize}px`);
  }, [fontSize]);

  // 启动:加载设置 + 欢迎文档(若上次打开了文件则恢复它)
  useEffect(() => {
    const s = useAppStore.getState();
    s.setMarkdown(WELCOME_DOC);
    syncStats(WELCOME_DOC);
    if (isTauri) {
      loadSettings<Settings>()
        .then(async (cfg) => {
          if (cfg.theme) setTheme(cfg.theme);
          if (Array.isArray(cfg.recent)) useAppStore.getState().setRecentFiles(cfg.recent);
          if (typeof cfg.fontSize === "number") setFontSize(cfg.fontSize);
          if (cfg.lastFile) {
            try {
              await openFile(cfg.lastFile);
            } catch {
              /* 文件已删除/不可读则保持欢迎页 */
            }
          }
        })
        .catch(() => {});
    }
  }, [setTheme, setFontSize]);

  // 持久化设置(主题 + 最近文件 + 当前文件 + 字号)
  const recentFiles = useAppStore((s) => s.recentFiles);
  const filePath = useAppStore((s) => s.filePath);
  useEffect(() => {
    if (isTauri)
      saveSettings({ theme, recent: recentFiles, lastFile: filePath ?? undefined, fontSize }).catch(() => {});
  }, [theme, recentFiles, filePath, fontSize]);

  // 监听原生菜单事件
  useEffect(() => {
    if (!isTauri) return;
    const unlisteners: Promise<() => void>[] = [];
    import("@tauri-apps/api/event").then(({ listen }) => {
      const handlers: [string, () => void][] = [
        ["menu://file_new", () => newDoc()],
        ["menu://file_open", () => openDoc()],
        ["menu://file_save", () => saveDoc()],
        ["menu://file_save_as", () => saveAsDoc()],
        ["menu://file_export_html", () => exportCurrent("html")],
        ["menu://file_export_pdf", () => exportCurrent("pdf")],
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
    let cancelled = false;
    let confirming = false;
    import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      const off = await win.onCloseRequested(async (event) => {
        dlog(`close-requested dirty=${useAppStore.getState().dirty} confirming=${confirming}`);
        if (!useAppStore.getState().dirty) return;
        event.preventDefault();
        if (confirming) return;
        confirming = true;
        const { message } = await import("@tauri-apps/plugin-dialog");
        const choice = await message("有未保存的更改,退出前是否保存?", {
          title: "Yymd",
          kind: "warning",
          buttons: { yes: "保存并退出", no: "不保存", cancel: "取消" },
        });
        const c = String(choice);
        dlog(`close dialog choice=${choice}`);
        if (c === "保存并退出" || c.toLowerCase() === "yes") {
          await saveDoc();
          await win.destroy();
        } else if (c === "不保存" || c.toLowerCase() === "no") {
          await win.destroy();
        } else {
          confirming = false;
        }
      });
      if (cancelled) off();
      else unlisten = off;
    });
    return () => {
      cancelled = true;
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
      } else if (key === "f" && e.shiftKey) {
        e.preventDefault();
        useAppStore.getState().setGlobalSearchOpen(true);
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
      } else if (key === "=" || e.key === "+") {
        e.preventDefault();
        const st = useAppStore.getState();
        st.setFontSize(st.fontSize + 2);
      } else if (key === "-") {
        e.preventDefault();
        const st = useAppStore.getState();
        st.setFontSize(st.fontSize - 2);
      } else if (key === "0") {
        e.preventDefault();
        useAppStore.getState().setFontSize(16);
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
      {globalSearchOpen && <GlobalSearch />}
    </div>
  );
}
