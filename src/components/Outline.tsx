import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { extractOutline } from "../lib/outline";
import { scrollToLine } from "../lib/fileActions";

export default function Outline() {
  const markdown = useAppStore((s) => s.markdown);
  const items = useMemo(() => extractOutline(markdown), [markdown]);

  if (items.length === 0) {
    return <div className="outline-empty">暂无标题(使用 # 创建)</div>;
  }

  const minLevel = Math.min(...items.map((i) => i.level));

  return (
    <ul className="outline">
      {items.map((item, idx) => (
        <li
          key={`${item.line}-${idx}`}
          className={`outline-item lv-${item.level}`}
          style={{ paddingLeft: 10 + (item.level - minLevel) * 14 }}
          onClick={() => scrollToLine(item.line)}
          title={item.text}
        >
          {item.text || "(空标题)"}
        </li>
      ))}
    </ul>
  );
}
