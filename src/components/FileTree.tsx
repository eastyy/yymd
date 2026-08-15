import { useEffect, useState, useCallback, useRef } from "react";
import {
  listDir,
  pickDirectory,
  showInFolder,
  createFile,
  createDir,
  renamePath,
  removePath,
  type DirEntry,
} from "../lib/bridge";
import { useAppStore } from "../store/useAppStore";
import { openFile } from "../lib/fileActions";
import { joinPath, dirnameOf } from "../lib/paths";

interface TreeNode extends DirEntry {
  children?: TreeNode[];
  expanded?: boolean;
  loaded?: boolean;
}

interface MenuState {
  x: number;
  y: number;
  node: TreeNode | null; // null = 根目录空白处
}

export default function FileTree() {
  const rootDir = useAppStore((s) => s.rootDir);
  const setRootDir = useAppStore((s) => s.setRootDir);
  const filePath = useAppStore((s) => s.filePath);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const rootDirRef = useRef(rootDir);
  useEffect(() => {
    rootDirRef.current = rootDir;
  }, [rootDir]);

  const loadRoot = useCallback(async (dir: string) => {
    try {
      const entries = await listDir(dir);
      setTree(entries.map((e) => ({ ...e, expanded: false, loaded: false })));
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    if (rootDir) loadRoot(rootDir);
    else setTree([]);
  }, [rootDir, loadRoot]);

  // 点击别处关闭菜单
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [menu]);

  /** 重新读取某个目录(保留已加载兄弟节点的展开状态) */
  async function refreshDir(dir: string) {
    try {
      const entries = await listDir(dir);
      setTree((prev) => mergeEntries(prev, dir, entries));
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function mergeEntries(nodes: TreeNode[], dir: string, entries: DirEntry[]): TreeNode[] {
    if (dir === rootDirRef.current) {
      return entries.map((e) => {
        const old = nodes.find((n) => n.path === e.path);
        return old ? { ...old, name: e.name } : { ...e, expanded: false, loaded: false };
      });
    }
    return nodes.map((n) => {
      if (n.path === dir) {
        return {
          ...n,
          children: entries.map((e) => {
            const old = n.children?.find((c) => c.path === e.path);
            return old ? { ...old, name: e.name } : { ...e, expanded: false, loaded: false };
          }),
          loaded: true,
          expanded: true,
        };
      }
      if (n.children) return { ...n, children: mergeEntries(n.children, dir, entries) };
      return n;
    });
  }

  async function chooseFolder() {
    const dir = await pickDirectory();
    if (dir) setRootDir(dir);
  }

  async function toggleNode(node: TreeNode) {
    if (!node.is_dir) {
      if (/\.(md|markdown|mdown|txt)$/i.test(node.name)) {
        try {
          await openFile(node.path);
        } catch (e) {
          setError(String(e));
        }
      }
      return;
    }
    let children = node.children;
    if (!node.loaded) {
      const entries = await listDir(node.path);
      children = entries.map((e) => ({ ...e, expanded: false, loaded: false }));
    }
    setTree((prev) =>
      updateNode(prev, node.path, {
        expanded: !node.expanded,
        loaded: true,
        children,
      }),
    );
  }

  function updateNode(nodes: TreeNode[], path: string, patch: Partial<TreeNode>): TreeNode[] {
    return nodes.map((n) => {
      if (n.path === path) return { ...n, ...patch };
      if (n.children) return { ...n, children: updateNode(n.children, path, patch) };
      return n;
    });
  }

  /* ---------- 右键菜单动作 ---------- */

  function targetDir(node: TreeNode | null): string {
    if (!node) return rootDirRef.current ?? "";
    return node.is_dir ? node.path : dirnameOf(node.path);
  }

  async function doNewFile(node: TreeNode | null) {
    const dir = targetDir(node);
    if (!dir) return;
    const name = window.prompt("新建文件", "未命名.md");
    if (!name) return;
    try {
      const path = joinPath(dir, name);
      await createFile(path, "");
      await refreshDir(dir);
      if (/\.(md|markdown|mdown|txt)$/i.test(name)) await openFile(path);
    } catch (e) {
      setError(String(e));
    }
  }

  async function doNewFolder(node: TreeNode | null) {
    const dir = targetDir(node);
    if (!dir) return;
    const name = window.prompt("新建文件夹", "新建文件夹");
    if (!name) return;
    try {
      await createDir(joinPath(dir, name));
      await refreshDir(dir);
    } catch (e) {
      setError(String(e));
    }
  }

  async function doRename(node: TreeNode) {
    const name = window.prompt("重命名为", node.name);
    if (!name || name === node.name) return;
    try {
      const to = joinPath(dirnameOf(node.path), name);
      await renamePath(node.path, to);
      // 若重命名的是当前打开的文件,同步更新路径
      if (filePath === node.path) useAppStore.getState().setFilePath(to);
      await refreshDir(dirnameOf(node.path) || rootDirRef.current || "");
    } catch (e) {
      setError(String(e));
    }
  }

  async function doDelete(node: TreeNode) {
    const ok = window.confirm(`确定删除“${node.name}”吗?此操作不可撤销。`);
    if (!ok) return;
    try {
      await removePath(node.path);
      // 若删除的是当前打开的文件,清除文件路径(保留缓冲区内容)
      if (filePath && filePath.startsWith(node.path)) {
        useAppStore.getState().setFilePath(null);
      }
      await refreshDir(dirnameOf(node.path) || rootDirRef.current || "");
    } catch (e) {
      setError(String(e));
    }
  }

  function openMenu(e: React.MouseEvent, node: TreeNode | null) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, node });
  }

  if (!rootDir) {
    return (
      <div className="filetree-empty">
        <p>未打开文件夹</p>
        <button className="btn" onClick={chooseFolder}>
          打开文件夹…
        </button>
      </div>
    );
  }

  return (
    <div className="filetree" onContextMenu={(e) => openMenu(e, null)}>
      <div className="filetree-header" title={rootDir}>
        <span className="filetree-rootname">{rootName(rootDir)}</span>
        <button className="icon-btn" onClick={chooseFolder} title="切换文件夹">
          ⇄
        </button>
      </div>
      {error && <div className="filetree-error">{error}</div>}
      <ul className="tree">
        {tree.map((node) => (
          <TreeItem
            key={node.path}
            node={node}
            depth={0}
            onToggle={toggleNode}
            onMenu={openMenu}
            activePath={filePath}
          />
        ))}
      </ul>

      {menu && (
        <div className="ctx-menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          <button className="ctx-item" onClick={() => { setMenu(null); void doNewFile(menu.node); }}>
            ＋ 新建文件
          </button>
          <button className="ctx-item" onClick={() => { setMenu(null); void doNewFolder(menu.node); }}>
            ＋ 新建文件夹
          </button>
          {menu.node && (
            <>
              <button className="ctx-item" onClick={() => { setMenu(null); void doRename(menu.node!); }}>
                ✎ 重命名
              </button>
              <button className="ctx-item danger" onClick={() => { setMenu(null); void doDelete(menu.node!); }}>
                🗑 删除
              </button>
              <button className="ctx-item" onClick={() => { setMenu(null); void showInFolder(menu.node!.path); }}>
                ↗ 在访达中显示
              </button>
            </>
          )}
          <button className="ctx-item" onClick={() => { setMenu(null); void loadRoot(rootDirRef.current ?? ""); }}>
            ⟳ 刷新
          </button>
        </div>
      )}
    </div>
  );
}

function TreeItem({
  node,
  depth,
  onToggle,
  onMenu,
  activePath,
}: {
  node: TreeNode;
  depth: number;
  onToggle: (n: TreeNode) => void;
  onMenu: (e: React.MouseEvent, n: TreeNode) => void;
  activePath: string | null;
}) {
  const active = node.path === activePath;
  return (
    <li>
      <div
        className={`tree-item ${active ? "active" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => onToggle(node)}
        onContextMenu={(e) => onMenu(e, node)}
      >
        <span className="tree-icon">{node.is_dir ? (node.expanded ? "▾ 📂" : "▸ 📁") : "📄"}</span>
        <span className="tree-name">{node.name}</span>
      </div>
      {node.is_dir && node.expanded && node.children && (
        <ul className="tree">
          {node.children.map((c) => (
            <TreeItem
              key={c.path}
              node={c}
              depth={depth + 1}
              onToggle={onToggle}
              onMenu={onMenu}
              activePath={activePath}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function rootName(dir: string): string {
  const parts = dir.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || dir;
}
