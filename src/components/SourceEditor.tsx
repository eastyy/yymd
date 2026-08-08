import { useAppStore } from "../store/useAppStore";
import { syncStats } from "../lib/fileActions";

/** 源码模式:等宽字体编辑原始 Markdown */
export default function SourceEditor() {
  const markdown = useAppStore((s) => s.markdown);
  const setMarkdown = useAppStore((s) => s.setMarkdown);
  const setDirty = useAppStore((s) => s.setDirty);

  return (
    <div className="editor-scroll">
      <textarea
        className="source-editor"
        value={markdown}
        spellCheck={false}
        onChange={(e) => {
          setMarkdown(e.target.value);
          setDirty(true);
          syncStats(e.target.value);
        }}
      />
    </div>
  );
}
