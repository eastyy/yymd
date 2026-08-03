// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import mermaid from "mermaid";

const pkgPath = path.join(process.cwd(), "node_modules", "mermaid", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

// mermaid v11 引入/稳定的最新图类型语法样本(摘自官方文档)
const LATEST_DIAGRAMS: Array<[string, string]> = [
  [
    "packet(v11 新增)",
    `packet-beta\n0-15: "Source Port"\n16-31: "Destination Port"\n32-63: "Sequence Number"\n`,
  ],
  [
    "architecture(v11 新增)",
    `architecture-beta\n    group api(cloud)[API]\n    service db(database)[Database] in api\n    service disk1(disk)[Storage] in api\n    db:L -- R:disk1\n`,
  ],
  [
    "kanban(v11 新增)",
    `kanban\n  todo[To do]\n    task1[Define workflow]\n  doing[In progress]\n    task2[Implement board]\n`,
  ],
  [
    "radar(v11 新增)",
    `radar-beta\n  title Skills\n  axis js["JavaScript"], py["Python"]\n  curve dev["Developer"]{80, 60}\n`,
  ],
  [
    "block-beta",
    `block-beta\n  columns 2\n  a["A"] b["B"]\n`,
  ],
  [
    "timeline",
    `timeline\n  title Timeline\n  section 2024\n    Q1 : Launch : Beta\n`,
  ],
  [
    "mindmap",
    `mindmap\n  root((root))\n    child1\n    child2\n`,
  ],
  [
    "xychart",
    `xychart-beta\n  title "Sales"\n  x-axis [jan, feb, mar]\n  y-axis "units" 0 --> 10\n  bar [2, 5, 7]\n`,
  ],
  [
    "经典 flowchart",
    `flowchart TD\n  A[Start] --> B{OK?}\n  B -- yes --> C[Done]\n`,
  ],
];

describe("mermaid 版本与最新语法支持", () => {
  it("mermaid 主版本 >= 11", () => {
    const major = Number(pkg.version.split(".")[0]);
    expect(major).toBeGreaterThanOrEqual(11);
  });

  for (const [name, code] of LATEST_DIAGRAMS) {
    it(`可解析 ${name}`, async () => {
      mermaid.initialize({ startOnLoad: false });
      const result = await mermaid.parse(code);
      expect(result).toBeTruthy();
    });
  }
});
