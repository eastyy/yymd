import { useEffect, useState, useCallback } from "react";
import { listDir, pickDirectory, type DirEntry } from "../lib/bridge";
import { useAppStore } from "../store/useAppStore";
import { openFile } from "../lib/fileActions";

interface TreeNode extends DirEntry {
  children?: TreeNode[];
  expanded?: boolean;
  loaded?: boolean;
}

export default function FileTree() {
  const rootDir = useAppStore((s) => s.rootDir);
  const setRootDir = useAppStore((s) => s.setRootDir);
  const filePath = useAppStore((s) => s.filePath);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    <div className="filetree">
      <div className="filetree-header" title={rootDir}>
        <span className="filetree-rootname">{rootName(rootDir)}</span>
        <button className="icon-btn" onClick={chooseFolder} title="切换文件夹">
          ⇄
        </button>
      </div>
      {error && <div className="filetree-error">{error}</div>}
      <ul className="tree">
        {tree.map((node) => (
          <TreeItem key={node.path} node={node} depth={0} onToggle={toggleNode} activePath={filePath} />
        ))}
      </ul>
    </div>
  );
}

function TreeItem({
  node,
  depth,
  onToggle,
  activePath,
}: {
  node: TreeNode;
  depth: number;
  onToggle: (n: TreeNode) => void;
  activePath: string | null;
}) {
  const active = node.path === activePath;
  return (
    <li>
      <div
        className={`tree-item ${active ? "active" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => onToggle(node)}
      >
        <span className="tree-icon">{node.is_dir ? (node.expanded ? "▾ 📂" : "▸ 📁") : "📄"}</span>
        <span className="tree-name">{node.name}</span>
      </div>
      {node.is_dir && node.expanded && node.children && (
        <ul className="tree">
          {node.children.map((c) => (
            <TreeItem key={c.path} node={c} depth={depth + 1} onToggle={onToggle} activePath={activePath} />
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
