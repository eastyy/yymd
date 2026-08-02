import { useAppStore } from "../store/useAppStore";
import FileTree from "./FileTree";
import Outline from "./Outline";

export default function Sidebar() {
  const tab = useAppStore((s) => s.sidebarTab);
  const setTab = useAppStore((s) => s.setSidebarTab);

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={tab === "outline" ? "active" : ""}
          onClick={() => setTab("outline")}
        >
          大纲
        </button>
        <button
          className={tab === "files" ? "active" : ""}
          onClick={() => setTab("files")}
        >
          文件
        </button>
      </div>
      <div className="sidebar-content">
        {tab === "outline" ? <Outline /> : <FileTree />}
      </div>
    </aside>
  );
}
