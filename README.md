# Yymd

一个类似 [Typora](https://typora.io) 的所见即所得 Markdown 编辑器,基于 **Tauri 2 + React 18 + Milkdown 7** 构建。

## ✨ 功能特性

**编辑体验**
- ✅ 所见即所得(源码与预览合一,无需分屏)
- ✅ CommonMark + GFM 全语法:标题、列表、任务列表、表格、脚注、删除线
- ✅ 数学公式(KaTeX)、代码高亮(Prism)
- ✅ Mermaid 图表(mermaid 11 最新语法:packet/architecture/kanban/radar/block-beta/timeline/mindmap/xychart 等,真实 SVG 渲染)
- ✅ 斜杠菜单:输入 `/` 快速插入标题/列表/表格/代码块等
- ✅ 浮动工具栏:选中文字即出现格式化按钮(粗体/斜体/链接/标题…)
- ✅ 源码模式切换(`Ctrl/Cmd + /`)
- ✅ 图片粘贴/拖拽,自动存入文档同级 `yymd-assets/`
- ✅ 文档内查找(`Ctrl/Cmd + F`),高亮匹配 + 上下跳转
- ✅ 打字机模式(光标垂直居中)、专注模式(非当前段落自动变暗)

**文件管理**
- ✅ 原生对话框打开 / 保存 / 另存为
- ✅ 自动保存(1.5s 防抖)、关闭前未保存确认
- ✅ 快速打开(`Ctrl/Cmd + P`):最近文件 + 全目录 md 模糊搜索
- ✅ 侧边栏:实时大纲导航 + 文件夹树
- ✅ 导出 HTML / PDF(状态栏按钮或文件菜单,HTML 内联 CSS 可离线打开)

**界面**
- ✅ 5 套主题:浅色 / 深色 / 护眼纸质(Newsprint) / 夜间(Night) / 悦读(Pixyll)
- ✅ 中英文字数统计
- ✅ 原生应用菜单(文件/编辑),主题与最近文件持久化

## 🚀 开发

```bash
npm install          # 安装依赖
npm run tauri dev    # 启动开发模式
npm run tauri build  # 打包生产版本
npm test             # 运行单元测试(vitest)
npm run typecheck    # TypeScript 类型检查
```

## 🏗 技术架构

```
src/
  components/   EditorPane / SourceEditor / Sidebar / Outline /
                FileTree / StatusBar / SearchBar / QuickOpen
  lib/          fileActions / bridge(Tauri IPC) / outline / stats /
                imagePlugin / searchPlugin / editModePlugins /
                export / themes / editorRef / welcome
  plugins/      slash-menu / floating-toolbar (vanilla DOM 插件)
  store/        zustand 全局状态
  styles/       themes.css + themes/(5 套)+ 排版 + 布局
src-tauri/      Rust:文件 IO / 原生菜单 / 设置 / 资源协议
.github/        Windows / macOS / Linux CI 构建工作流
```

## 🚧 路线图
- [ ] Word / LaTeX 导出(Pandoc)
- [ ] 图床上传(PicGo)
- [ ] 多标签页编辑
- [ ] 自动更新
- [ ] Windows 文件关联
- [ ] YAML frontmatter 可视化

详见 [STATUS.md](./STATUS.md)。
