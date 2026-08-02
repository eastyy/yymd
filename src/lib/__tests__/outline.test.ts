import { describe, it, expect } from "vitest";
import { extractOutline, stripInline } from "../outline";

describe("extractOutline", () => {
  it("提取 ATX 标题及层级", () => {
    const md = "# 一级\n正文\n## 二级\n### 三级";
    const items = extractOutline(md);
    expect(items).toEqual([
      { level: 1, text: "一级", line: 0 },
      { level: 2, text: "二级", line: 2 },
      { level: 3, text: "三级", line: 3 },
    ]);
  });

  it("忽略代码块内的 #", () => {
    const md = "# 标题\n```bash\n# 这是注释\n## 不是标题\n```\n## 真标题";
    const items = extractOutline(md);
    expect(items.map((i) => i.text)).toEqual(["标题", "真标题"]);
  });

  it("支持 Setext 标题", () => {
    const md = "一级标题\n===\n二级标题\n---";
    const items = extractOutline(md);
    expect(items).toEqual([
      { level: 1, text: "一级标题", line: 0 },
      { level: 2, text: "二级标题", line: 2 },
    ]);
  });

  it("去除行内标记", () => {
    const md = "# **加粗** 与 `code` 和 [链接](http://x.com)";
    const items = extractOutline(md);
    expect(items[0].text).toBe("加粗 与 code 和 链接");
  });

  it("忽略尾部的 # 号", () => {
    const items = extractOutline("## 标题 ##");
    expect(items[0].text).toBe("标题");
    expect(items[0].level).toBe(2);
  });
});

describe("stripInline", () => {
  it("去除各类标记", () => {
    expect(stripInline("*斜体* **粗体** ~~删除~~")).toBe("斜体 粗体 删除");
  });
});
