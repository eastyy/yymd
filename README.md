# 📝 Yymd

一个对标 [Typora](https://typora.io) 的**所见即所得 Markdown 桌面编辑器**。
源码与预览合一,边写边渲染,支持 Windows / macOS / Linux。

基于 **Tauri 2 + React 18 + Milkdown(ProseMirror)** 构建,轻量原生、开箱即用。

## ✨ 功能特性

### 编辑体验
- **所见即所得**:输入 Markdown 即实时渲染,无需分屏
- **全语法支持**:CommonMark + GFM(表格、任务列表、删除线、脚注)
- **数学公式**:KaTeX 行内 `$x^2$` 与块级公式
- **代码高亮**:Prism 全语言高亮
- **Mermaid 图表**:mermaid v11 最新语法(flowchart / sequence / class / state /
  er / gantt / pie / timeline / mindmap / kanban / radar / xychart / packet 等),真实 SVG 渲染
- **YAML frontmatter**:文档头部元数据解析为可编辑区块
- **斜杠菜单**:输入 `/` 快速插入标题、列表、表格、代码块、图表
- **浮动工具栏**:选中文字弹出格式化按钮(粗体 / 斜体 / 链接 / 标题…)
- **表格工具栏**:光标进入表格即出现,一键增删行列
- **智能输入**:
  - Emoji 短代码——`:smile:` → 😄(120+ 常用代码)
  - 选区自动包裹——选中文字后按引号/括号自动包住
  - 输入 ```mermaid 即建图表块
- **链接导航**:点击 `.md` 链接直接打开文件,`#锚点` 滚动定位,外部链接浏览器打开
- **源码模式**:一键切换纯 Markdown 编辑(`⌘/`)
- **打字机模式 / 专注模式**
- **图片处理**:粘贴/拖拽图片自动保存到 `yymd-assets/` 并插入

### 文件管理
- 原生对话框打开 / 保存 / 另存为,**自动保存**(1.5s 防抖)
- **会话恢复**:重启自动打开上次的文件
- **快速打开**(`⌘P`):最近文件 + 全目录模糊搜索
- **文件夹全局搜索**(`⌘⇧F`):搜索所有 markdown 内容,点击结果跳转对应行
- 侧边栏:**实时大纲** + **文件树**(右键新建/重命名/删除/在访达中显示)
- 导出 **HTML / PDF**(HTML 内联样式,可离线打开)

### 界面
- 5 套主题:GitHub 浅色 / GitHub 深色 / 纸质 Newsprint / 夜间 Night / 悦读 Pixyll
- **字体缩放**(`⌘=` / `⌘-` / `⌘0` 复位),所见即所得与源码模式同步
- 中英文字数统计、原生应用菜单、关闭前未保存确认

## ⌨️ 快捷键

| 快捷键 | 功能 |
|---|---|
| `⌘S` / `⌘⇧S` | 保存 / 另存为 |
| `⌘N` / `⌘O` | 新建 / 打开 |
| `⌘P` | 快速打开文件 |
| `⌘F` | 文档内查找 |
| `⌘⇧F` | 文件夹全局搜索 |
| `⌘/` | 切换源码模式 |
| `⌘=` / `⌘-` / `⌘0` | 放大 / 缩小 / 复位字号 |

## 🚀 快速开始

### 下载安装
在 [Releases](../../releases) 页面下载对应平台安装包:
- Windows:`.msi` / `.exe`(NSIS)
- macOS:`.dmg`
- Linux:`.deb` / `.AppImage`

### 从源码构建

需要 [Rust](https://rustup.rs)(≥ 1.77)和 [Node.js](https://nodejs.org)(≥ 20)。

```bash
git clone <repo-url> yymd
cd yymd
npm install
npm run tauri dev       # 开发模式热重载
npm run tauri build     # 打包安装包
```

## 🧪 开发与测试

```bash
npm test            # vitest 单元测试(60 个,覆盖解析/导出/主题/插件管道)
npm run typecheck   # TypeScript 严格类型检查
```

## 🏗 技术架构

```
src/
  components/    EditorPane(Milkdown 装配) / Sidebar / Outline / FileTree /
                 StatusBar / SearchBar / QuickOpen / GlobalSearch / SourceEditor
  lib/           自定义插件:diagram(Mermaid)/ frontmatter / link / emoji /
                 autoPair / image / search / 打字机专注模式;
                 工具:fileActions / export / themes / outline / stats / paths
  plugins/       斜杠菜单 / 浮动工具栏 / 表格工具栏(vanilla DOM 浮层)
  store/         zustand 全局状态
src-tauri/       Rust 后端:文件 IO / 原生菜单 / 设置持久化 / 诊断日志
.github/         GitHub Actions:推 v* tag 自动构建 Win / macOS / Linux
```

核心技术:**Milkdown 7.5.9**(基于 ProseMirror 的插件化 Markdown 编辑器框架)+
**mermaid 11**(图表)+ **KaTeX**(公式)+ **Tauri 2**(原生壳,安装包仅几 MB 级)。

## 🗺 路线图

已完成功能与验证状态见 [STATUS.md](./STATUS.md);
下一版本需求池(拖拽打开、图片缩放、多标签页、Pandoc 导出、TOC…)见 [ROADMAP.md](./ROADMAP.md)。

## 📄 文档

- [STATUS.md](./STATUS.md) — 功能清单与验证状态
- [ROADMAP.md](./ROADMAP.md) — 需求池与优先级
- [AI-HANDOFF.md](./AI-HANDOFF.md) — AI 协作开发交接文档

## 📜 License

MIT
