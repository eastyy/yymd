# Yymd 开发进度(自动生成)

> 目标:对齐 Typora 的所见即所得 Markdown 编辑器
> 技术栈:Tauri 2 + React 18 + Milkdown 7.5.9 + zustand

## ✅ 已完成

### P0 核心(已通过完整构建 + 运行时冒烟测试)
- [x] Tauri 2 应用骨架(macOS .app / .dmg 已打包验证)
- [x] 所见即所得编辑(Milkdown,源码与预览合一)
- [x] CommonMark + GFM:标题、列表、任务列表、表格、删除线、脚注
- [x] 数学公式 KaTeX(行内 + 块级)
- [x] 代码块 Prism 语法高亮
- [x] Mermaid 图表:升级 **mermaid 11.16**,真实 SVG 渲染(自研可编辑节点),支持全部最新图类型
  (packet / architecture / kanban / radar / block-beta / timeline / mindmap / xychart 等)
  - 输入 ` ```mermaid ` 立即创建图表节点,点击即可就地编辑源码,失焦后只显示渲染结果
  - 语法错误回退显示源码;主题切换自动重渲染;导出 HTML 内联 SVG
- [x] 源码模式切换(`Cmd/Ctrl + /`)
- [x] 原生应用菜单(文件/编辑)+ 全局快捷键(`Cmd+S/O/N`)
- [x] 文件打开 / 保存 / 另存为(原生对话框)
- [x] 中英文字数统计
- [x] 侧边栏:实时大纲导航 + 文件树
- [x] 浅色 / 深色主题

### P1 增强(多 agent 协作 + 自主开发)
- [x] **图片处理**:粘贴/拖拽图片自动存入文档同级 `yymd-assets/`(未保存文档回退 base64 内嵌)
- [x] **文档内查找**(`Cmd+F`):高亮全部匹配,上/下跳转
- [x] **快速打开**(`Cmd+P`):最近文件 + 递归搜索当前文件夹 md 文件
- [x] **最近文件**:持久化到设置,打开即记录
- [x] **自动保存**:1.5s 防抖
- [x] **关闭确认**:有未保存更改时弹窗询问
- [x] **导出 HTML / PDF**:原生菜单 + 状态栏按钮,纯前端(打印对话框存 PDF),内联排版 CSS 可离线打开
- [x] **5 套主题**:浅色 / 深色 / 护眼纸质(Newsprint) / 夜间 / 悦读(Pixyll),下拉切换 + 持久化
- [x] **打字机模式**:光标始终垂直居中
- [x] **真·专注模式**:非当前段落自动变暗
- [x] **斜杠菜单**:输入 `/` 弹出块级插入(标题/列表/表格/代码块/分割线等),键盘过滤+导航
- [x] **选区浮动工具栏**:选中文字出现格式化按钮(粗体/斜体/删除线/行内代码/链接/标题/引用/代码块)

## 📋 后续路线图
- [ ] Word / LaTeX 导出(Pandoc 集成)
- [ ] 图床上传(PicGo)
- [ ] 多标签页
- [ ] 自动更新(tauri-plugin-updater)
- [ ] Windows 文件关联 / 右键菜单
- [ ] 拼写检查
- [ ] YAML frontmatter 可视化

## 🧪 验证状态
- TypeScript:`tsc --noEmit` ✅ 0 error
- 单元测试:vitest **36 passed**(大纲解析、字数统计、导出、主题注册表、mermaid v11 最新语法解析、diagram 节点管道端到端)
- Rust:`cargo check` ✅
- 完整构建:`cargo tauri build --debug` ✅(Yymd.app + DMG,含全部功能)
- 运行时:启动二进制存活、无错误日志、编辑器(含斜杠菜单/浮动工具栏)初始化正常 ✅
- Windows 构建:已配置 GitHub Actions(推 `v*` tag 触发)

## 🏗 架构
```
src/                     React 前端
  components/            EditorPane / SourceEditor / Sidebar / Outline /
                         FileTree / StatusBar / SearchBar / QuickOpen
  plugins/                 slash-menu / floating-toolbar(vanilla DOM 插件)
  lib/                   fileActions / bridge(Tauri) / outline / stats /
                         imagePlugin / searchPlugin / editModePlugins /
                         export / themes / editorRef / welcome
  store/                 zustand 全局状态
  styles/                themes.css + themes/(5 套)+ 排版 + 布局
src-tauri/               Rust:文件 IO / 原生菜单 / 设置 / 资源协议
scripts/gen-icon.mjs     纯 Node 生成应用图标
.github/workflows/       Windows / macOS / Linux CI 构建
```
