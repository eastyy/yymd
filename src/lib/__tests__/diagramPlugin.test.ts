// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { diagramPlugin } from "../diagramPlugin";

const MD = "```mermaid\nflowchart TD\n  A --> B\n```\n";

describe("diagram 节点管道", () => {
  it("```mermaid 围栏解析为 diagram 节点,并能序列化回围栏", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, MD);
      })
      .use(commonmark)
      .use(diagramPlugin)
      .create();

    const { typeName, text, md } = editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const first = view.state.doc.firstChild;
      const serializer = ctx.get(serializerCtx);
      return {
        typeName: first?.type.name ?? null,
        text: first?.textContent ?? "",
        md: serializer(view.state.doc),
      };
    });

    expect(typeName).toBe("diagram");
    expect(text).toContain("flowchart TD");
    expect(md).toContain("```mermaid");
    expect(md).toContain("flowchart TD");
  });

  it("输入 ```mermaid 触发输入规则创建节点,Enter 插入换行", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "");
      })
      .use(commonmark)
      .use(diagramPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));

    // 模拟逐字输入 ```mermaid
    for (const ch of "```mermaid") {
      const from = view.state.selection.from;
      const handled = view.someProp("handleTextInput", (f) => f(view, from, from, ch, () => view.state.tr));
      if (!handled) view.dispatch(view.state.tr.insertText(ch, from));
    }
    const first = view.state.doc.firstChild;
    expect(first?.type.name).toBe("diagram");

    // 模拟 Enter 键:应插入换行而不是拆分节点
    const enter = new KeyboardEvent("keydown", { key: "Enter" });
    const handledEnter = view.someProp("handleKeyDown", (f) => f(view, enter));
    expect(handledEnter).toBe(true);
    for (const ch of "flowchart TD") {
      const from = view.state.selection.from;
      const h = view.someProp("handleTextInput", (f) => f(view, from, from, ch, () => view.state.tr));
      if (!h) view.dispatch(view.state.tr.insertText(ch, from));
    }
    const after = view.state.doc.firstChild;
    expect(after?.type.name).toBe("diagram");
    expect(after?.textContent).toBe("\nflowchart TD");
  });
});
