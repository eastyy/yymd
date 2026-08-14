# 🤖 AI Agent 交接文档 — Yymd

> 给接手本项目的 AI Agent。人类可读的介绍见 `README.md`,功能进度见 `STATUS.md`,
> 下版本需求池见 `ROADMAP.md`。**先读完本文档再动手。**

## 1. 项目是什么

**Yymd** 是一个对标 [Typora](https://typora.io) 的所见即所得 Markdown 桌面编辑器。
技术栈:**Tauri 2(Rust)+ React 18 + Vite 5 + TypeScript + Milkdown 7.5.9(ProseMirror)+ zustand**。
主平台 Windows,开发机是 macOS,通过 GitHub Actions 出多平台包。

当前状态:**v0.2.x 已发布**(GitHub Release 含 Windows / macOS / Linux 安装包,CI 自动产出),
78/78 单元测试绿,`tsc --noEmit` 零错误。

## 2. 硬性约束(用户反复强调)

1. **所有工作必须在 `/Users/yy/yymd` 内完成**。不要动外部目录。
2. **不要向用户要任何东西**——用户可能不在,全自主开发,遇到问题自己决策并记录。
3. 用 `npm`,**不要全局安装任何东西**,不要换包管理器。
4. 用户是中文使用者,文档和 commit message 用中文没问题。
5. 每完成一个功能:`tsc + vitest + cargo check + tauri build --debug` 全过 → 提交 → 更新 STATUS.md。

## 3. 环境与验证命令

```bash
cd /Users/yy/yymd
npm install                          # 依赖(已装好,一般不用)
npx tsc --noEmit                     # TS 类型检查,必须零错误
npx vitest run                       # 单元测试(78 个,jsdom 环境)
cd src-tauri && cargo check          # Rust 检查
cd /Users/yy/yymd
npm run tauri build -- --debug       # 完整桌面包构建(约 2–3 分钟增量)
```

**运行时冒烟测试**:debug 包内置诊断通道——前端 `debug_log()` → Rust → `/tmp/yymd-webview.log`
(仅 debug 构建,`cfg!(debug_assertions)` 门控)。启动应用后 `tail -f /tmp/yymd-webview.log` 观察。
应用标识符 `com.yymd.app`。

## 4. 架构地图

```
src/
  App.tsx                  全局快捷键、设置持久化、菜单事件监听、模态框渲染
  components/
    EditorPane.tsx         ★ Milkdown 编辑器装配(插件链在这里,顺序有意义)
    SourceEditor.tsx       源码模式 textarea
    Sidebar/FileTree/Outline/StatusBar/SearchBar/QuickOpen/GlobalSearch
  lib/
    bridge.ts              Tauri invoke 封装(isTauri 判断,浏览器下可跑测试)
    fileActions.ts         打开/保存/滚动定位(scrollToLine/scrollViewToPos/scrollToHeading)
    editorRef.ts           全局持有当前 Editor 实例(getCurrentEditor)
    diagramPlugin.ts       ★ 自定义 Mermaid 节点(schema+remark+输入规则+nodeView)
    frontmatterPlugin.ts   ★ YAML frontmatter(schema+$remark+stringify)
    linkPlugin.ts          链接点击导航(md 跳转/锚点/外部浏览器)
    autoPairPlugin.ts      选区自动包裹
    emojiPlugin.ts         :smile: → 😄 输入规则
    imagePlugin.ts         图片粘贴/拖拽 → yymd-assets/
    searchPlugin.ts        文档内查找高亮
    editModePlugins.ts     打字机/专注模式
    export.ts / themes.ts / outline.ts / stats.ts / paths.ts / globalSearch.ts
  plugins/                 ★ vanilla DOM 浮层插件(不走 React portal)
    slash-menu/ floating-toolbar/ table-toolbar/
  store/useAppStore.ts     zustand 状态(filePath/markdown/theme/fontSize/各模态框开关…)
  styles/                  editor.css(排版) + main.css(布局) + themes.css + themes/
src-tauri/
  src/lib.rs               17 个命令:文件读写、目录、设置、菜单、debug_log、open_external…
  capabilities/default.json  权限声明(加新命令/插件记得看这里)
.github/workflows/build.yml  推 v* tag 触发 Win/macOS/Linux 构建
```

**EditorPane 插件链顺序**(commonmark 之前):autoPairPlugin → emojiPlugin → commonmark →
gfm → frontmatterPlugin → history → clipboard → math → diagramPlugin → prism →
imagePlugin → searchPlugin → typewriter → focusMode → slashMenu → floatingToolbar →
tableToolbar → linkPlugin → listener。

## 5. 踩坑记录(血泪教训,务必读完)

1. **Milkdown 锁死 7.5.9**。最新版砍掉了 plugin-math / plugin-diagram,升级即崩。
   所有 @milkdown/* 包精确锁 7.5.9,不要动。
2. **7.5.9 没有 `$prepare`**。初始化 ctx 要用裸 `MilkdownPlugin`:`(ctx) => { ...; return () => {}; }`
   ——必须返回一个函数,返回 void 会 TS2322。
3. **`$remark(name, factory, options)` 第三参是默认 options**。remark-frontmatter 必须传
   `["yaml"]`,传默认 `{}` 静默失效。
4. **自定义节点序列化**:读 `remarkStringifyOptionsCtx` 合并 handlers(参考
   frontmatterPlugin 的 `frontmatterStringify`)。用户插件在内部 editor 插件读取之前执行,
   同步 `ctx.update()` 即可。注意空 frontmatter 序列化成 `"---\n---"` 而不是 `"-----"`
   (五个连字符会被解析成 thematicBreak)。
5. **diagram 节点 schema 必须 `whitespace: "pre"` + `code: true`**,否则换行丢失;
   nodeView 必须 `ignoreMutation` 拦 SVG innerHTML 变化,否则无限重建循环。
6. **GFM 表格 schema(milkdown)**:节点名是 `table_cell`/`table_header`/`table_row`/
   `table_header_row`(首行强制 header row),没有 `tableRole`。prosemirror-tables 的
   `toggleHeaderRow` 与之根本不兼容,别试。行列增删命令(addRowAfter 等)从
   `@milkdown/prose/tables` 导入可用。
7. **Tauri 事件名不能有点**。菜单事件用 `menu://file_save_as` 下划线格式。
8. **vanilla DOM 插件**(slash-menu/floating-toolbar/table-toolbar)是刻意选择,
   避免 React portal 与 Milkdown 生命周期冲突,新功能建议沿用该模式。
9. **commonmark 强调输入规则**会吃掉 `_..._`(测试里打字模拟时注意,
   参考 `__tests__/emoji.test.ts` 用无下划线代码)。
10. **模拟 ProseMirror 打字**:`view.someProp("handleTextInput", f => f(view, from, from, ch, () => view.state.tr))`,
    返回 false 时手动 `insertText`。
11. **测试环境**:需要 DOM 的用 `// @vitest-environment jsdom` 头;mermaid.parse 在 jsdom 可用。
12. **`$inputRule`** 返回真正的 `new InputRule(regex, handler)`(从 `@milkdown/prose/inputrules`),
    handler 返回 `null` 表示不处理。
13. **`dragDropEnabled: true`(tauri.conf.json)**:启用后 OS 文件拖放被 Tauri 原生拦截,
    DOM `drop` 事件不再触发。文件拖放统一走 `win.onDragDropEvent`(App.tsx),
    图片插入走 `insertImageFromPath`。不要再依赖 DOM drop 处理文件。
14. **文件关联**:声明在 `tauri.conf.json` 的 `bundle.fileAssociations`(写入 Info.plist),
    运行时接收:macOS `RunEvent::Opened` / Windows·Linux 命令行参数 / single-instance 转发。
    前端统一入口:事件 `yymd://open-file` + 启动时轮询 `take_pending_open_path`。
    只在打包应用中生效,`tauri dev` 测不了,验证用 `tauri build -- --debug` 装 dmg。
15. **atom 节点输入规则**不能 `setBlockType`(要求 textblock),用 `replaceRangeWith` 整段替换
    (参考 `tocPlugin.ts`)。
16. **Windows MSI 打包**:`tauri.conf.json` 里所有进 WiX 的字段(如 fileAssociations 的
    description)不能用中文等非 ASCII 字符,否则 `light.exe` 直接失败。NSIS 不受影响。

## 6. 工作流纪律

1. 小步提交:一个功能一个 commit,message 写清内容;docs 单独提交。
2. 每个纯逻辑(解析/映射/搜索)都放 `src/lib/` 并配 `__tests__` 单测;
   交互逻辑用 Editor.make() + 打字模拟做集成测试。
3. 改完必跑:§3 的四项验证全过才算完成;有一项红就不要提交。
4. 每完成一个功能更新 `STATUS.md` 对应小节和测试数。
5. 构建前先 `pkill -f "Yymd"` 杀掉旧实例,否则产物被占用。
6. 不确定的库 API,先读 `node_modules/@milkdown/*/lib/index.es.js` 源码再写。

## 7. 下一步(见 ROADMAP.md)

按建议顺序:
1. **P0-1 拖拽打开**(Tauri `onDragDropEvent`,拖 .md 打开、拖文件夹设工作区)——最小成本,优先
2. P0-5 TOC 目录、P1-8 字数目标(小而完整)
3. P0-2 图片缩放(schema 加 width)、P0-3 多标签页(大件,谨慎重构)
4. 推 tag `v0.1.x` 触发 Actions 出 Windows 包(P2-13),随 v0.2.0 走 Release 构建(P2-14)

## 8. 快速自检清单(接手后跑一遍)

```bash
cd /Users/yy/yymd
git status --short          # 应为空
git log --oneline -5
npx tsc --noEmit            # 零错误
npx vitest run              # 60 passed
cd src-tauri && cargo check # OK
```

全部通过后就可以开工。祝顺利 🚀
