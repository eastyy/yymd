// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { tocPlugin, isTocText } from "../tocPlugin";

describe("isTocText", () => {
  it("匹配 [toc] / [[toc]] 各种大小写", () => {
    expect(isTocText("[toc]")).toBe(true);
    expect(isTocText("[[toc]]")).toBe(true);
    expect(isTocText(" [TOC] ")).toBe(true);
    expect(isTocText("[[TOC]]")).toBe(true);
  });
  it("不误匹配普通文本", () => {
    expect(isTocText("toc")).toBe(false);
    expect(isTocText("[toc] x")).toBe(false);
    expect(isTocText("目录 [toc]")).toBe(false);
  });
});

describe("toc 节点管道", () => {
  it("[toc] 段落解析为 toc 节点,序列化回 [toc]", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "# 标题一\n\n[toc]\n\n## 标题二\n");
      })
      .use(commonmark)
      .use(tocPlugin)
      .create();

    const { typeName, md } = editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      let name: string | null = null;
      view.state.doc.descendants((node) => {
        if (!name && node.type.name === "toc") name = "toc";
      });
      const serializer = ctx.get(serializerCtx);
      return { typeName: name, md: serializer(view.state.doc) };
    });

    expect(typeName).toBe("toc");
    expect(md).toContain("[toc]");
    expect(md).not.toContain("[[toc]]");
  });

  it("输入 [toc] 触发输入规则创建节点", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "");
      })
      .use(commonmark)
      .use(tocPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    for (const ch of "[toc]") {
      const from = view.state.selection.from;
      const handled = view.someProp("handleTextInput", (f) =>
        f(view, from, from, ch, () => view.state.tr),
      );
      if (!handled) view.dispatch(view.state.tr.insertText(ch, from));
    }
    const first = view.state.doc.firstChild;
    expect(first?.type.name).toBe("toc");
  });
});
