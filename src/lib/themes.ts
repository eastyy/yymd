export interface ThemeMeta {
  id: string;
  name: string;
}

/**
 * 全部可用主题。id 与 body[data-theme="<id>"] 的取值一一对应。
 * 纯数据模块,不引入任何 CSS。
 */
export const THEMES: ThemeMeta[] = [
  { id: "system", name: "跟随系统" },
  { id: "github", name: "浅色" },
  { id: "github-dark", name: "深色" },
  { id: "one-dark", name: "One Dark" },
  { id: "newsprint", name: "护眼纸质" },
  { id: "night", name: "夜间" },
  { id: "pixyll", name: "悦读" },
];
