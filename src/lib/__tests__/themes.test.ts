import { describe, it, expect } from "vitest";
import { THEMES } from "../themes";

describe("THEMES", () => {
  it("恰好包含 7 个主题", () => {
    expect(THEMES).toHaveLength(7);
  });

  it("id 唯一", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("必含 system / github / github-dark / one-dark", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids).toContain("system");
    expect(ids).toContain("github");
    expect(ids).toContain("github-dark");
    expect(ids).toContain("one-dark");
  });

  it("所有字段非空", () => {
    for (const t of THEMES) {
      expect(t.id.trim().length).toBeGreaterThan(0);
      expect(t.name.trim().length).toBeGreaterThan(0);
    }
  });
});
