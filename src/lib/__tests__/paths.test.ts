import { describe, it, expect } from "vitest";
import { resolveLink, resolvePath, dirnameOf, isAbsolutePath, isMarkdownFile, joinPath } from "../paths";

describe("paths", () => {
  it("dirnameOf", () => {
    expect(dirnameOf("/a/b/c.md")).toBe("/a/b");
  });

  it("joinPath", () => {
    expect(joinPath("/a/b", "c.md")).toBe("/a/b/c.md");
    expect(joinPath("/a/b/", "c.md")).toBe("/a/b/c.md");
    expect(joinPath("C:\\notes", "a.md")).toBe("C:\\notes\\a.md");
    expect(joinPath("C:\\notes\\", "a.md")).toBe("C:\\notes\\a.md");
    expect(dirnameOf("/a.md")).toBe("/");
    expect(dirnameOf("C:\\Users\\me\\doc.md")).toBe("C:/Users/me");
    expect(dirnameOf("plain.md")).toBe("");
  });

  it("isAbsolutePath", () => {
    expect(isAbsolutePath("/a/b")).toBe(true);
    expect(isAbsolutePath("C:\\a\\b")).toBe(true);
    expect(isAbsolutePath("a/b")).toBe(false);
  });

  it("resolvePath 相对/上级/绝对", () => {
    expect(resolvePath("/dir/doc.md", "a.md")).toBe("/dir/a.md");
    expect(resolvePath("/dir/doc.md", "../x/b.md")).toBe("/x/b.md");
    expect(resolvePath("/dir/doc.md", "./sub/../c.md")).toBe("/dir/c.md");
    expect(resolvePath("/dir/doc.md", "/abs/d.md")).toBe("/abs/d.md");
    expect(resolvePath("C:\\Users\\me\\doc.md", "sub\\e.md")).toBe("C:/Users/me/sub/e.md");
    expect(resolvePath("/a/b/c.md", "../../top.md")).toBe("/top.md");
  });

  it("resolveLink 外部链接", () => {
    expect(resolveLink("https://example.com", null)).toEqual({
      kind: "external",
      url: "https://example.com",
    });
    expect(resolveLink("mailto:a@b.c", null).kind).toBe("external");
  });

  it("resolveLink 锚点", () => {
    expect(resolveLink("#%E5%BC%80%E5%A7%8B", null)).toEqual({
      kind: "anchor",
      anchor: "开始",
    });
    expect(resolveLink("#sec", "/d/doc.md")).toEqual({ kind: "anchor", anchor: "sec" });
  });

  it("resolveLink 相对 md 文件 + 锚点", () => {
    expect(resolveLink("notes/todo.md", "/d/doc.md")).toEqual({
      kind: "file",
      path: "/d/notes/todo.md",
    });
    expect(resolveLink("todo.md#%E4%BB%BB%E5%8A%A1", "/d/doc.md")).toEqual({
      kind: "file",
      path: "/d/todo.md",
      anchor: "任务",
    });
  });

  it("resolveLink 绝对路径与 Windows 路径", () => {
    expect(resolveLink("/abs/a.md", null)).toEqual({ kind: "file", path: "/abs/a.md" });
    expect(resolveLink("C:\\x\\b.md", "C:\\y\\doc.md")).toEqual({
      kind: "file",
      path: "C:/x/b.md",
    });
  });

  it("resolveLink 无当前文件时的相对路径保持原样", () => {
    expect(resolveLink("a/b.md", null)).toEqual({ kind: "file", path: "a/b.md" });
  });

  it("resolveLink 非 md 文件也返回 file(交给系统应用)", () => {
    expect(resolveLink("img.png", "/d/doc.md")).toEqual({ kind: "file", path: "/d/img.png" });
    expect(resolveLink("ref.pdf", "/d/doc.md").kind).toBe("file");
  });

  it("resolveLink file:// URL", () => {
    expect(resolveLink("file:///a/b%20c.md", null)).toEqual({ kind: "file", path: "/a/b c.md" });
  });

  it("isMarkdownFile", () => {
    expect(isMarkdownFile("a.md")).toBe(true);
    expect(isMarkdownFile("a.MARKDOWN")).toBe(true);
    expect(isMarkdownFile("a.txt")).toBe(true);
    expect(isMarkdownFile("a.png")).toBe(false);
  });
});
