import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import { isTauri, loadSettings, saveSettings } from "./lib/bridge";
import { newDoc, openDoc, saveDoc, saveAsDoc, toggleSourceMode, syncStats } from "./lib/fileActions";
import { WELCOME_DOC } from "./lib/welcome";
import Sidebar from "./components/Sidebar";
import EditorPane from "./components/EditorPane";
import SourceEditor from "./components/SourceEditor";
import StatusBar from "./components/StatusBar";

interface Settings {
  theme?: "github" | "github-dark";
}

export default function App() {
  const viewMode = useAppStore((s) => s.viewMode);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const focusMode = useAppStore((s) => s.focusMode);
  const setTheme = useAppStore((s) => s.setTheme);

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
        })
        .catch(() => {});
    }
    // 关闭前保存设置
  }, [setTheme]);

  // 持久化主题
  useEffect(() => {
    if (isTauri) saveSettings({ theme }).catch(() => {});
  }, [theme]);

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
        {viewMode === "wysiwyg" ? <EditorPane /> : <SourceEditor />}
      </main>
      <StatusBar />
    </div>
  );
}
