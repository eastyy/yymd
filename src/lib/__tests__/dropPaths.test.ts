import { describe, expect, it } from "vitest";
import { extOf, isImagePath, isMarkdownPath, planDroppedPaths } from "../dropPaths";

describe("extOf", () => {
  it("取小写扩展名", () => {
    expect(extOf("/a/b/Notes.MD")).toBe(".md");
    expect(extOf("C:\\docs\\x.Markdown")).toBe(".markdown");
  });
  it("无扩展名 / 隐藏文件", () => {
    expect(extOf("/a/b/README")).toBe("");
    expect(extOf("/a/b/.gitignore")).toBe("");
  });
});

describe("isMarkdownPath / isImagePath", () => {
  it("识别 markdown", () => {
    expect(isMarkdownPath("/x/a.md")).toBe(true);
    expect(isMarkdownPath("/x/a.mdown")).toBe(true);
    expect(isMarkdownPath("/x/a.txt")).toBe(false);
  });
  it("识别图片", () => {
    expect(isImagePath("/x/a.PNG")).toBe(true);
    expect(isImagePath("/x/a.jpeg")).toBe(true);
    expect(isImagePath("/x/a.pdf")).toBe(false);
  });
});

describe("planDroppedPaths", () => {
  it("md 文件优先打开", () => {
    const plan = planDroppedPaths(["/d/a.txt", "/d/b.md", "/d/c.md"], new Set());
    expect(plan.markdown).toBe("/d/b.md");
    expect(plan.directory).toBeNull();
    expect(plan.images).toEqual([]);
  });
  it("文件夹设为工作区", () => {
    const plan = planDroppedPaths(["/d/dir1", "/d/dir2"], new Set(["/d/dir1", "/d/dir2"]));
    expect(plan.directory).toBe("/d/dir1");
    expect(plan.markdown).toBeNull();
  });
  it("混合:收集全部图片", () => {
    const plan = planDroppedPaths(
      ["/d/a.png", "/d/b.jpg", "/d/dir", "/d/c.md"],
      new Set(["/d/dir"]),
    );
    expect(plan.images).toEqual(["/d/a.png", "/d/b.jpg"]);
    expect(plan.directory).toBe("/d/dir");
    expect(plan.markdown).toBe("/d/c.md");
  });
  it("空列表", () => {
    const plan = planDroppedPaths([], new Set());
    expect(plan).toEqual({ markdown: null, directory: null, images: [] });
  });
});
