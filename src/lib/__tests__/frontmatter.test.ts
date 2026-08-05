// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor, rootCtx, editorViewCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { getMarkdown } from "@milkdown/utils";
import { frontmatterPlugin } from "../frontmatterPlugin";

describe("frontmatter 节点管道", () => {
  it("解析 --- 块为 frontmatter 节点并可序列化往返", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const md = "---\ntitle: 你好\ntags:\n  - a\n---\n\n# 标题\n";
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, md);
      })
      .use(commonmark)
      .use(frontmatterPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    const first = view.state.doc.firstChild;
    expect(first?.type.name).toBe("frontmatter");
    expect(first?.textContent).toContain("title: 你好");

    const out = await editor.action(getMarkdown());
    expect(out).toContain("---\ntitle: 你好");
    expect(out).toMatch(/---\n\n# 标题/);

    await editor.destroy();
  });

  it("无 frontmatter 的文档不受影响", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "# 标题\n\n正文");
      })
      .use(commonmark)
      .use(frontmatterPlugin)
      .create();
    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.firstChild?.type.name).toBe("heading");
    await editor.destroy();
  });
});
