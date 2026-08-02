/**
 * 导出模块(纯前端)。
 *
 * - wrapHtmlDocument:把编辑器渲染出的 HTML 片段包成可离线打开的独立 HTML 文档。
 * - downloadHtml:触发浏览器下载该文档。
 * - printToPdf:用隐藏 iframe 调起系统打印对话框,供用户另存为 PDF。
 *
 * 排版 CSS 参考 src/styles/editor.css,自带 CSS 变量,无外部依赖。
 */

export type ExportTheme = "github" | "github-dark";

/** 两套 GitHub 风格主题变量 */
const THEME_VARS: Record<ExportTheme, string> = {
  github: `
    --bg: #ffffff;
    --bg-secondary: #f6f8fa;
    --text: #1f2328;
    --text-secondary: #57606a;
    --text-muted: #8b949e;
    --border: #d0d7de;
    --border-light: #eaeef2;
    --accent: #0969da;
    --code-bg: #f6f8fa;
    --code-text: #24292f;
    --blockquote-border: #d0d7de;
    --blockquote-text: #57606a;
    --table-border: #d0d7de;
    --table-stripe: #f6f8fa;
    --selection: #b6d7ff;
  `,
  "github-dark": `
    --bg: #0d1117;
    --bg-secondary: #161b22;
    --text: #e6edf3;
    --text-secondary: #8b949e;
    --text-muted: #6e7681;
    --border: #30363d;
    --border-light: #21262d;
    --accent: #4493f8;
    --code-bg: #161b22;
    --code-text: #e6edf3;
    --blockquote-border: #30363d;
    --blockquote-text: #8b949e;
    --table-border: #30363d;
    --table-stripe: #161b22;
    --selection: #264f78;
  `,
};

