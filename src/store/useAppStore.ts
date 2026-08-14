import { create } from "zustand";

export type ViewMode = "wysiwyg" | "source";
export type SidebarTab = "files" | "outline";
export type ThemeName = "system" | "github" | "github-dark" | "one-dark" | "newsprint" | "night" | "pixyll";
/** 实际应用的主题(system 已解析后的结果) */
export type ResolvedTheme = Exclude<ThemeName, "system">;

interface AppState {
  filePath: string | null;
  dirty: boolean;
  markdown: string;
  wordCount: number;
  charCount: number;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  rootDir: string | null;
  theme: ThemeName;
  /** system 解析后的实际主题,供 mermaid 等组件判断深浅 */
  effectiveTheme: ResolvedTheme;
  focusMode: boolean;
  typewriterMode: boolean;
  searchOpen: boolean;
  quickOpenOpen: boolean;
  globalSearchOpen: boolean;
  recentFiles: string[];
  fontSize: number;
  wordTarget: number;

  setFilePath: (p: string | null) => void;
  setDirty: (d: boolean) => void;
  setMarkdown: (md: string) => void;
  setStats: (words: number, chars: number) => void;
  setViewMode: (m: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarTab: (t: SidebarTab) => void;
  setRootDir: (d: string | null) => void;
  setTheme: (t: ThemeName) => void;
  setEffectiveTheme: (t: ResolvedTheme) => void;
  toggleFocusMode: () => void;
  toggleTypewriter: () => void;
  setSearchOpen: (v: boolean) => void;
  setQuickOpenOpen: (v: boolean) => void;
  setGlobalSearchOpen: (v: boolean) => void;
  setRecentFiles: (files: string[]) => void;
  addRecent: (path: string) => void;
  setFontSize: (n: number) => void;
  setWordTarget: (n: number) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  filePath: null,
  dirty: false,
  markdown: "",
  wordCount: 0,
  charCount: 0,
  viewMode: "wysiwyg",
  sidebarOpen: true,
  sidebarTab: "outline",
  rootDir: null,
  theme: "github",
  effectiveTheme: "github",
  focusMode: false,
  typewriterMode: false,
  searchOpen: false,
  quickOpenOpen: false,
  globalSearchOpen: false,
  recentFiles: [],
  fontSize: 16,
  wordTarget: 0,

  setFilePath: (p) => set({ filePath: p }),
  setDirty: (d) => set({ dirty: d }),
  setMarkdown: (md) => set({ markdown: md }),
  setStats: (words, chars) => set({ wordCount: words, charCount: chars }),
  setViewMode: (m) => set({ viewMode: m }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: (t) => set({ sidebarTab: t, sidebarOpen: true }),
  setRootDir: (d) => set({ rootDir: d }),
  setTheme: (t) => set({ theme: t }),
  setEffectiveTheme: (t) => set({ effectiveTheme: t }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleTypewriter: () => set((s) => ({ typewriterMode: !s.typewriterMode })),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setQuickOpenOpen: (v) => set({ quickOpenOpen: v }),
  setGlobalSearchOpen: (v) => set({ globalSearchOpen: v }),
  setRecentFiles: (files) => set({ recentFiles: files }),
  addRecent: (path) =>
    set((s) => ({
      recentFiles: [path, ...s.recentFiles.filter((p) => p !== path)].slice(0, 10),
    })),
  setFontSize: (n) => set({ fontSize: Math.min(28, Math.max(12, Math.round(n))) }),
  setWordTarget: (n) => set({ wordTarget: Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)) }),
  reset: () => set({ filePath: null, dirty: false, markdown: "" }),
}));

export function displayName(filePath: string | null): string {
  if (!filePath) return "未命名";
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}
