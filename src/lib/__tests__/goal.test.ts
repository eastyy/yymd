import { describe, expect, it } from "vitest";
import { goalPercent, normalizeGoal } from "../goal";

describe("goalPercent", () => {
  it("正常计算并取整", () => {
    expect(goalPercent(500, 2000)).toBe(25);
    expect(goalPercent(333, 1000)).toBe(33);
  });
  it("封顶 100", () => {
    expect(goalPercent(3000, 2000)).toBe(100);
  });
  it("目标无效返回 null", () => {
    expect(goalPercent(100, 0)).toBeNull();
    expect(goalPercent(100, -5)).toBeNull();
    expect(goalPercent(100, NaN)).toBeNull();
  });
  it("words 异常按 0 计", () => {
    expect(goalPercent(-10, 100)).toBe(0);
    expect(goalPercent(NaN, 100)).toBe(0);
  });
});

describe("normalizeGoal", () => {
  it("解析合法输入", () => {
    expect(normalizeGoal("2000")).toBe(2000);
    expect(normalizeGoal("  500 ")).toBe(500);
    expect(normalizeGoal(1500)).toBe(1500);
    expect(normalizeGoal(99.9)).toBe(99);
  });
  it("非法输入归零(取消目标)", () => {
    expect(normalizeGoal("")).toBe(0);
    expect(normalizeGoal("abc")).toBe(0);
    expect(normalizeGoal(-3)).toBe(0);
    expect(normalizeGoal(0)).toBe(0);
  });
});
