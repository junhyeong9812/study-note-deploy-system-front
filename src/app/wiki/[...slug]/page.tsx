import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Markdown from "@/components/Markdown";
import Sidebar from "@/components/Sidebar";
import Tabs from "@/components/Tabs";
import { backendGet, newRequestId, type DocData, type TreeData, type TreeNode } from "@/lib/backend";
import { KIND_LABEL, chapterTabs, findNode, otherDocs } from "@/lib/tree";

export const dynamic = "force-dynamic";

async function fetchDoc(path: string, requestId: string): Promise<DocData> {
  return backendGet<DocData>(`/api/doc?path=${encodeURIComponent(path)}`, requestId);
}

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
              {doc.path.split("/").pop()} <span style={{ fontSize: "0.8rem" }}>({KIND_LABEL[doc.doc_kind] ?? doc.doc_kind})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function WikiPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const requestId = newRequestId();
  const currentPath = slug.map(decodeURIComponent).join("/");
  const treeData = await backendGet<TreeData>("/api/tree", requestId);
  const node = findNode(treeData.tree, currentPath);

  let body;
  if (node && !node.is_subject) {
    body = <FolderView node={node} />;                       // 폴더 탐색
  } else if (node && node.is_subject) {
    const tabs = chapterTabs(node);                          // 주제(리프) — 1/2/3 탭
    const extras = otherDocs(node);
    if (tabs.length > 0) {
      const docs = await Promise.all(tabs.map((tab) => fetchDoc(tab.path, requestId)));
      body = (
        <div>
          <h1 style={{ marginBottom: "1rem" }}>{node.name}</h1>
          <Tabs
            labels={tabs.map((tab) => KIND_LABEL[tab.doc_kind] ?? tab.doc_kind)}
            panels={docs.map((doc) => (
              <Markdown key={doc.path} markdown={doc.markdown || "*아직 작성 전*"} docPath={doc.path} />
            ))}
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
    } else {
      const doc = await fetchDoc(node.docs[0].path, requestId);   // post 단일 기록
      body = (
        <div>
          <h1 style={{ marginBottom: "1rem" }}>{node.name}</h1>
          <Markdown markdown={doc.markdown || "*아직 작성 전*"} docPath={doc.path} />
        </div>
      );
    }
  } else {
    // 트리에 폴더가 없으면 문서 경로일 수 있다 (예: /wiki/cs/index)
    try {
      const doc = await fetchDoc(currentPath + ".md", requestId);
      body = <Markdown markdown={doc.markdown || "*빈 문서*"} docPath={doc.path} />;
    } catch {
      notFound();
    }
  }

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
