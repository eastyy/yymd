import { invoke } from "@tauri-apps/api/core";
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
