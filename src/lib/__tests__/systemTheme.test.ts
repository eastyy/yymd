import { describe, expect, it } from "vitest";
import { effectiveTheme, isDarkThemeId, SYSTEM_DARK, SYSTEM_LIGHT } from "../systemTheme";

describe("effectiveTheme", () => {
  it("system 跟随系统深浅色", () => {
    expect(effectiveTheme("system", true)).toBe(SYSTEM_DARK);
    expect(effectiveTheme("system", false)).toBe(SYSTEM_LIGHT);
  });
  it("固定主题原样返回", () => {
    expect(effectiveTheme("github", true)).toBe("github");
    expect(effectiveTheme("night", false)).toBe("night");
    expect(effectiveTheme("one-dark", false)).toBe("one-dark");
  });
});

describe("isDarkThemeId", () => {
  it("识别全部深色主题", () => {
    expect(isDarkThemeId("github-dark")).toBe(true);
    expect(isDarkThemeId("night")).toBe(true);
    expect(isDarkThemeId("one-dark")).toBe(true);
  });
  it("浅色主题返回 false", () => {
    expect(isDarkThemeId("github")).toBe(false);
    expect(isDarkThemeId("newsprint")).toBe(false);
    expect(isDarkThemeId("pixyll")).toBe(false);
    expect(isDarkThemeId("system")).toBe(false);
  });
});
