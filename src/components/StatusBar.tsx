import { useAppStore } from "../store/useAppStore";
import { THEMES } from "../lib/themes";
import { toggleSourceMode, exportCurrent } from "../lib/fileActions";

export default function StatusBar() {
  const { wordCount, charCount, dirty, viewMode, theme, setTheme, focusMode, toggleFocusMode, typewriterMode, toggleTypewriter, toggleSidebar } =
    useAppStore();

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
        <button className="status-btn" onClick={() => exportCurrent("html")} title="导出 HTML">
          HTML
        </button>
        <button className="status-btn" onClick={() => exportCurrent("pdf")} title="导出 PDF(打印对话框)">
          PDF
        </button>
        <button
          className="status-btn"
          onClick={toggleFocusMode}
          title="专注模式:高亮当前段落"
          data-active={focusMode}
        >
          🎯
        </button>
        <button
          className="status-btn"
          onClick={toggleTypewriter}
          title="打字机模式:光标居中"
          data-active={typewriterMode}
        >
          ⌨
        </button>
        <select
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          title="主题"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
