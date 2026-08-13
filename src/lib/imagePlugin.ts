import { $prose } from "@milkdown/utils";
import { editorViewCtx } from "@milkdown/core";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { useAppStore } from "../store/useAppStore";
import { isTauri, saveAsset, toAssetUrl, readFileBase64 } from "./bridge";
import { getCurrentEditor } from "./editorRef";

const key = new PluginKey("yymd-image");

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 粘贴/拖拽图片:已保存文档→存到同级 yymd-assets 目录;未保存→内嵌 base64 */
async function insertImage(view: EditorView, file: File) {
  const dataUrl = await fileToBase64(file);
  let src = dataUrl;
  const filePath = useAppStore.getState().filePath;
  if (isTauri && filePath) {
    try {
      const docDir = filePath.replace(/[\\/][^\\/]+$/, "");
      const rawExt = file.name.includes(".") ? file.name.split(".").pop()! : "png";
      const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "") || "png";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const base64 = dataUrl.split(",")[1] ?? "";
      const absPath = await saveAsset(`${docDir}${sep(filePath)}yymd-assets`, name, base64);
      src = toAssetUrl(absPath);
    } catch (e) {
      console.error("图片保存失败,回退 base64 内嵌:", e);
    }
  }
  const imageType = view.state.schema.nodes.image;
  if (!imageType) return;
  const alt = file.name.replace(/\.[^.]+$/, "");
  const node = imageType.create({ src, alt });
  view.dispatch(view.state.tr.replaceSelectionWith(node));
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

/** 在指定位置(或光标处)插入 image 节点 */
export function insertImageNodeAt(view: EditorView, src: string, alt: string, pos?: number): boolean {
  const imageType = view.state.schema.nodes.image;
  if (!imageType) return false;
  const node = imageType.create({ src, alt });
  const at = pos != null ? Math.max(0, Math.min(pos, view.state.doc.content.size)) : null;
  const tr = at != null ? view.state.tr.insert(at, node) : view.state.tr.replaceSelectionWith(node);
  view.dispatch(tr);
  return true;
}

/** 把窗口物理坐标换算为编辑器文档位置(拖拽落点插入) */
export function editorPosAtWindowPoint(x: number, y: number, scaleFactor: number): number | undefined {
  const ed = getCurrentEditor();
  if (!ed) return undefined;
  try {
    const view = ed.ctx.get(editorViewCtx);
    const dom = view.dom as HTMLElement;
    const rect = dom.getBoundingClientRect();
    const found = view.posAtCoords({
      left: rect.left + x / scaleFactor,
      top: rect.top + y / scaleFactor,
    });
    return found?.pos;
  } catch {
    return undefined;
  }
}

/** 从操作系统文件路径插入图片(Tauri 原生拖拽)。已保存文档存到 yymd-assets,否则内嵌 base64 */
export async function insertImageFromPath(absPath: string, pos?: number): Promise<void> {
  const base64 = await readFileBase64(absPath);
  const rawExt = absPath.includes(".") ? absPath.split(".").pop()! : "png";
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  const mime = MIME[ext] ?? `image/${ext}`;
  let src = `data:${mime};base64,${base64}`;
  const filePath = useAppStore.getState().filePath;
  if (isTauri && filePath) {
    try {
      const docDir = filePath.replace(/[\\/][^\\/]+$/, "");
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const abs = await saveAsset(`${docDir}${sep(filePath)}yymd-assets`, name, base64);
      src = toAssetUrl(abs);
    } catch (e) {
      console.error("拖拽图片保存失败,回退 base64 内嵌:", e);
    }
  }
  const ed = getCurrentEditor();
  if (!ed) return;
  try {
    const view = ed.ctx.get(editorViewCtx);
    const alt = absPath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "image";
    insertImageNodeAt(view, src, alt, pos);
  } catch (e) {
    console.error("插入图片失败:", e);
  }
}

/** 依据文档路径推断目录分隔符(跨平台) */
function sep(filePath: string): string {
  return filePath.includes("\\") ? "\\" : "/";
}

export const imagePlugin = $prose(
  () =>
    new Plugin({
      key,
      props: {
        handlePaste(view, event) {
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                void insertImage(view, file);
                return true;
              }
            }
          }
          return false;
        },
        handleDrop(view, event) {
          const files = event.dataTransfer?.files;
          if (!files || files.length === 0) return false;
          const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
          if (images.length === 0) return false;
          event.preventDefault();
          images.forEach((f) => void insertImage(view, f));
          return true;
        },
      },
    }),
);
