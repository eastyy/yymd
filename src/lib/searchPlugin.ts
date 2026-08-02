import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey, TextSelection } from "@milkdown/prose/state";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import type { EditorView } from "@milkdown/prose/view";
import type { Node as ProseNode } from "@milkdown/prose/model";

export interface SearchState {
  query: string;
  results: Array<{ from: number; to: number }>;
  active: number;
}

export const searchKey = new PluginKey<SearchState>("yymd-search");

function findMatches(doc: ProseNode, query: string): Array<{ from: number; to: number }> {
  const res: Array<{ from: number; to: number }> = [];
  if (!query) return res;
  const lower = query.toLowerCase();
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text.toLowerCase();
      let idx = text.indexOf(lower);
      while (idx !== -1) {
        res.push({ from: pos + idx, to: pos + idx + query.length });
        idx = text.indexOf(lower, idx + 1);
      }
    }
  });
  return res;
}

function makeDecorations(doc: ProseNode, state: SearchState): DecorationSet {
  if (state.results.length === 0) return DecorationSet.empty;
  const decos = state.results.map((r, i) =>
    Decoration.inline(r.from, r.to, {
      class: i === state.active ? "search-hit search-hit-active" : "search-hit",
    }),
  );
  return DecorationSet.create(doc, decos);
}

export const searchPlugin = $prose(
  () =>
    new Plugin<SearchState>({
      key: searchKey,
      state: {
        init: () => ({ query: "", results: [], active: -1 }),
        apply(tr, prev) {
          const meta = tr.getMeta(searchKey) as
            | { type: "set"; query: string }
            | { type: "next" }
            | { type: "prev" }
            | { type: "clear" }
            | undefined;

          let { query, results, active } = prev;

          if (meta?.type === "set") {
            query = meta.query;
            results = findMatches(tr.doc, query);
            active = results.length > 0 ? 0 : -1;
          } else if (meta?.type === "clear") {
            return { query: "", results: [], active: -1 };
          } else if (meta?.type === "next") {
            active = results.length > 0 ? (active + 1) % results.length : -1;
          } else if (meta?.type === "prev") {
            active = results.length > 0 ? (active - 1 + results.length) % results.length : -1;
          } else if (tr.docChanged && query) {
            results = findMatches(tr.doc, query);
            active = results.length > 0 ? Math.min(active, results.length - 1) : -1;
          }

          return { query, results, active };
        },
      },
      props: {
        decorations(state) {
          const s = searchKey.getState(state);
          if (!s) return DecorationSet.empty;
          return makeDecorations(state.doc, s);
        },
      },
    }),
);

export function getSearchState(view: EditorView): SearchState | undefined {
  return searchKey.getState(view.state);
}

export function setSearchQuery(view: EditorView, query: string) {
  view.dispatch(view.state.tr.setMeta(searchKey, { type: "set", query }));
  selectActive(view);
}

export function searchNext(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(searchKey, { type: "next" }));
  selectActive(view);
}

export function searchPrev(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(searchKey, { type: "prev" }));
  selectActive(view);
}

export function clearSearch(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(searchKey, { type: "clear" }));
}

function selectActive(view: EditorView) {
  const s = searchKey.getState(view.state);
  if (!s || s.active < 0 || !s.results[s.active]) return;
  const { from, to } = s.results[s.active];
  const sel = TextSelection.create(view.state.doc, from, to);
  view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
}
