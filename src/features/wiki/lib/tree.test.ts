import { describe, expect, it } from "vitest";
import type { TreeNode } from "@/shared/api/backend";
import { chapterTabs, findNode } from "./tree";

const leaf = (name: string, path: string, kinds: string[]): TreeNode => ({
  name, path, is_subject: true, children: [],
  docs: kinds.map((kind) => ({ path: `${path}/${kind}.md`, doc_kind: kind, form: "chapter" })),
});
const tree: TreeNode = {
  name: "", path: "", is_subject: false, docs: [],
  children: [{ name: "cs", path: "cs", is_subject: false, docs: [],
    children: [leaf("lsm-tree", "cs/lsm-tree", ["answer", "question", "summary"])] }],
};

describe("findNode", () => {
  it("경로로 노드를 찾는다", () => {
    expect(findNode(tree, "cs/lsm-tree")?.is_subject).toBe(true);
    expect(findNode(tree, "cs/none")).toBeNull();
    expect(findNode(tree, "")?.path).toBe("");
  });
});

describe("chapterTabs", () => {
  it("1→2→3 순서로 정렬한다", () => {
    expect(chapterTabs(findNode(tree, "cs/lsm-tree")!).map((d) => d.doc_kind))
      .toEqual(["question", "summary", "answer"]);
  });
  it("코테처럼 2-summary가 없으면 있는 것만 — 부재는 의도된 설계", () => {
    expect(chapterTabs(leaf("x", "p/x", ["answer", "question"])).map((d) => d.doc_kind))
      .toEqual(["question", "answer"]);
  });
});
