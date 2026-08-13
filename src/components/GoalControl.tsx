import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { goalPercent, normalizeGoal } from "../lib/goal";

/** 状态栏字数目标控件:未设目标显示 🎯;已设显示进度条,点击可修改/清除 */
export default function GoalControl() {
  const wordCount = useAppStore((s) => s.wordCount);
  const wordTarget = useAppStore((s) => s.wordTarget);
  const setWordTarget = useAppStore((s) => s.setWordTarget);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    setWordTarget(normalizeGoal(draft));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="goal-input"
        type="number"
        min={0}
        autoFocus
        placeholder="目标字数(0 取消)"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  const pct = goalPercent(wordCount, wordTarget);
  return (
    <button
      className="status-btn goal"
      title="设置字数目标"
      onClick={() => {
        setDraft(wordTarget > 0 ? String(wordTarget) : "");
        setEditing(true);
      }}
    >
      {pct === null ? (
        "🎯 目标"
      ) : (
        <>
          <span className="goal-bar">
            <span className="goal-fill" style={{ width: `${pct}%` }} />
          </span>
          <span>
            {wordCount}/{wordTarget} · {pct}%
          </span>
        </>
      )}
    </button>
  );
}
