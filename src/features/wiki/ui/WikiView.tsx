import Link from "next/link";
import Header from "@/shared/ui/Header";
import Markdown from "./Markdown";
import Sidebar from "./Sidebar";
import Tabs from "./Tabs";
import type { DocData, TreeData, TreeNode } from "@/shared/api/backend";
import { CHAPTER_KINDS, KIND_LABEL, otherDocs } from "../lib/tree";

function FolderView({ node }: { node: TreeNode }) {
  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>{node.name || "전체"}</h1>
      <ul style={{ listStyle: "none", display: "grid", gap: "0.5rem" }}>
        {node.children.map((child) => (
          <li key={child.path}
              style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "0.7rem 1rem" }}>
            <Link href={`/wiki/${child.path}`} style={{ fontWeight: 600 }}>
              {child.is_subject ? "📄 " : "📁 "}{child.name}
            </Link>
          </li>
        ))}
        {node.docs.map((doc) => (
          <li key={doc.path} style={{ padding: "0.3rem 1rem", color: "var(--muted)" }}>
            <Link href={`/wiki/${doc.path.replace(/\.md$/, "")}`}>
              {doc.path.split("/").pop()}{" "}
              <span style={{ fontSize: "0.8rem" }}>({KIND_LABEL[doc.doc_kind] ?? doc.doc_kind})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 주제(리프) — 챕터면 1/2/3 **3탭 고정**: 없는 문서는 "작성 전" 패널.
 * (2026-08-28 결정: 코테 2-summary는 의도된 부재가 아니라 추후 문제 분석으로 작성 예정) */
export function SubjectView({ node, docsByKind, extras }: {
  node: TreeNode;
  docsByKind: Map<string, DocData | null>;
  extras: { path: string; doc_kind: string }[];
}) {
  const isChapter = node.docs.some((doc) => CHAPTER_KINDS.includes(doc.doc_kind));
  if (!isChapter) {
    const single = [...docsByKind.values()].find((doc) => doc != null);
    return (
      <div>
        <h1 style={{ marginBottom: "1rem" }}>{node.name}</h1>
        <Markdown markdown={single?.markdown || "*아직 작성 전*"} docPath={single?.path ?? node.path} />
      </div>
    );
  }
  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>{node.name}</h1>
      <Tabs
        labels={CHAPTER_KINDS.map((kind) => KIND_LABEL[kind])}
        panels={CHAPTER_KINDS.map((kind) => {
          const doc = docsByKind.get(kind);
          return doc
            ? <Markdown key={kind} markdown={doc.markdown || "*아직 작성 전*"} docPath={doc.path} />
            : <p key={kind} style={{ color: "var(--muted)" }}>아직 작성 전 — push하면 이 탭에 나타난다.</p>;
        })}
      />
      {extras.length > 0 && (
        <p style={{ marginTop: "2rem", color: "var(--muted)" }}>
          기타: {extras.map((doc) => (
            <Link key={doc.path} href={`/wiki/${doc.path.replace(/\.md$/, "")}`}
                  style={{ marginRight: "0.75rem" }}>{doc.path.split("/").pop()}</Link>
          ))}
        </p>
      )}
    </div>
  );
}

export default function WikiView({ treeData, currentPath, body }: {
  treeData: TreeData; currentPath: string; body: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", maxWidth: 1200, margin: "0 auto" }}>
        <aside style={{ borderRight: "1px solid var(--line)", padding: "0 1rem", minHeight: "calc(100vh - 53px)" }}>
          <Sidebar tree={treeData.tree} currentPath={currentPath} />
        </aside>
        <main style={{ padding: "2rem 2.5rem", minWidth: 0 }}>{body}</main>
      </div>
    </div>
  );
}
export { FolderView };
