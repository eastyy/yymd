import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import { useAppStore } from "../store/useAppStore";

/** 打字机模式:光标始终保持在视窗垂直中央 */
export const typewriterPlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("yymd-typewriter"),
      view() {
        return {
          update(view, prevState) {
            if (!useAppStore.getState().typewriterMode) return;
            if (view.state.selection.head === prevState.selection.head) return;
            try {
              const coords = view.coordsAtPos(view.state.selection.head);
              const scroller = view.dom.closest(".editor-scroll") as HTMLElement | null;
              if (!scroller) return;
              const rect = scroller.getBoundingClientRect();
              const target = coords.top - rect.top + scroller.scrollTop - rect.height / 2;
              scroller.scrollTo({ top: Math.max(0, target) });
            } catch {
              /* ignore */
            }
          },
        };
      },
    }),
);

/** 专注模式:高亮当前所在顶层块,其余变暗(CSS 配合 .focus-block) */
export const focusModePlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("yymd-focus"),
      props: {
        decorations(state) {
          if (!useAppStore.getState().focusMode) return DecorationSet.empty;
          const $pos = state.selection.$from;
          if ($pos.depth < 1) return DecorationSet.empty;
          const node = $pos.node(1);
          const start = $pos.before(1);
          const deco = Decoration.node(start, start + node.nodeSize, {
            class: "focus-block",
          });
          return DecorationSet.create(state.doc, [deco]);
        },
      },
    }),
);
