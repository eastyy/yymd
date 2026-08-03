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
});
