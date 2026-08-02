export interface OutlineItem {
  level: number;
  text: string;
  line: number;
}

/**
 * 从 Markdown 文本中提取标题大纲。
 * 支持 ATX 标题(#~######)与 Setext 标题(=== / ---),会跳过代码块与行内代码。
 */
export function extractOutline(md: string): OutlineItem[] {
  const lines = md.split("\n");
  const items: OutlineItem[] = [];
  let inFence = false;
  let fenceMarker = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // 围栏代码块切换
    const fenceMatch = trimmed.match(/^(```+|~~~+)/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    // ATX 标题
    const atx = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (atx) {
      items.push({ level: atx[1].length, text: stripInline(atx[2]), line: i });
      continue;
    }

    // Setext 标题(下一行是 === 或 ---)
    const next = lines[i + 1];
    if (
      line.trim() !== "" &&
      next &&
      /^(=+|-+)\s*$/.test(next) &&
      !/^\s*[-*+]\s/.test(line) &&
      !/^>/.test(line.trimStart())
    ) {
      const level = next.trimStart().startsWith("=") ? 1 : 2;
      items.push({ level, text: stripInline(line.trim()), line: i });
    }
  }
  return items;
}

/** 去除行内 markdown 标记,得到纯文本 */
export function stripInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}
