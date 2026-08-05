/**
 * 纯函数路径/链接解析(跨平台:POSIX 与 Windows 分隔符均支持)。
 * 供 linkPlugin 使用,便于单元测试。
 */

export function isAbsolutePath(p: string): boolean {
  return p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);
}

/** 取文件所在目录(统一为 / 分隔) */
export function dirnameOf(p: string): string {
  const norm = p.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/");
  if (idx < 0) return "";
  if (idx === 0) return "/";
  // Windows 盘符根:C:/ → C:/
  if (/^[A-Za-z]:$/.test(norm.slice(0, idx))) return norm.slice(0, idx) + "/";
  return norm.slice(0, idx);
}

/** 目录 + 名字 → 完整路径(沿用目录原有分隔符风格) */
export function joinPath(dir: string, name: string): string {
  if (!dir) return name;
  if (dir.endsWith("/") || dir.endsWith("\\")) return dir + name;
  const sep = dir.includes("\\") && !dir.includes("/") ? "\\" : "/";
  return dir + sep + name;
}

/** 将 rel 相对 base 文件解析为绝对路径(处理 . / ..) */
export function resolvePath(baseFile: string, rel: string): string {
  const relNorm = rel.replace(/\\/g, "/");
  const joined = isAbsolutePath(relNorm)
    ? relNorm
    : dirnameOf(baseFile).replace(/\\/g, "/") + "/" + relNorm;

  const driveMatch = joined.match(/^([A-Za-z]:)/);
  const prefix = joined.startsWith("/") ? "/" : driveMatch ? driveMatch[1] + "/" : "";
  const body = driveMatch ? joined.slice(2).replace(/^\//, "") : joined;

  const out: string[] = [];
  for (const seg of body.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (out.length > 0) out.pop();
      continue;
    }
    out.push(seg);
  }
  let result = prefix + out.join("/");
  if (prefix === "/" && !result.startsWith("/")) result = "/" + result;
  return result || (prefix === "/" ? "/" : ".");
}

export type LinkTarget =
  | { kind: "anchor"; anchor: string }
  | { kind: "file"; path: string; anchor?: string }
  | { kind: "external"; url: string };

const MARKDOWN_RE = /\.(md|markdown|mdown|txt)$/i;
const EXTERNAL_RE = /^[a-z][a-z0-9+.-]*:(?!\/\/$)/i;

function splitAnchor(href: string): [string, string | undefined] {
  const i = href.indexOf("#");
  if (i < 0) return [href, undefined];
  const anchor = href.slice(i + 1);
  return [href.slice(0, i), anchor.length ? anchor : undefined];
}

/**
 * 解析链接目标:
 * - `http(s)://…`、`mailto:…` 等带协议链接 → external
 * - `#heading` → anchor
 * - `a.md` / `../b.md` / `C:\x\c.md` / `/abs/d.md`(可带 `#anchor`)→ file
 * - 其他本地文件 → file(由调用方决定用系统应用打开)
 * - `file://` URL → 取 pathname 作为绝对路径
 */
export function resolveLink(href: string, currentFile: string | null): LinkTarget {
  const h = href.trim();
  if (!h) return { kind: "anchor", anchor: "" };

  if (/^file:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      const p = decodeURIComponent(u.pathname);
      return { kind: "file", path: p };
    } catch {
      return { kind: "external", url: h };
    }
  }

  if (EXTERNAL_RE.test(h) && !/^[a-z]:[\\/]/i.test(h)) {
    return { kind: "external", url: h };
  }

  if (h.startsWith("#")) {
    return { kind: "anchor", anchor: decodeURIComponent(h.slice(1)) };
  }

  const [pathPart, anchor] = splitAnchor(h);
  let path = decodeURIComponent(pathPart).replace(/\\/g, "/");
  if (!isAbsolutePath(path) && currentFile) {
    path = resolvePath(currentFile, path);
  }
  const target: LinkTarget = {
    kind: "file",
    path,
    ...(anchor !== undefined ? { anchor: decodeURIComponent(anchor) } : {}),
  };
  return target;
}

/** 判断文件是否为可打开的 markdown 文档 */
export function isMarkdownFile(path: string): boolean {
  return MARKDOWN_RE.test(path);
}
