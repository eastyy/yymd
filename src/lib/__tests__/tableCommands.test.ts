// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor, rootCtx, editorViewCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { TextSelection } from "@milkdown/prose/state";
import { addRowAfter, addColumnAfter, deleteRow, deleteColumn, deleteTable } from "@milkdown/prose/tables";

const TABLE_MD = "| A | B |\n| --- | --- |\n| 1 | 2 |\n";

function rowCount(doc: { descendants: (f: (n: { type: { name: string } }) => void) => void }): number {
  let n = 0;
  doc.descendants((node: { type: { name: string } }) => {
    if (node.type.name === "table_row" || node.type.name === "table_header_row") n++;
  });
  return n;
}

function cellCount(doc: { descendants: (f: (n: { type: { name: string } }) => void) => void }): number {
  let n = 0;
  doc.descendants((node: { type: { name: string } }) => {
    if (node.type.name === "table_cell" || node.type.name === "table_header") n++;
  });
  return n;
}

function hasTable(doc: { descendants: (f: (n: { type: { name: string } }) => void) => void }): boolean {
  let found = false;
  doc.descendants((node: { type: { name: string } }) => {
    if (node.type.name === "table") found = true;
  });
  return found;
}

describe("表格命令集成(prosemirror-tables × milkdown gfm)", () => {
  it("行/列增删与删除表格", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, TABLE_MD);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    // 选区放入第一个正文单元格
    let cellPos = -1;
    view.state.doc.descendants((node, pos) => {
      if (cellPos < 0 && node.type.name === "table_cell") cellPos = pos + 1;
    });
    expect(cellPos).toBeGreaterThan(0);
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, cellPos)));

    // 插入行
    const rowsBefore = rowCount(view.state.doc);
    expect(addRowAfter(view.state, view.dispatch)).toBe(true);
    expect(rowCount(view.state.doc)).toBe(rowsBefore + 1);

    // 插入列(header 1 + body 2 = 3 行各加 1 格)
    const cellsBefore = cellCount(view.state.doc);
    expect(addColumnAfter(view.state, view.dispatch)).toBe(true);
    expect(cellCount(view.state.doc)).toBe(cellsBefore + 3);

    // 删除行
    expect(deleteRow(view.state, view.dispatch)).toBe(true);
    expect(rowCount(view.state.doc)).toBe(rowsBefore);

    // 删除列(2 行各减 1 格)
    expect(deleteColumn(view.state, view.dispatch)).toBe(true);
    expect(cellCount(view.state.doc)).toBe(cellsBefore - 2);

    // 删除表格
    expect(deleteTable(view.state, view.dispatch)).toBe(true);
    expect(hasTable(view.state.doc)).toBe(false);

    await editor.destroy();
  });
});
