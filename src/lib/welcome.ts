export const WELCOME_DOC = `# 欢迎使用 Yymd

Yymd 是一个类似 Typora 的所见即所得 Markdown 编辑器。

## 基础语法

支持 **加粗**、*斜体*、~~删除线~~、\`行内代码\`、[链接](https://markdown.com.cn) 等。

### 列表

- 无序列表项
- 另一项
  - 嵌套项

1. 有序列表
2. 第二项

### 任务列表

- [x] 所见即所得编辑
- [x] 实时预览
- [ ] 导出 PDF / Word(开发中)

## 表格

| 功能 | 状态 | 说明 |
| ---- | :--: | ---- |
| WYSIWYG | ✅ | 源码与预览合一 |
| 代码高亮 | ✅ | Prism |
| 数学公式 | ✅ | KaTeX |

## 代码块

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("Yymd"));
\`\`\`

## 数学公式

行内公式 $E = mc^2$,块级公式:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## 引用

> 好的工具让写作回归内容本身。

---

按 \`/\` 呼出插入菜单;选中文本出现浮动工具栏;侧边栏查看大纲。
`;
