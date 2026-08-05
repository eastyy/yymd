/**
 * 调试诊断:把 webview 内的关键日志转发到 Rust 写文件(/tmp/yymd-webview.log),
 * 用于无 devtools 环境下定位运行时问题。
 */
import { invoke } from "@tauri-apps/api/core";

export function dlog(msg: string) {
  try {
    void invoke("debug_log", { msg }).catch(() => {});
  } catch {
    /* noop */
  }
}

export function installDebugHooks() {
  window.addEventListener("error", (e) => {
    dlog(`window.onerror: ${e.message} @ ${e.filename ?? ""}:${e.lineno}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    dlog(`unhandledrejection: ${String((e as { reason?: unknown }).reason)}`);
  });
  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args: unknown[]) => {
    dlog(`console.error: ${args.map((a) => (a instanceof Error ? a.stack ?? a.message : String(a))).join(" ")}`);
    origError(...args);
  };
  console.warn = (...args: unknown[]) => {
    dlog(`console.warn: ${args.map(String).join(" ")}`);
    origWarn(...args);
  };
}

/** 启动时探测 mermaid 渲染能力,结果写入日志 */
export async function mermaidStartupProbe() {
  try {
    const { default: mermaid } = await import("mermaid");
    dlog("mermaid module loaded");
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
    const { svg } = await mermaid.render("startup-probe", "flowchart TD\n  A --> B\n");
    dlog(`mermaid probe OK svgLen=${svg.length}`);
  } catch (e) {
    dlog(`mermaid probe FAIL: ${e instanceof Error ? `${e.message} | ${e.stack?.split("\n")[1] ?? ""}` : String(e)}`);
  }
}