/** 独立文档用的排版 CSS(作用域 .markdown-body) */
export function exportCss(theme: ExportTheme): string {
  const vars = THEME_VARS[theme] ?? THEME_VARS.github;
  return `:root {${vars}}
  body[data-theme="github-dark"] { color-scheme: dark; }
  body[data-theme="github"] { color-scheme: light; }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    font-size: 16px;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  .markdown-body {
    max-width: 860px;
    margin: 0 auto;
    padding: 48px 64px 96px;
    word-wrap: break-word;
  }
  .markdown-body ::selection { background: var(--selection); }

  /* 标题 */
  .markdown-body h1, .markdown-body h2, .markdown-body h3,
  .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    font-weight: 600; line-height: 1.35; margin: 1.4em 0 0.6em;
  }
  .markdown-body h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border-light); }
  .markdown-body h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border-light); }
  .markdown-body h3 { font-size: 1.25em; }
  .markdown-body h4 { font-size: 1em; }
  .markdown-body h5 { font-size: 0.9em; }
  .markdown-body h6 { font-size: 0.85em; color: var(--text-secondary); }

  /* 段落与行内 */
  .markdown-body p { margin: 0.7em 0; }
  .markdown-body a { color: var(--accent); text-decoration: none; }
  .markdown-body a:hover { text-decoration: underline; }
  .markdown-body strong { font-weight: 600; }

  /* 行内代码 */
  .markdown-body code {
    background: var(--code-bg); color: var(--code-text);
    padding: 0.2em 0.4em; border-radius: 4px;
    font-family: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
    font-size: 0.875em;
  }
  /* 代码块 */
  .markdown-body pre {
    background: var(--code-bg); border: 1px solid var(--border-light);
    border-radius: 8px; padding: 16px; overflow-x: auto; margin: 1em 0;
  }
  .markdown-body pre code { background: transparent; padding: 0; font-size: 0.875em; line-height: 1.6; }

  /* 引用 */
  .markdown-body blockquote {
    margin: 1em 0; padding: 0.2em 1em;
    border-left: 4px solid var(--blockquote-border); color: var(--blockquote-text);
  }
  .markdown-body blockquote p { margin: 0.4em 0; }

  /* 列表 */
  .markdown-body ul, .markdown-body ol { padding-left: 1.8em; margin: 0.7em 0; }
  .markdown-body li { margin: 0.25em 0; }
  .markdown-body li p { margin: 0.3em 0; }
  .markdown-body li.task-list-item { list-style: none; margin-left: -1.4em; }
  .markdown-body li.task-list-item input[type="checkbox"] { margin-right: 0.5em; accent-color: var(--accent); }

  /* 表格 */
  .markdown-body table {
    border-collapse: collapse; margin: 1em 0; width: auto; max-width: 100%;
    display: block; overflow-x: auto;
  }
  .markdown-body th, .markdown-body td { border: 1px solid var(--table-border); padding: 8px 14px; min-width: 60px; }
  .markdown-body th { background: var(--bg-secondary); font-weight: 600; }
  .markdown-body tr:nth-child(even) td { background: var(--table-stripe); }

  /* 分割线 / 图片 */
  .markdown-body hr { border: none; border-top: 2px solid var(--border-light); margin: 2em 0; }
  .markdown-body img { max-width: 100%; border-radius: 6px; margin: 0.5em 0; }

  /* 数学公式 / 图表 */
  .markdown-body .math-block, .markdown-body .math-display { overflow-x: auto; padding: 0.5em 0; text-align: center; }
  .markdown-body .diagram { text-align: center; margin: 1em 0; }

  /* Prism 代码高亮 token */
  .token.comment, .token.prolog, .token.doctype, .token.cdata { color: var(--text-muted); }
  .token.punctuation { color: var(--text-secondary); }
  .token.property, .token.tag, .token.constant, .token.symbol, .token.deleted { color: #cf222e; }
  .token.boolean, .token.number { color: #0550ae; }
  .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #0a3069; }
  .token.operator, .token.entity, .token.url, .token.variable { color: var(--text); }
  .token.atrule, .token.attr-value, .token.function, .token.class-name { color: #8250df; }
  .token.keyword { color: #cf222e; }
  .token.regex, .token.important { color: #953800; }
  body[data-theme="github-dark"] .token.property,
  body[data-theme="github-dark"] .token.tag,
  body[data-theme="github-dark"] .token.keyword { color: #ff7b72; }
  body[data-theme="github-dark"] .token.string,
  body[data-theme="github-dark"] .token.selector { color: #a5d6ff; }
  body[data-theme="github-dark"] .token.function,
  body[data-theme="github-dark"] .token.class-name { color: #d2a8ff; }
  body[data-theme="github-dark"] .token.number,
  body[data-theme="github-dark"] .token.boolean { color: #79c0ff; }

  /* 打印优化 */
  @media print {
    body { background: #fff; }
    .markdown-body { max-width: none; padding: 0; }
    .markdown-body pre, .markdown-body blockquote, .markdown-body table,
    .markdown-body img { page-break-inside: avoid; }
  }
`;
}

/** 转义 HTML 特殊字符(用于 title 等文本注入点) */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 把正文 HTML 片段包裹成完整、可离线打开的独立 HTML 文档。
 * @param bodyHtml 编辑器渲染出的 HTML(通常是 .ProseMirror 的 innerHTML)
 * @param title    文档标题(会被转义)
 * @param theme    主题
 */
export function wrapHtmlDocument(
  bodyHtml: string,
  title: string,
  theme: ExportTheme = "github",
): string {
  const safeTheme: ExportTheme = theme === "github-dark" ? "github-dark" : "github";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
${exportCss(safeTheme)}
</style>
</head>
<body data-theme="${safeTheme}">
<article class="markdown-body">
${bodyHtml}
</article>
</body>
</html>`;
}

/** 触发浏览器下载 HTML 文件 */
export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.toLowerCase().endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 用隐藏 iframe 写入完整文档并调起打印对话框,供用户另存为 PDF。
 * 等待资源加载后再打印,避免图片/公式丢失。
 */
export function printToPdf(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    document.body.removeChild(iframe);
    return;
  }

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };
  win.onafterprint = cleanup;

  doc.open();
  doc.write(html);
  doc.close();

  const doPrint = () => {
    win.focus();
    win.print();
  };

  // 等待图片/字体等资源加载
  if (doc.readyState === "complete") {
    setTimeout(doPrint, 250);
  } else {
    win.onload = () => setTimeout(doPrint, 250);
    // 兜底:无论如何 3s 后尝试打印
    setTimeout(doPrint, 3000);
  }
  // 兜底清理
  setTimeout(cleanup, 120_000);
}
