/**
 * 主题解析纯逻辑:system 主题跟随系统深浅色。
 * - 浅色 → github,深色 → github-dark
 */

export const SYSTEM_LIGHT = "github";
export const SYSTEM_DARK = "github-dark";

/** 深色主题集合(决定 mermaid 等组件的暗色渲染) */
export const DARK_THEMES = new Set(["github-dark", "night", "one-dark"]);

export function isDarkThemeId(id: string): boolean {
  return DARK_THEMES.has(id);
}

/**
 * 把用户选择的主题解析为实际应用的主题。
 * theme === "system" 时按操作系统深浅色选择;其余原样返回。
 */
export function effectiveTheme(theme: string, osDark: boolean): string {
  if (theme !== "system") return theme;
  return osDark ? SYSTEM_DARK : SYSTEM_LIGHT;
}
