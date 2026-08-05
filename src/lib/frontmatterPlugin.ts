/**
 * YAML frontmatter 支持(Typora 式):
 * - 解析文档开头的 `---` yaml 块为 frontmatter 节点(remark-frontmatter)
 * - 可编辑节点视图:带标签的块,内容即 yaml 源码
 * - 序列化回 `---\n…\n---`(通过自定义 remark-stringify yaml handler)
 */
import { $nodeSchema, $remark, $view } from "@milkdown/utils";
import { remarkStringifyOptionsCtx } from "@milkdown/core";
import remarkFrontmatter from "remark-frontmatter";
import type { MilkdownPlugin } from "@milkdown/ctx";

let identitySeq = 0;

/* ---------- 序列化:yaml 节点 → `---` 围栏 ---------- */
export const frontmatterStringify: MilkdownPlugin = (ctx) => {
  const prev = ctx.get(remarkStringifyOptionsCtx);
  const handlers = {
    ...prev.handlers,
    yaml: (node: { value?: string }) => {
      const v = node.value ?? "";
      return v ? `---\n${v}\n---` : "---\n---";
    },
  };
  ctx.update(remarkStringifyOptionsCtx, () => ({ ...prev, handlers }));
  return () => {};
};

/* ---------- 节点 ---------- */
export const frontmatterSchema = $nodeSchema("frontmatter", () => ({
  content: "text*",
  group: "block",
  marks: "",
  code: true,
  defining: true,
  isolating: true,
  whitespace: "pre",
  attrs: { identity: { default: "" } },
  parseDOM: [
    {
      tag: 'div[data-type="frontmatter"]',
      preserveWhitespace: "full" as const,
      contentElement: "pre",
    },
  ],
  toDOM: () => ["div", { "data-type": "frontmatter" }, ["pre", 0]],
  parseMarkdown: {
    match: (node) => node.type === "yaml",
    runner: (state, node, type) => {
      const value = String((node as { value?: unknown }).value ?? "");
      state.openNode(type, { identity: `f${++identitySeq}` });
      if (value) state.addText(value);
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "frontmatter",
    runner: (state, node) => {
      state.addNode("yaml", undefined, node.textContent || "");
    },
  },
}));

/* ---------- remark 解析扩展(第 3 参是传给插件的 options,默认 {} 会报错) ---------- */
export const remarkFrontmatterPlugin = $remark("remarkFrontmatter", () => remarkFrontmatter, ["yaml"]);

/* ---------- 视图:带标签的可编辑块 ---------- */
export const frontmatterView = $view(frontmatterSchema.node, () => {
  return (node) => {
    const container = document.createElement("div");
    container.className = "frontmatter";
    const label = document.createElement("div");
    label.className = "frontmatter-label";
    label.textContent = "YAML Front Matter";
    label.setAttribute("contenteditable", "false");
    const src = document.createElement("pre");
    src.className = "frontmatter-source";
    src.setAttribute("spellcheck", "false");
    container.append(label, src);
    src.textContent = node.textContent;
    return {
      dom: container,
      contentDOM: src,
      update(updated) {
        return updated.type.name === "frontmatter";
      },
    };
  };
});

export const frontmatterPlugin = [
  remarkFrontmatterPlugin,
  frontmatterSchema,
  frontmatterStringify,
  frontmatterView,
] as unknown as MilkdownPlugin[];
