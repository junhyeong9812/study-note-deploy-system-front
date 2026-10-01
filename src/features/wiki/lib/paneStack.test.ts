import { describe, it, expect } from "vitest";
import { openLink, closeTop, visiblePanes } from "./paneStack";

describe("paneStack", () => {
  it("단일에서 클릭하면 push (A → A|B)", () => {
    expect(openLink(["A"], 0, "B")).toEqual(["A", "B"]);
    expect(visiblePanes(["A", "B"])).toEqual(["A", "B"]);
  });

  it("왼쪽 pane 링크는 top 교체 (A|B → A|C)", () => {
    const next = openLink(["A", "B"], 0, "C");
    expect(next).toEqual(["A", "C"]);
    expect(visiblePanes(next)).toEqual(["A", "C"]);
  });

  it("오른쪽 pane 링크는 push·이동 (A|B → B|D)", () => {
    const next = openLink(["A", "B"], 1, "D");
    expect(next).toEqual(["A", "B", "D"]);
    expect(visiblePanes(next)).toEqual(["B", "D"]);   // 마지막 2개
  });

  it("닫기는 pop (B|D → A|B → A)", () => {
    expect(closeTop(["A", "B", "D"])).toEqual(["A", "B"]);
    expect(closeTop(["A", "B"])).toEqual(["A"]);
  });

  it("단일에서는 닫아도 유지", () => {
    expect(closeTop(["A"])).toEqual(["A"]);
  });

  it("visiblePanes는 1개면 그대로, 2개 이상이면 마지막 2개", () => {
    expect(visiblePanes(["A"])).toEqual(["A"]);
    expect(visiblePanes(["A", "B", "C"])).toEqual(["B", "C"]);
  });
});
