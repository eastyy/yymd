# Yymd

一个类似 [Typora](https://typora.io) 的所见即所得 Markdown 编辑器,基于 **Tauri 2 + React + Milkdown** 构建。

## ✨ 已实现功能

- ✅ 所见即所得编辑(源码与预览合一,无需分屏)
- ✅ CommonMark + GFM 全语法:标题、列表、任务列表、表格、脚注、删除线
- ✅ 数学公式(KaTeX,行内 + 块级)
- ✅ 代码块语法高亮(Prism)
- ✅ Mermaid 图表
- ✅ `/` 呼出插入菜单、选中文本浮动工具栏
- ✅ 源码模式切换(`Ctrl/Cmd + /`)
- ✅ 侧边栏:实时大纲导航 + 文件树
- ✅ 原生文件对话框打开 / 保存 / 另存为
- ✅ 中英文字数统计
- ✅ 浅色 / 深色主题(持久化)
- ✅ 专注模式
- ✅ 原生应用菜单 + 快捷键(`Ctrl+S` 保存等)

## 🚧 路线图

- [ ] 导出 PDF / HTML / Word(Pandoc)
- [ ] 图片粘贴 / 拖拽 + 图床上传(PicGo)
- [ ] 多标签页
- [ ] 自动更新
- [ ] Windows 文件关联、右键打开

## 🛠 开发

### 环境要求

- Node.js 22+
- Rust stable + [Tauri 依赖](https://v2.tauri.app/start/prerequisites/)
  - **Windows**:Visual Studio Build Tools 2022(C++ 桌面开发)+ WebView2
  - **macOS**:Xcode Command Line Tools

### 运行

```bash
npm install

# 生成应用图标(首次)
node scripts/gen-icon.mjs
npx tauri icon icons/icon-src.png

# 开发模式
npm run tauri dev

# 构建安装包
npm run tauri build
```

### 测试

```bash
npm test        # vitest 单元测试
npm run typecheck
```

### 构建 Windows 安装包

在 Windows 机器上运行 `npm run tauri build`,产物位于
`src-tauri/target/release/bundle/`(`.msi` / `.exe`)。
也可推送 `v*` tag 触发 GitHub Actions 自动构建(含 Windows / macOS / Linux)。

## 架构

```
src/               # React 前端
  components/      # 编辑器、侧边栏、状态栏
  lib/             # 文件操作、大纲解析、字数统计、Tauri 桥接
  store/           # zustand 全局状态
  styles/          # 主题 + 排版样式
src-tauri/         # Rust 后端(文件 IO、菜单、设置)
scripts/           # 图标生成等工具
```
