import { useAppStore } from "../store/useAppStore";
import { toggleSourceMode } from "../lib/fileActions";
import { saveSettings } from "../lib/bridge";

export default function StatusBar() {
  const { wordCount, charCount, dirty, viewMode, setViewMode, theme, setTheme, focusMode, toggleFocusMode, toggleSidebar } =
    useAppStore();

  function changeTheme(t: "github" | "github-dark") {
    setTheme(t);
    saveSettings({ theme: t }).catch(() => {});
  }

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <button className="status-btn" onClick={toggleSidebar} title="切换侧边栏">
          ☰
        </button>
        <span className="status-item">{wordCount} 字</span>
        <span className="status-item">{charCount} 字符</span>
        <span className={`status-item ${dirty ? "dirty" : ""}`}>
          {dirty ? "● 未保存" : "已保存"}
        </span>
      </div>
      <div className="statusbar-right">
        <button
          className="status-btn"
          onClick={toggleFocusMode}
          title="专注模式"
          data-active={focusMode}
        >
          🎯
        </button>
        <button
          className="status-btn"
          onClick={() => changeTheme(theme === "github" ? "github-dark" : "github")}
          title="切换主题"
        >
          {theme === "github" ? "🌙" : "☀️"}
        </button>
        <div className="seg">
          <button
            className={viewMode === "wysiwyg" ? "active" : ""}
            onClick={() => viewMode !== "wysiwyg" && toggleSourceMode()}
          >
            预览
          </button>
          <button
            className={viewMode === "source" ? "active" : ""}
            onClick={() => viewMode !== "source" && toggleSourceMode()}
          >
            源码
          </button>
        </div>
      </div>
    </footer>
  );
}
