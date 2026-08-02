import { describe, it, expect } from "vitest";
import { countStats } from "../stats";

describe("countStats", () => {
  it("统计中文字符", () => {
    const s = countStats("你好世界");
    expect(s.words).toBe(4);
    expect(s.chars).toBe(4);
  });

  it("统计英文单词", () => {
    const s = countStats("hello world foo");
    expect(s.words).toBe(3);
  });

  it("混合中英文", () => {
    const s = countStats("这是 test 文本");
    // 这是(2) + test(1) + 文本(2)
    expect(s.words).toBe(5);
  });

  it("空字符串", () => {
    const s = countStats("");
    expect(s.words).toBe(0);
    expect(s.chars).toBe(0);
    expect(s.lines).toBe(0);
  });

  it("行数统计", () => {
    const s = countStats("a\nb\nc");
    expect(s.lines).toBe(3);
  });

  it("去除空白后的字符数", () => {
    const s = countStats("a b  c");
    expect(s.charsNoSpace).toBe(3);
  });
});
