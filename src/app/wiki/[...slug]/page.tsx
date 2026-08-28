import { notFound } from "next/navigation";
import WikiView, { FolderView, SubjectView } from "@/features/wiki/ui/WikiView";
import Markdown from "@/features/wiki/ui/Markdown";
import { backendGet, newRequestId, type DocData, type TreeData } from "@/shared/api/backend";
import { CHAPTER_KINDS, findNode, otherDocs } from "@/features/wiki/lib/tree";

export const dynamic = "force-dynamic";

/** app = 라우팅만 — 노드 판별·데이터 로드 후 feature View에 위임 */
export default async function WikiPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const requestId = newRequestId();
  const currentPath = slug.map(decodeURIComponent).join("/");
  const treeData = await backendGet<TreeData>("/api/tree", requestId);
  const node = findNode(treeData.tree, currentPath);

  const fetchDoc = (path: string) =>
    backendGet<DocData>(`/api/doc?path=${encodeURIComponent(path)}`, requestId);

  let body;
  if (node && !node.is_subject) {
    body = <FolderView node={node} />;
  } else if (node && node.is_subject) {
    const docsByKind = new Map<string, DocData | null>();
    await Promise.all(node.docs.map(async (docRef: { doc_kind: string; path: string }) => {
      docsByKind.set(docRef.doc_kind, await fetchDoc(docRef.path).catch(() => null));
    }));
    for (const kind of CHAPTER_KINDS) if (!docsByKind.has(kind)) docsByKind.set(kind, null);
    body = <SubjectView node={node} docsByKind={docsByKind} extras={otherDocs(node)} />;
  } else {
    try {
      const doc = await fetchDoc(currentPath + ".md");
      body = <Markdown markdown={doc.markdown || "*빈 문서*"} docPath={doc.path} />;
    } catch {
      notFound();
    }
  }
  return <WikiView treeData={treeData} currentPath={currentPath} body={body} />;
}
