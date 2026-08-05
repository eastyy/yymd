/**
 * 全局搜索核心逻辑(纯函数,可单测):
 * 在多个文件内容中查找匹配行,返回带上下文的命中列表。
 */

export interface SearchHit {
  file: string; // 文件路径
  line: number; // 1 起
  text: string; // 命中行原文(去首尾空白)
}

export interface FileResult {
  file: string;
  hits: SearchHit[];
}

/** 在单个文件内容中查找包含 query 的行(大小写不敏感) */
export function searchLines(file: string, content: string, query: string, maxPerFile = 50): SearchHit[] {
  const q = query.toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length && hits.length < maxPerFile; i++) {
    if (lines[i].toLowerCase().includes(q)) {
      hits.push({ file, line: i + 1, text: lines[i].trim().slice(0, 200) });
    }
  }
  return hits;
}

/** 汇总多个文件的结果,按文件分组 */
export function groupResults(hits: SearchHit[]): FileResult[] {
  const map = new Map<string, SearchHit[]>();
  for (const h of hits) {
    const arr = map.get(h.file);
    if (arr) arr.push(h);
    else map.set(h.file, [h]);
  }
  return [...map.entries()].map(([file, hs]) => ({ file, hits: hs }));
}
