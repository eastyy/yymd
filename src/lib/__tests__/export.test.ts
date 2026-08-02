import { describe, it, expect } from "vitest";
import { wrapHtmlDocument, escapeHtml, exportCss } from "../export";

describe("wrapHtmlDocument", () => {
  it("生成完整独立 HTML 文档", () => {
    const html = wrapHtmlDocument("<h1>你好</h1>", "我的文档", "github");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>我的文档</title>");
    expect(html).toContain("<h1>你好</h1>");
    expect(html).toContain("</html>");
  });

  it("内联至少一个 CSS 变量定义", () => {
    const html = wrapHtmlDocument("<p>x</p>", "t", "github");
    expect(html).toMatch(/--bg:\s*#ffffff/);
    expect(html).toMatch(/--text:\s*#1f2328/);
    expect(html).toMatch(/--accent:\s*#0969da/);
  });

  it("转义 title 中的 HTML 特殊字符", () => {
    const html = wrapHtmlDocument("<p>x</p>", "<script>alert(1)</script>", "github");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<title><script>");
  });

  it("支持深色主题并设置 data-theme", () => {
    const html = wrapHtmlDocument("<p>x</p>", "t", "github-dark");
    expect(html).toContain('data-theme="github-dark"');
    expect(html).toMatch(/--bg:\s*#0d1117/);
  });

  it("非法 theme 回退到 github", () => {
    const html = wrapHtmlDocument(
      "<p>x</p>",
      "t",
      // @ts-expect-error 故意传入非法值测试回退
      "nope",
    );
    expect(html).toContain('data-theme="github"');
  });

  it("正文原样保留(含表格/代码)", () => {
    const body = '<table><tr><td>a</td></tr></table><pre><code>let x = 1;</code></pre>';
    const html = wrapHtmlDocument(body, "t", "github");
    expect(html).toContain(body);
  });
});

describe("escapeHtml", () => {
  it("转义 & < > \"", () => {
    expect(escapeHtml('&<>"')).toBe("&amp;&lt;&gt;&quot;");
  });
});

describe("exportCss", () => {
  it("包含打印媒体查询", () => {
    expect(exportCss("github")).toContain("@media print");
  });
  it("深色主题 token 颜色", () => {
    expect(exportCss("github-dark")).toContain("#ff7b72");
  });
});
