import { useEffect } from "react";
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { nord } from "@milkdown/theme-nord";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { clipboard } from "@milkdown/plugin-clipboard";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { math } from "@milkdown/plugin-math";
import { prism } from "@milkdown/plugin-prism";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { imagePlugin } from "../lib/imagePlugin";
import { searchPlugin } from "../lib/searchPlugin";
import { typewriterPlugin, focusModePlugin } from "../lib/editModePlugins";
import { diagramPlugin } from "../lib/diagramPlugin";
import { slashMenuPlugin } from "../plugins/slash-menu";
import { floatingToolbarPlugin } from "../plugins/floating-toolbar";
import { useAppStore } from "../store/useAppStore";
import { setCurrentEditor } from "../lib/editorRef";
import { syncStats, scheduleAutoSave } from "../lib/fileActions";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function MilkdownInner() {
  const { get, loading } = useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, useAppStore.getState().markdown);
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(math)
      .use(diagramPlugin)
      .use(prism)
      .use(imagePlugin)
      .use(searchPlugin)
      .use(typewriterPlugin)
      .use(focusModePlugin)
      .use(slashMenuPlugin)
      .use(floatingToolbarPlugin)
      .use(listener)
      .config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated((_ctx, md) => {
          const s = useAppStore.getState();
          s.setMarkdown(md);
          s.setDirty(true);
          scheduleAutoSave();
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => syncStats(md), 300);
        });
      }),
  );

  useEffect(() => {
    if (!loading) {
      const editor = get() ?? null;
      setCurrentEditor(editor);
      return () => setCurrentEditor(null);
    }
  }, [loading, get]);

  return <Milkdown />;
}

export default function EditorPane() {
  return (
    <div className="editor-scroll">
      <div className="editor-container">
        <MilkdownProvider>
          <MilkdownInner />
        </MilkdownProvider>
      </div>
    </div>
  );
}
