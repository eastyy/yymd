import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open, save, type OpenDialogOptions } from "@tauri-apps/plugin-dialog";

/** 是否运行在 Tauri 环境中(纯浏览器 dev 时为 false) */
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_text_file", { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  await invoke("write_text_file", { path, content });
}

export interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

export async function listDir(path: string): Promise<DirEntry[]> {
  return invoke<DirEntry[]>("list_dir", { path });
}

/** 递归列出目录下所有 markdown 文件(上限 limit 条) */
export async function listFilesRecursive(dir: string, limit = 500): Promise<DirEntry[]> {
  return invoke<DirEntry[]>("list_files_recursive", { dir, limit });
}

export async function loadSettings<T>(): Promise<T> {
  const raw = await invoke<string>("load_settings");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

export async function saveSettings(obj: unknown): Promise<void> {
  await invoke("save_settings", { json: JSON.stringify(obj) });
}

export async function showInFolder(path: string): Promise<void> {
  await invoke("show_in_folder", { path });
}

/** 用系统默认应用打开文件 / URL */
export async function openExternal(target: string): Promise<void> {
  await invoke("open_external", { target });
}

/** 文件树操作 */
export async function createFile(path: string, content = ""): Promise<void> {
  await invoke("create_file", { path, content });
}

export async function createDir(path: string): Promise<void> {
  await invoke("create_dir", { path });
}

export async function renamePath(from: string, to: string): Promise<void> {
  await invoke("rename_path", { from, to });
}

export async function removePath(path: string): Promise<void> {
  await invoke("remove_path", { path });
}

/** 把 base64 图片写入指定目录,返回最终绝对路径 */
export async function saveAsset(
  dir: string,
  filename: string,
  base64Data: string,
): Promise<string> {
  return invoke<string>("save_asset", { dir, filename, base64Data });
}

/** 把本地文件路径转成 webview 可加载的 asset URL */
export function toAssetUrl(absPath: string): string {
  return convertFileSrc(absPath);
}

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "mdown", "txt"] },
];

export async function pickOpenFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: MD_FILTERS,
  } satisfies OpenDialogOptions);
  return (selected as string | null) ?? null;
}

export async function pickSaveFile(defaultName = "未命名.md"): Promise<string | null> {
  const selected = await save({
    defaultPath: defaultName,
    filters: MD_FILTERS,
  });
  return selected ?? null;
}

export async function pickDirectory(): Promise<string | null> {
  const selected = await open({ multiple: false, directory: true });
  return (selected as string | null) ?? null;
}
