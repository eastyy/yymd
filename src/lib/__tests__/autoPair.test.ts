// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor, rootCtx, editorViewCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { TextSelection } from "@milkdown/prose/state";
import { autoPairPlugin } from "../autoPairPlugin";

function pressKey(view: { someProp: (name: string, cb: (f: (v: unknown, e: KeyboardEvent) => boolean) => boolean) => boolean }, key: string): boolean {
  const ev = new KeyboardEvent("keydown", { key });
  return view.someProp("handleKeyDown", (f) => f(view, ev)) || false;
}

describe("选区自动包裹", () => {
  it("选中文字后按成对符号包裹选区", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "hello world");
      })
      .use(autoPairPlugin)
      .use(commonmark)
      .create();
    const view = editor.action((ctx) => ctx.get(editorViewCtx));

    // 选中 "hello"(doc pos 1..6)
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 6)));

    expect(pressKey(view, "(")).toBe(true);
    expect(view.state.doc.textContent).toBe("(hello) world");

    // 再选中整段文本 "(hello) world"(pos 1..14),测试引号
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 14)));
    expect(pressKey(view, '"')).toBe(true);
    expect(view.state.doc.textContent).toBe('"(hello) world"');

    await editor.destroy();
  });

  it("无选区时不拦截,符号正常插入", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "abc");
      })
      .use(autoPairPlugin)
      .use(commonmark)
      .create();
    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)));
    expect(pressKey(view, "(")).toBe(false); // 空选区不拦截
    await editor.destroy();
  });
});
