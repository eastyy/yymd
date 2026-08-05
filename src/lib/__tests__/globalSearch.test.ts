import { describe, it, expect } from "vitest";
import { searchLines, groupResults } from "../globalSearch";

describe("全局搜索核心", () => {
  it("searchLines 大小写不敏感、返回行号与截断文本", () => {
    const content = "第一行\nHello World\n第三行\nhello again\n";
    const hits = searchLines("/a.md", content, "hello");
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ file: "/a.md", line: 2, text: "Hello World" });
    expect(hits[1].line).toBe(4);
  });

  it("空查询无结果;每文件上限生效", () => {
    expect(searchLines("/a.md", "x\nx\nx", "")).toEqual([]);
    const hits = searchLines("/a.md", "q\n".repeat(100), "q", 10);
    expect(hits).toHaveLength(10);
  });

  it("groupResults 按文件分组保持顺序", () => {
    const grouped = groupResults([
      { file: "/b.md", line: 1, text: "x" },
      { file: "/a.md", line: 3, text: "y" },
      { file: "/b.md", line: 5, text: "z" },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].file).toBe("/b.md");
    expect(grouped[0].hits).toHaveLength(2);
    expect(grouped[1].file).toBe("/a.md");
  });
});
