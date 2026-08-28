import { describe, expect, it } from "vitest";
import { resolveHref } from "../../lib/links";

describe("resolveHref — 노트 상대 링크 → /wiki 경로", () => {
  it("상대·상위 이동·.md 제거", () => {
    expect(resolveHref("2-summary.md", "cs/lsm-tree")).toBe("/wiki/cs/lsm-tree/2-summary");
    expect(resolveHref("../kafka-why-fast/", "cs/systems/lsm-tree")).toBe("/wiki/cs/systems/kafka-why-fast");
  });
  it("hash·query 보존 — other.md#절 이 .md.md 가 되지 않는다 (리뷰 수정)", () => {
    expect(resolveHref("other.md#section", "cs/x")).toBe("/wiki/cs/x/other#section");
    expect(resolveHref("index.md?tab=1", "cs")).toBe("/wiki/cs/index?tab=1");
  });
  it("외부·앵커 링크는 그대로", () => {
    expect(resolveHref("https://example.com/a.md", "cs")).toBe("https://example.com/a.md");
    expect(resolveHref("#local", "cs")).toBe("#local");
  });
});
