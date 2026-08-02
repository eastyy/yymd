# 导出功能集成说明(Export Integration)

本模块 `src/lib/export.ts` 提供纯前端 HTML/PDF 导出能力,零新增依赖。父级按以下步骤接线即可。

## 导出 API

```ts
import { wrapHtmlDocument, downloadHtml, printToPdf, type ExportTheme } from "../lib/export";
```

| 函数 | 作用 |
| --- | --- |
| `wrapHtmlDocument(bodyHtml, title, theme)` | 把正文 HTML 包成可离线打开的独立 HTML 文档(内联 GitHub 风格 CSS) |
| `downloadHtml(filename, html)` | Blob + `URL.createObjectURL` + `a.click()` 触发浏览器下载(自动补 `.html` 后缀) |
| `printToPdf(html)` | 隐藏 iframe 写入文档并 `print()`,供用户另存为 PDF |

## 如何获取正文 HTML

编辑器渲染结果在 `.ProseMirror` 节点中:

```ts
const bodyHtml = document.querySelector(".ProseMirror")?.innerHTML ?? "";
```

> 注意:应在 **WYSIWYG 视图**下导出。源码模式下没有 `.ProseMirror`,需先切回编辑视图或用 milkdown 的 serializer 把 markdown 转 HTML。

## 建议的接线位置

### 方案 A:状态栏按钮(最快)

在 `src/components/StatusBar.tsx` 的 `.statusbar-right` 增加一个"导出"按钮(或下拉菜单):

```tsx
import { wrapHtmlDocument, downloadHtml, printToPdf } from "../lib/export";
import { useAppStore, displayName } from "../store/useAppStore";

// 在组件内:
const theme = useAppStore((s) => s.theme);          // 'github' | 'github-dark'
const filePath = useAppStore((s) => s.filePath);

function exportAs(kind: "html" | "pdf") {
  const bodyHtml = document.querySelector(".ProseMirror")?.innerHTML ?? "";
  const title = displayName(filePath);             // 例如 "笔记.md"
  const html = wrapHtmlDocument(bodyHtml, title, theme);
  if (kind === "html") {
    downloadHtml(title.replace(/\.md$/i, "") + ".html", html);
  } else {
    printToPdf(html);
  }
}
```

```tsx
<button className="status-btn" onClick={() => exportAs("html")}>导出 HTML</button>
<button className="status-btn" onClick={() => exportAs("pdf")}>导出 PDF</button>
```

### 方案 B:原生菜单项(更贴近 Typora)

1. `src-tauri/src/lib.rs` 的 `build_menu` 里新增菜单项:
   ```rust
   let export_html = MenuItem::with_id(app, "file.export_html", "导出为 HTML", true, None::<&str>)?;
   let export_pdf  = MenuItem::with_id(app, "file.export_pdf", "导出为 PDF", true, None::<&str>)?;
   ```
   并加入 `file_menu` 的 items 数组。`on_menu_event` 已对所有 `file.*` id 广播 `menu://file.export_html` / `menu://file.export_pdf` 事件,无需改动。

2. 在 `src/App.tsx` 现有的 `listen` handlers 数组中追加:
   ```ts
   ["menu://file.export_html", () => exportCurrent("html")],
   ["menu://file.export_pdf", () => exportCurrent("pdf")],
   ```

## 主题映射

`useAppStore` 的 `theme` 为 `'github' | 'github-dark'`,与 `ExportTheme` 完全一致,可直接透传给 `wrapHtmlDocument`。若将来加入第三套主题,需在调用处做一次映射(本模块仅支持这两套,非法值自动回退 `github`)。

## 测试

```bash
npx vitest run src/lib/__tests__/export.test.ts
```

9 个用例覆盖:文档结构、CSS 变量、title 转义、深色主题、非法主题回退、正文保留、escapeHtml、打印媒体查询。

## 已知限制(可列入 roadmap)

- `printToPdf` 依赖浏览器/WebView 打印对话框,PDF 排版由系统打印引擎决定;Tauri 的 WebView2/WKWebView 均支持。
- 图片若为 `asset://` 本地路径,导出的 HTML 在其它机器上打开会丢图——后续可在导出时把 `<img src>` 内联为 base64。
- Mermaid/KaTeX 依赖运行时渲染后的 DOM,导出 innerHTML 已包含渲染结果(SVG/MathML),因此离线 HTML 可正常显示。
