/**
 * Mermaid 图表:可编辑节点 + mermaid v11 实时 SVG 渲染。
 * - 输入 ```mermaid 立即创建 diagram 节点(在 commonmark 的 ``` 规则触发空格/回车之前)
 * - 节点内容即 mermaid 源码,可就地编辑(contentDOM),失焦后只显示渲染结果
 * - 语法错误时回退显示源码,不阻断编辑
 * - markdown 往返:```mermaid 围栏代码块
 */
import { $nodeSchema, $inputRule, $remark, $view } from "@milkdown/utils";
import { InputRule } from "@milkdown/prose/inputrules";
import type { MilkdownPlugin } from "@milkdown/ctx";
import mermaid from "mermaid";
import { useAppStore } from "../store/useAppStore";

let identitySeq = 0;
let renderSeq = 0;

function isDarkTheme(): boolean {
  const t = useAppStore.getState().theme;
  return t === "github-dark" || t === "night";
}

/* ---------- 节点 ---------- */
export const diagramSchema = $nodeSchema("diagram", () => ({
  content: "text*",
  group: "block",
  marks: "",
  defining: true,
  isolating: true,
  attrs: { identity: { default: "" } },
  parseDOM: [
    {
      tag: 'div[data-type="diagram"]',
      preserveWhitespace: "full" as const,
    },
  ],
  toDOM: () => ["div", { "data-type": "diagram" }, 0],
  parseMarkdown: {
    match: (node) => node.type === "diagram",
    runner: (state, node, type) => {
      const value = String((node as { value?: unknown }).value ?? "");
      state.openNode(type, { identity: `d${++identitySeq}` });
      if (value) state.addText(value);
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "diagram",
    runner: (state, node) => {
      state.addNode("code", undefined, node.textContent || "", { lang: "mermaid" });
    },
  },
}));

/* ---------- remark:```mermaid 代码块 → diagram 节点 ---------- */
function walkRemark(node: any, fn: (n: any, parent: any, index: number) => void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      fn(child, node, i);
      walkRemark(child, fn);
    }
  }
}

export const remarkDiagram = $remark("remarkDiagram", () => () => (tree: any) => {
  walkRemark(tree, (child, parent, index) => {
    if (child.type === "code" && child.lang === "mermaid") {
      parent.children[index] = { type: "diagram", value: child.value ?? "" };
    }
  });
});

/* ---------- 输入规则:输入 ```mermaid 即创建图表 ---------- */
export const diagramInputRule = $inputRule((ctx) =>
  new InputRule(/^```mermaid$/, (state, _match, start, end) => {
    const type = diagramSchema.type(ctx);
    const $pos = state.doc.resolve(start);
    const parent = $pos.node(-1);
    if (!parent.canReplaceWith($pos.index(-1), $pos.indexAfter(-1), type)) return null;
    return state.tr.delete(start, end).setBlockType(start, start, type, {
      identity: `d${++identitySeq}`,
    });
  }),
);

/* ---------- nodeView:源码可编辑 + SVG 实时渲染 ---------- */
export const diagramView = $view(diagramSchema.node, () => {
  return (node, view, getPos) => {
    const container = document.createElement("div");
    container.className = "diagram";
    const svgBox = document.createElement("div");
    svgBox.className = "diagram-svg";
    const src = document.createElement("pre");
    src.className = "diagram-source";
    src.setAttribute("spellcheck", "false");
    container.append(svgBox, src);

    let currentNode = node;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastText: string | null = null;

    async function render(code: string) {
      if (!code.trim()) {
        svgBox.innerHTML = "";
        svgBox.classList.remove("diagram-error");
        svgBox.removeAttribute("title");
        return;
      }
      const id = `yymd-mermaid-${++renderSeq}`;
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDarkTheme() ? "dark" : "default",
        });
        const { svg } = await mermaid.render(id, code);
        svgBox.innerHTML = svg;
        svgBox.classList.remove("diagram-error");
        svgBox.removeAttribute("title");
      } catch (e) {
        const errEl = document.getElementById(id);
        if (errEl) errEl.remove();
        svgBox.textContent = code;
        svgBox.classList.add("diagram-error");
        svgBox.title = e instanceof Error ? e.message : String(e);
      }
    }

    function schedule(code: string) {
      lastText = code;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void render(code), 300);
    }

    function refreshEditState() {
      const pos = getPos();
      if (typeof pos !== "number") return;
      const { from, to } = view.state.selection;
      const editing = view.hasFocus() && from >= pos && to <= pos + currentNode.nodeSize;
      container.classList.toggle("editing", editing);
    }

    // 主题切换时重渲染
    let lastTheme = useAppStore.getState().theme;
    const unsub = useAppStore.subscribe((s) => {
      if (s.theme !== lastTheme) {
        lastTheme = s.theme;
        if (lastText) void render(lastText);
      }
    });
    // 点击编辑器外部时退出编辑态
    const onDocMouseDown = () => setTimeout(refreshEditState, 0);
    document.addEventListener("mousedown", onDocMouseDown);

    schedule(node.textContent);
    refreshEditState();

    return {
      dom: container,
      contentDOM: src,
      update(updated) {
        if (updated.type.name !== "diagram") return false;
        currentNode = updated;
        const text = updated.textContent;
        if (text !== lastText) schedule(text);
        refreshEditState();
        return true;
      },
      destroy() {
        if (timer) clearTimeout(timer);
        unsub();
        document.removeEventListener("mousedown", onDocMouseDown);
      },
    };
  };
});

export const diagramPlugin = [
  remarkDiagram,
  diagramSchema,
  diagramInputRule,
  diagramView,
] as unknown as MilkdownPlugin[];
