/**
 * 拖拽文件分类(纯逻辑,可单测)。
 * 配合 Tauri onDragDropEvent 使用:拖 .md 打开、拖文件夹设为工作区、拖图片插入。
 */

export const MARKDOWN_EXTS = [".md", ".markdown", ".mdown"];
export const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".avif"];

/** 取路径的文件扩展名(小写,含点),无扩展名返回 "" */
export function extOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  const i = base.lastIndexOf(".");
  if (i <= 0) return "";
  return base.slice(i).toLowerCase();
}

export function isMarkdownPath(path: string): boolean {
  return MARKDOWN_EXTS.includes(extOf(path));
}

export function isImagePath(path: string): boolean {
  return IMAGE_EXTS.includes(extOf(path));
}

export interface DropPlan {
  /** 第一个 markdown 文件(用于打开) */
  markdown: string | null;
  /** 第一个文件夹(用于设为工作区) */
  directory: string | null;
  /** 全部图片文件(用于插入编辑器) */
  images: string[];
}

/**
 * 规划拖入文件的处理方式。
 * @param paths 拖入的绝对路径列表
 * @param dirSet 其中为目录的路径集合(由调用方异步探测后传入)
 */
export function planDroppedPaths(paths: string[], dirSet: ReadonlySet<string>): DropPlan {
  const plan: DropPlan = { markdown: null, directory: null, images: [] };
  for (const p of paths) {
    if (dirSet.has(p)) {
      if (!plan.directory) plan.directory = p;
      continue;
    }
    if (isMarkdownPath(p)) {
      if (!plan.markdown) plan.markdown = p;
    } else if (isImagePath(p)) {
      plan.images.push(p);
    }
  }
  return plan;
}
