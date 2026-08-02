import { create } from "zustand";

export type ViewMode = "wysiwyg" | "source";
export type SidebarTab = "files" | "outline";
export type ThemeName = "github" | "github-dark" | "newsprint" | "night" | "pixyll";

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
  focusMode: boolean;
  typewriterMode: boolean;
  searchOpen: boolean;
  quickOpenOpen: boolean;
  recentFiles: string[];

  setFilePath: (p: string | null) => void;
  setDirty: (d: boolean) => void;
  setMarkdown: (md: string) => void;
  setStats: (words: number, chars: number) => void;
  setViewMode: (m: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarTab: (t: SidebarTab) => void;
  setRootDir: (d: string | null) => void;
  setTheme: (t: ThemeName) => void;
  toggleFocusMode: () => void;
  toggleTypewriter: () => void;
  setSearchOpen: (v: boolean) => void;
  setQuickOpenOpen: (v: boolean) => void;
  setRecentFiles: (files: string[]) => void;
  addRecent: (path: string) => void;
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
  focusMode: false,
  typewriterMode: false,
  searchOpen: false,
  quickOpenOpen: false,
  recentFiles: [],

  setFilePath: (p) => set({ filePath: p }),
  setDirty: (d) => set({ dirty: d }),
  setMarkdown: (md) => set({ markdown: md }),
  setStats: (words, chars) => set({ wordCount: words, charCount: chars }),
  setViewMode: (m) => set({ viewMode: m }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: (t) => set({ sidebarTab: t, sidebarOpen: true }),
  setRootDir: (d) => set({ rootDir: d }),
  setTheme: (t) => set({ theme: t }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleTypewriter: () => set((s) => ({ typewriterMode: !s.typewriterMode })),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setQuickOpenOpen: (v) => set({ quickOpenOpen: v }),
  setRecentFiles: (files) => set({ recentFiles: files }),
  addRecent: (path) =>
    set((s) => ({
      recentFiles: [path, ...s.recentFiles.filter((p) => p !== path)].slice(0, 10),
    })),
  reset: () => set({ filePath: null, dirty: false, markdown: "" }),
}));

export function displayName(filePath: string | null): string {
  if (!filePath) return "未命名";
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}
