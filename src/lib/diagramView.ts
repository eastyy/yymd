/**
 * Mermaid 图表渲染 nodeView。
 * @milkdown/plugin-diagram 只定义 diagram 节点(源码文本),本插件为其提供真实渲染:
 * 使用最新版 mermaid(v11)把源码渲染为 SVG,支持全部最新图类型
 * (flowchart/sequence/class/state/ER/gantt/pie/journey/gitGraph/mindmap/
 *  timeline/quadrantChart/requirement/C4/sankey/xychart/block/packet/
 *  architecture/kanban/radar/treeview/zenuml 等)。
 */
import { $view } from "@milkdown/utils";
import { diagramSchema } from "@milkdown/plugin-diagram";
import mermaid from "mermaid";
import { useAppStore } from "../store/useAppStore";

let renderSeq = 0;

function isDarkTheme(): boolean {
  const t = useAppStore.getState().theme;
  return t === "github-dark" || t === "night";
}

export const diagramView = $view(diagramSchema.node, () => {
  return () => {
    const container = document.createElement("div");
    container.className = "diagram";
    const svgBox = document.createElement("div");
    svgBox.className = "diagram-svg";
    container.appendChild(svgBox);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastCode: string | null = null;

    async function render(code: string) {
      const id = `yymd-mermaid-${++renderSeq}`;
      try {
        if (!code.trim()) {
          svgBox.innerHTML = "";
          svgBox.classList.remove("diagram-error");
          return;
        }
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDarkTheme() ? "dark" : "default",
        });
        const { svg } = await mermaid.render(id, code);
        svgBox.innerHTML = svg;
        svgBox.classList.remove("diagram-error");
        svgBox.removeAttribute("title");
      } catch (e) {
        // 语法错误时回退显示源码,不阻断编辑
        mermaid.parseError = undefined;
        const errEl = document.getElementById(id);
        if (errEl) errEl.remove();
        svgBox.textContent = code;
        svgBox.classList.add("diagram-error");
        svgBox.title = String(e instanceof Error ? e.message : e);
      }
    }

    function schedule(code: string) {
      lastCode = code;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (lastCode !== null) void render(lastCode);
      }, 250);
    }

    return {
      dom: container,
      update(node) {
        if (node.type.name !== "diagram") return false;
        const code = node.attrs.value ?? "";
        if (code !== lastCode) schedule(code);
        return true;
      },
      ignoreMutation() {
        return true;
      },
      destroy() {
        if (timer) clearTimeout(timer);
      },
    };
  };
});
