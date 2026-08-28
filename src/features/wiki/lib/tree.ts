import type { TreeNode } from "@/shared/api/backend";

/** 경로("cs/systems/lsm-tree")로 트리에서 노드 탐색 */
export function findNode(root: TreeNode, path: string): TreeNode | null {
  if (path === "" || path === root.path) return root;
  const segments = path.split("/");
  let current: TreeNode | undefined = root;
  for (let depth = 0; depth < segments.length; depth++) {
    current = current?.children.find((child) => child.name === segments[depth]);
    if (!current) return null;
  }
  return current;
}

const KIND_ORDER: Record<string, number> = { question: 1, summary: 2, answer: 3 };
/** 챕터 3형 — 주제 페이지는 이 3탭을 고정 노출(없으면 "작성 전") */
export const CHAPTER_KINDS = ["question", "summary", "answer"] as const as unknown as string[];
export const KIND_LABEL: Record<string, string> = {
  question: "1 · 질문", summary: "2 · 정리", answer: "3 · 정답",
  index: "목차", readme: "README", post: "기록",
};

export function chapterTabs(node: TreeNode) {
  return node.docs
    .filter((doc) => KIND_ORDER[doc.doc_kind])
    .sort((a, b) => KIND_ORDER[a.doc_kind] - KIND_ORDER[b.doc_kind]);
}

export function otherDocs(node: TreeNode) {
  return node.docs.filter((doc) => !KIND_ORDER[doc.doc_kind]);
}
