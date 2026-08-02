/**
 * 选区浮动工具栏(vanilla DOM 实现)。
 * 选中文字时在其上方显示格式化按钮:粗体/斜体/删除线/行内代码/链接/标题/引用/代码块。
 */
import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey, TextSelection } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
} from "@milkdown/preset-commonmark";
import { toggleStrikethroughCommand } from "@milkdown/preset-gfm";

const key = new PluginKey("yymd-floating-toolbar");

interface ToolBtn {
  icon: string;
  title: string;
  run: () => void;
}

const TOOLS: ToolBtn[] = [
  { icon: "<b>B</b>", title: "粗体 ⌘B", run: () => { toggleStrongCommand.run(); } },
  { icon: "<i>I</i>", title: "斜体 ⌘I", run: () => { toggleEmphasisCommand.run(); } },
  { icon: "<s>S</s>", title: "删除线", run: () => { toggleStrikethroughCommand.run(); } },
  { icon: "<code>&lt;/&gt;</code>", title: "行内代码", run: () => { toggleInlineCodeCommand.run(); } },
  { icon: "🔗", title: "链接", run: () => {
      const href = window.prompt("链接地址", "https://");
      if (href) toggleLinkCommand.run({ href });
    } },
  { icon: "H₁", title: "一级标题", run: () => { wrapInHeadingCommand.run(1); } },
  { icon: "H₂", title: "二级标题", run: () => { wrapInHeadingCommand.run(2); } },
  { icon: "❝", title: "引用", run: () => { wrapInBlockquoteCommand.run(); } },
  { icon: "⌥", title: "代码块", run: () => { createCodeBlockCommand.run(); } },
];

export const floatingToolbarPlugin = $prose((ctx) => {
  void ctx;
  let el: HTMLDivElement | null = null;

  function ensureEl(view: EditorView): HTMLDivElement {
    if (el) return el;
    el = document.createElement("div");
    el.className = "floating-toolbar";
    TOOLS.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "ft-btn";
      btn.title = t.title;
      btn.innerHTML = t.icon;
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        try {
          t.run();
        } catch (err) {
          console.error("toolbar command failed", err);
        }
        view.focus();
      });
      el!.appendChild(btn);
    });
    document.body.appendChild(el);
    return el;
  }

  function hide() {
    if (el) el.style.display = "none";
  }

  return new Plugin({
    key,
    view() {
      return {
        update(view) {
          const bar = ensureEl(view);
          const { selection } = view.state;
          const show =
            selection instanceof TextSelection && !selection.empty;
          if (!show) {
            hide();
            return;
          }
          bar.style.display = "flex";
          const start = view.coordsAtPos(selection.from);
          const end = view.coordsAtPos(selection.to);
          const midX = (start.left + end.left) / 2;
          const barW = bar.offsetWidth || 320;
          bar.style.left =
            Math.min(Math.max(8, midX - barW / 2), window.innerWidth - barW - 8) + "px";
          bar.style.top = Math.max(8, start.top - bar.offsetHeight - 8) + "px";
        },
        destroy() {
          el?.remove();
          el = null;
        },
      };
    },
  });
});
