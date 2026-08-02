export interface DocStats {
  words: number;
  chars: number;
  charsNoSpace: number;
  lines: number;
  /** 按每分钟 300 字估算的阅读时间(分钟) */
  readingMinutes: number;
}

/**
 * 统计字数。对中文按字符计数,对英文按单词计数,
 * 与 Typora 的"字数"口径接近(中文每字 + 英文每词)。
 */
export function countStats(md: string): DocStats {
  const text = md;
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  // 去掉 CJK 后统计英文单词
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, " ");
  const enWords = (nonCjk.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
  const words = cjk + enWords;
  const chars = [...text].length;
  const charsNoSpace = [...text.replace(/\s/g, "")].length;
  const lines = text === "" ? 0 : text.split("\n").length;
  return {
    words,
    chars,
    charsNoSpace,
    lines,
    readingMinutes: Math.max(1, Math.ceil(words / 300)),
  };
}
