/** 字数目标纯逻辑 */

/**
 * 计算目标完成百分比;target 无效(<=0)返回 null。
 * 结果取整并封顶 100,words 为负按 0 计。
 */
export function goalPercent(words: number, target: number): number | null {
  if (!Number.isFinite(target) || target <= 0) return null;
  const w = Math.max(0, Number.isFinite(words) ? words : 0);
  return Math.min(100, Math.round((w / target) * 100));
}

/** 规范化用户输入的目标值:非数字/负数/小数 → 0(即取消目标) */
export function normalizeGoal(input: string | number): number {
  const n = typeof input === "number" ? input : parseInt(input, 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}
