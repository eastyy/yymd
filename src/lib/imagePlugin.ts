import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { useAppStore } from "../store/useAppStore";
import { isTauri, saveAsset, toAssetUrl } from "./bridge";

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
