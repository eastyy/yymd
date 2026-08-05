/**
 * 表格浮动工具栏(Typora 式):光标位于表格内时,在表格上方显示
 * 行/列插入、删除、表头切换、删除表格按钮。vanilla DOM 实现。
 */
import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorState } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import type { Node as PMNode } from "@milkdown/prose/model";
import {
  addRowAfter,
  addRowBefore,
  addColumnAfter,
  addColumnBefore,
  deleteRow,
  deleteColumn,
  deleteTable,
} from "@milkdown/prose/tables";

const key = new PluginKey("yymd-table-toolbar");

type TableCmd = (
  state: EditorView["state"],
  dispatch?: EditorView["dispatch"],
) => boolean;

interface ToolBtn {
  icon: string;
  title: string;
  cmd: TableCmd;
}

const TOOLS: ToolBtn[] = [
  { icon: "⇤+", title: "左侧插入列", cmd: addColumnBefore },
  { icon: "+⇥", title: "右侧插入列", cmd: addColumnAfter },
  { icon: "⇡+", title: "上方插入行", cmd: addRowBefore },
  { icon: "+⇣", title: "下方插入行", cmd: addRowAfter },
  { icon: "−行", title: "删除当前行", cmd: deleteRow },
  { icon: "−列", title: "删除当前列", cmd: deleteColumn },
  { icon: "🗑", title: "删除表格", cmd: deleteTable },
];

/** 返回选区所在 table 的起始位置与节点;不在表格内返回 null */
function findTable(state: EditorState): { pos: number; node: PMNode } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === "table") {
      return { pos: $from.before(d), node: $from.node(d) };
    }
  }
  return null;
}

export const tableToolbarPlugin = $prose(() => {
  let bar: HTMLDivElement | null = null;
  let currentView: EditorView | null = null;

  function ensureBar(): HTMLDivElement {
    if (bar) return bar;
    bar = document.createElement("div");
    bar.className = "table-toolbar";
    for (const t of TOOLS) {
      const btn = document.createElement("button");
      btn.className = "tt-btn";
      btn.title = t.title;
      btn.textContent = t.icon;
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!currentView) return;
        try {
          t.cmd(currentView.state, currentView.dispatch);
          currentView.focus();
        } catch (err) {
          console.error("table command failed", err);
        }
      });
      bar.appendChild(btn);
    }
    document.body.appendChild(bar);
    return bar;
  }

  function reposition(view: EditorView) {
    const el = ensureBar();
    const pos = findTable(view.state)?.pos ?? null;
    if (pos === null) {
      el.style.display = "none";
      return;
    }
    el.style.display = "flex";
    const coords = view.coordsAtPos(pos);
    el.style.top = `${Math.max(8, coords.top - el.offsetHeight - 6)}px`;
    el.style.left = `${Math.max(8, coords.left)}px`;
  }

  return new Plugin({
    key,
    view() {
      return {
        update(view) {
          currentView = view;
          reposition(view);
        },
        destroy() {
          bar?.remove();
          bar = null;
          currentView = null;
        },
      };
    },
  });
});
