/**
 * TOC 目录(Typora 式):
 * - `[toc]` / `[[toc]]` 段落渲染为可点击目录
 * - 目录跟随文档标题实时刷新(zustand markdown 订阅)
 * - 点击条目滚动到对应标题(复用 scrollToHeading)
 * - markdown 往返:序列化回 `[toc]`
 */
import { $nodeSchema, $remark, $view, $inputRule } from "@milkdown/utils";
import { remarkStringifyOptionsCtx } from "@milkdown/core";
import { InputRule } from "@milkdown/prose/inputrules";
import type { MilkdownPlugin } from "@milkdown/ctx";
import { useAppStore } from "../store/useAppStore";
import { extractOutline } from "./outline";
import { scrollToHeading } from "./fileActions";

/** 判断文本是否为 TOC 标记([toc] / [[toc]],大小写不敏感) */
export function isTocText(text: string): boolean {
  return /^\[\[?toc\]?\]$/i.test(text.trim());
}

/* ---------- 序列化:toc 节点 → `[toc]` ---------- */
export const tocStringify: MilkdownPlugin = (ctx) => {
  const prev = ctx.get(remarkStringifyOptionsCtx);
  const handlers = {
    ...prev.handlers,
    toc: () => "[toc]",
  };
  ctx.update(remarkStringifyOptionsCtx, () => ({ ...prev, handlers }));
  return () => {};
};

/* ---------- 节点 ---------- */
export const tocSchema = $nodeSchema("toc", () => ({
  group: "block",
  atom: true,
  selectable: true,
  parseDOM: [{ tag: 'div[data-type="toc"]' }],
  toDOM: () => ["div", { "data-type": "toc" }],
  parseMarkdown: {
    match: (node) => node.type === "toc",
    runner: (state, _node, type) => {
      state.addNode(type);
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "toc",
    runner: (state) => {
      state.addNode("toc");
    },
  },
}));

/* ---------- remark:匹配 [toc] 段落 → toc 节点 ---------- */
function walkRemark(node: any, fn: (n: any, parent: any, index: number) => void) {
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    fn(child, node, i);
    walkRemark(child, fn);
  }
}

export const remarkToc = $remark("remarkToc", () => () => (tree: any) => {
  walkRemark(tree, (child, parent, index) => {
    if (child.type !== "paragraph") return;
    const kids = child.children;
    if (!Array.isArray(kids) || kids.length !== 1) return;
    const only = kids[0];
    if (only.type === "text" && isTocText(String(only.value ?? ""))) {
      parent.children[index] = { type: "toc" };
    }
  });
});

/* ---------- 输入规则:输入 [toc] 即创建目录 ---------- */
export const tocInputRule = $inputRule((ctx) =>
  new InputRule(/^\[\[?toc\]?\]$/, (state, _match, start, end) => {
    const type = tocSchema.type(ctx);
    const $pos = state.doc.resolve(end);
    const depth = $pos.depth;
    const para = $pos.node(depth);
    // 仅当段落内容就是 [toc] 时才转换,避免吃掉其它文字
    if (para.type.name !== "paragraph") return null;
    if (para.textContent !== state.doc.textBetween(start, end)) return null;
    return state.tr.replaceRangeWith($pos.before(depth), $pos.after(depth), type.create());
  }),
);

/* ---------- nodeView:从 markdown 提取标题,渲染可点击目录 ---------- */
export const tocView = $view(tocSchema.node, () => {
  return () => {
    const dom = document.createElement("div");
    dom.className = "toc-block";
    dom.setAttribute("data-type", "toc");

    let lastMarkdown: string | null = null;

    function render() {
      const md = useAppStore.getState().markdown;
      if (md === lastMarkdown) return;
      lastMarkdown = md;
      dom.innerHTML = "";
      const items = extractOutline(md);
      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "toc-empty";
        empty.textContent = "目录(暂无标题)";
        dom.append(empty);
        return;
      }
      const list = document.createElement("ul");
      list.className = "toc-list";
      for (const item of items) {
        const li = document.createElement("li");
        li.className = "toc-item";
        li.style.paddingLeft = `${(item.level - 1) * 1.2}em`;
        const a = document.createElement("a");
        a.textContent = item.text;
        a.href = "#";
        a.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          void scrollToHeading(item.text);
        });
        li.append(a);
        list.append(li);
      }
      dom.append(list);
    }

    render();
    const unsub = useAppStore.subscribe(render);

    return {
      dom,
      ignoreMutation: () => true,
      update: () => true,
      destroy() {
        unsub();
      },
    };
  };
});

export const tocPlugin = [
  remarkToc,
  tocSchema,
  tocStringify,
  tocInputRule,
  tocView,
] as unknown as MilkdownPlugin[];
