// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor, rootCtx, editorViewCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import type { EditorView } from "@milkdown/prose/view";
import { emojiPlugin, emojiFor, EMOJI_MAP } from "../emojiPlugin";

function type(view: EditorView, text: string) {
  for (const ch of text) {
    const from = view.state.selection.from;
    const handled = view.someProp("handleTextInput", (f) =>
      (f as (v: EditorView, a: number, b: number, t: string, d: () => unknown) => boolean)(view, from, from, ch, () => view.state.tr),
    );
    if (!handled) view.dispatch(view.state.tr.insertText(ch, from));
  }
}

describe("emoji 短代码", () => {
  it("emojiFor 映射与大小写不敏感", () => {
    expect(emojiFor("smile")).toBe("😄");
    expect(emojiFor("SMILE")).toBe("😄");
    expect(emojiFor("rocket")).toBe("🚀");
    expect(emojiFor("unknown_code_xyz")).toBeUndefined();
    expect(Object.keys(EMOJI_MAP).length).toBeGreaterThan(100);
  });

  it("输入 :smile: 自动替换为 😄", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "");
      })
      .use(commonmark)
      .use(emojiPlugin)
      .create();
    const view = editor.action((ctx) => ctx.get(editorViewCtx));

    type(view, "hi :smile:");
    expect(view.state.doc.textContent).toBe("hi 😄");

    type(view, " :rocket: go");
    expect(view.state.doc.textContent).toBe("hi 😄 🚀 go");

    await editor.destroy();
  });

  it("未知短代码保持原样", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "");
      })
      .use(commonmark)
      .use(emojiPlugin)
      .create();
    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    // 用不含下划线的代码,避免触发 commonmark 强调输入规则
    type(view, ":zzqqxx:");
    expect(view.state.doc.textContent).toBe(":zzqqxx:");
    await editor.destroy();
  });
});
