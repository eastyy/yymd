# 主题系统集成指南(INTEGRATION-themes)

本分支新增了 3 个 Typora 风格主题的 CSS 与一个主题元数据模块。以下为父级集成所需的全部改动。**本分支未修改任何已存在文件**,以下改动需由父级应用。

## 新增文件

- `src/styles/themes/newsprint.css` — `body[data-theme="newsprint"]` 暖米黄纸质护眼主题(light)
- `src/styles/themes/night.css` — `body[data-theme="night"]` 柔和深灰夜间主题(dark)
- `src/styles/themes/pixyll.css` — `body[data-theme="pixyll"]` 白底红色点缀悦读主题(light)
- `src/lib/themes.ts` — `ThemeMeta` 接口 + `THEMES` 数组(5 项纯数据,不含 CSS)
- `src/lib/__tests__/themes.test.ts` — vitest 测试

每个 CSS 都定义了与 `src/styles/themes.css` 完全一致的 18 个变量,并以 `color-scheme` 收尾。

## 集成步骤

### 1. 引入 CSS(`src/main.tsx`)

在现有 `import "./styles/themes.css";` 之后追加(主题间顺序无关,均为 `body[data-theme]` 属性选择器):

```ts
import "./styles/themes.css";
import "./styles/themes/newsprint.css";
import "./styles/themes/night.css";
import "./styles/themes/pixyll.css";
```

### 2. 扩展 `ThemeName`(`src/store/useAppStore.ts`)

当前为:

```ts
export type ThemeName = "github" | "github-dark" | "night";
```

改为(`night` 已存在,补齐 `newsprint` 与 `pixyll`):

```ts
export type ThemeName = "github" | "github-dark" | "newsprint" | "night" | "pixyll";
```

### 3. 放宽持久化类型(`src/App.tsx`)

当前 `interface Settings { theme?: "github" | "github-dark"; }`,改为与 store 对齐,否则夜间/新主题的持久化会被类型收窄:

```ts
import type { ThemeName } from "./store/useAppStore";
interface Settings {
  theme?: ThemeName;
}
```

(推荐直接复用 `ThemeName`,避免两处维护。`App.tsx` 中 `document.body.dataset.theme = theme` 无需改动,任意主题 id 都会生效。)

### 4. 状态栏主题选择器(`src/components/StatusBar.tsx`)

当前是 github/github-dark 二态切换按钮(`changeTheme(t: "github" | "github-dark")`)。建议替换为基于 `THEMES` 的下拉框:

```tsx
import { THEMES } from "../lib/themes";
import type { ThemeName } from "../store/useAppStore";

// changeTheme 签名放宽
function changeTheme(t: ThemeName) {
  setTheme(t);
  saveSettings({ theme: t }).catch(() => {});
}

// 渲染(替换原 🌙/☀️ 切换按钮)
<select
  className="status-btn"
  value={theme}
  onChange={(e) => changeTheme(e.target.value as ThemeName)}
  title="主题"
>
  {THEMES.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name}
    </option>
  ))}
</select>
```

## 验证

```bash
npx tsc --noEmit
npx vitest run src/lib/__tests__/themes.test.ts
```

## 备注

- `pixyll` 的「大字号/衬线」排版特性依赖 `src/styles/editor.css` 的字体设置,不属于本主题配色变量范围;如需实现,请父级在 editor.css 中追加 `body[data-theme="pixyll"] .ProseMirror { font-size: ...; font-family: ...; }`。
- 各主题已做对比度核对:正文与背景均 ≥ 4.5:1;链接/强调色在浅色主题下 ≥ 4.5:1(night 主题的 accent 作深色底上的亮色文本,对比充足)。
