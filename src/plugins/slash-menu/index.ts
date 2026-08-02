/**
 * 斜杠菜单(vanilla DOM 实现,无需 React portal)。
 * 在任意位置输入 `/` 弹出块级插入菜单,支持键盘过滤/导航。
 */
import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import {
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  insertHrCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from "@milkdown/preset-commonmark";
import { insertTableCommand } from "@milkdown/preset-gfm";

interface SlashCmd {
  label: string;
  hint: string;
  icon: string;
  keywords: string[];
  run: () => void;
}

const COMMANDS: SlashCmd[] = [
  { label: "正文", hint: "普通段落", icon: "¶", keywords: ["text", "paragraph", "正文", "段落"], run: () => { turnIntoTextCommand.run(); } },
  { label: "一级标题", hint: "H1", icon: "H₁", keywords: ["h1", "heading", "标题", "title"], run: () => { wrapInHeadingCommand.run(1); } },
  { label: "二级标题", hint: "H2", icon: "H₂", keywords: ["h2", "标题"], run: () => { wrapInHeadingCommand.run(2); } },
  { label: "三级标题", hint: "H3", icon: "H₃", keywords: ["h3", "标题"], run: () => { wrapInHeadingCommand.run(3); } },
  { label: "无序列表", hint: "• 项目符号", icon: "•", keywords: ["ul", "bullet", "list", "列表"], run: () => { wrapInBulletListCommand.run(); } },
  { label: "有序列表", hint: "1. 编号", icon: "1.", keywords: ["ol", "ordered", "number", "列表"], run: () => { wrapInOrderedListCommand.run(); } },
  { label: "引用", hint: "❝ 引文", icon: "❝", keywords: ["quote", "引用", "blockquote"], run: () => { wrapInBlockquoteCommand.run(); } },
  { label: "代码块", hint: "``` 多行代码", icon: "⌥", keywords: ["code", "codeblock", "代码"], run: () => { createCodeBlockCommand.run(); } },
  { label: "表格", hint: "3×3 表格", icon: "▦", keywords: ["table", "表格"], run: () => { insertTableCommand.run({ row: 3, col: 3 }); } },
  { label: "分割线", hint: "———", icon: "—", keywords: ["hr", "divider", "分割", "横线"], run: () => { insertHrCommand.run(); } },
];

const key = new PluginKey("yymd-slash-menu");

class SlashMenu {
  el: HTMLDivElement;
  view: EditorView;
  from = 0; // '/' 之后第一个字符的位置
  index = 0;
  filtered: SlashCmd[] = [];
  open = false;

  constructor(view: EditorView) {
    this.view = view;
    this.el = document.createElement("div");
    this.el.className = "slash-menu";
    document.body.appendChild(this.el);
    document.addEventListener("mousedown", this.onDocMouseDown, true);
  }

  destroy() {
    document.removeEventListener("mousedown", this.onDocMouseDown, true);
    this.el.remove();
  }

  onDocMouseDown = (e: MouseEvent) => {
    if (this.open && !this.el.contains(e.target as Node)) this.close();
  };

  show(from: number) {
    this.from = from;
    this.open = true;
    this.index = 0;
    this.render("");
  }

  close() {
    this.open = false;
    this.el.style.display = "none";
  }

  query(): string {
    const { state } = this.view;
    const head = state.selection.head;
    if (head < this.from) return "";
    return state.doc.textBetween(this.from, head, "", "\n");
  }

  render(q: string) {
    const ql = q.toLowerCase();
    this.filtered = COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(ql) ||
        c.keywords.some((k) => k.includes(ql)),
    );
    if (this.filtered.length === 0) {
      this.close();
      return;
    }
    if (this.index >= this.filtered.length) this.index = 0;
    this.el.style.display = "block";
    this.el.innerHTML = "";
    this.filtered.forEach((cmd, i) => {
      const item = document.createElement("button");
      item.className = "slash-item" + (i === this.index ? " active" : "");
      item.innerHTML = `<span class="slash-icon">${cmd.icon}</span><span class="slash-text"><b>${cmd.label}</b><small>${cmd.hint}</small></span>`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.exec(i);
      });
      this.el.appendChild(item);
    });
    this.position();
  }

  position() {
    const coords = this.view.coordsAtPos(this.view.state.selection.head);
    this.el.style.position = "fixed";
    this.el.style.left = Math.max(8, coords.left) + "px";
    const maxTop = window.innerHeight - this.el.offsetHeight - 8;
    this.el.style.top = Math.min(coords.bottom + 4, Math.max(8, maxTop)) + "px";
  }

  move(delta: number) {
    if (this.filtered.length === 0) return;
    this.index = (this.index + delta + this.filtered.length) % this.filtered.length;
    this.render(this.query());
  }

  exec(i: number) {
    const cmd = this.filtered[i];
    if (!cmd) return;
    const { view } = this;
    const head = view.state.selection.head;
    // 删除 '/' 及其后输入的查询文本
    const deleteFrom = this.from - 1;
    if (deleteFrom >= 0 && head >= deleteFrom) {
      view.dispatch(view.state.tr.delete(deleteFrom, head).scrollIntoView());
    }
    try {
      cmd.run();
    } catch (e) {
      console.error("slash command failed", e);
    }
    this.close();
    view.focus();
  }
}

export const slashMenuPlugin = $prose((ctx) => {
  void ctx;
  let menu: SlashMenu | null = null;
  let pendingFrom: number | null = null;

  return new Plugin({
    key,
    props: {
      handleKeyDown(view, event) {
        if (!menu) menu = new SlashMenu(view);

        if (menu.open) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            menu.move(1);
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            menu.move(-1);
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            menu.exec(menu.index);
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            menu.close();
            return true;
          }
          if (event.key === "Backspace" && menu.query() === "") {
            menu.close();
            return false; // 让默认行为删掉 '/'
          }
          return false;
        }

        // 未打开:检测 '/' 触发(选择为空时)
        if (event.key === "/" && view.state.selection.empty) {
          pendingFrom = view.state.selection.from + 1;
        }
        return false;
      },
      handleDOMEvents: {
        blur() {
          setTimeout(() => menu?.close(), 150);
          return false;
        },
      },
    },
    view() {
      return {
        update(view, prevState) {
          void prevState;
          if (!menu) menu = new SlashMenu(view);
          if (pendingFrom !== null) {
            menu.show(pendingFrom);
            pendingFrom = null;
          }
          if (menu.open) {
            const sel = view.state.selection;
            if (!sel.empty || sel.head < menu.from) {
              menu.close();
              return;
            }
            menu.render(menu.query());
          }
        },
        destroy() {
          menu?.destroy();
          menu = null;
        },
      };
    },
  });
});
