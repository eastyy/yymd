/**
 * 链接导航插件(Typora 式交互):
 * - 点击文档内链接:
 *   - 本地 .md/.markdown/.txt → 直接打开(相对路径按当前文档目录解析,支持 `#锚点` 滚动)
 *   - 其他本地文件 → 系统默认应用打开
 *   - http(s)/mailto 等外部链接 → 系统浏览器打开
 *   - `#标题` → 滚动到对应标题
 */
import { $prose } from "@milkdown/utils";
import { Plugin } from "@milkdown/prose/state";
import type { MilkdownPlugin } from "@milkdown/ctx";
import { resolveLink, isMarkdownFile } from "./paths";
import { useAppStore } from "../store/useAppStore";
import { openFile, scrollToHeading } from "./fileActions";
import { isTauri, openExternal } from "./bridge";
import { dlog } from "./debugLog";

export async function navigateToLink(href: string): Promise<void> {
  const current = useAppStore.getState().filePath;
  const target = resolveLink(href, current);
  dlog(`link navigate: ${JSON.stringify(target)}`);

  if (target.kind === "anchor") {
    await scrollToHeading(target.anchor);
    return;
  }

  if (target.kind === "external") {
    if (isTauri) {
      await openExternal(target.url).catch(() => {});
    } else {
      window.open(target.url, "_blank");
    }
    return;
  }

  // 本地文件
  if (!isMarkdownFile(target.path)) {
    if (isTauri) await openExternal(target.path).catch(() => {});
    return;
  }

  await openFile(target.path);
  if (target.anchor) {
    // 等编辑器内容替换完成后再滚动
    setTimeout(() => void scrollToHeading(target.anchor!), 150);
  }
}

export const linkPlugin = $prose(
  () =>
    new Plugin({
      props: {
        handleClick(_view, _pos, event) {
          const el = event.target as HTMLElement | null;
          const anchor = el?.closest?.("a[href]");
          if (!anchor) return false;
          const href = anchor.getAttribute("href");
          if (!href) return false;
          event.preventDefault();
          void navigateToLink(href);
          return true;
        },
      },
    }),
) as unknown as MilkdownPlugin[];
