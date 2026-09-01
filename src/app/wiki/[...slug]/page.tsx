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

  let chatDocPath: string | null = null;   // 채팅 컨텍스트 문서 (이슈 #25)
  // 사이드바 기준 폴더: 폴더면 자신, 주제/문서면 부모
  const folderPath = node && !node.is_subject
    ? currentPath
    : currentPath.split("/").slice(0, -1).join("/");
  const folder = findNode(treeData.tree, folderPath) ?? treeData.tree;

  let body;
  if (node && !node.is_subject) {
    // 폴더 콘텐츠 = 그 폴더의 README (사양: 하위 나열은 사이드바 몫)
    const readme = node.docs.find((doc) => doc.path.endsWith("README.md"));
    if (readme) {
      const doc = await fetchDoc(readme.path);
      chatDocPath = doc.path;
      body = <Markdown markdown={doc.markdown || "*빈 README*"} docPath={doc.path} />;
    } else {
      body = <FolderView node={node} />;   // README 없는 폴더는 목록 폴백
    }
  } else if (node && node.is_subject) {
    const docsByKind = new Map<string, DocData | null>();
    await Promise.all(node.docs.map(async (docRef: { doc_kind: string; path: string }) => {
      docsByKind.set(docRef.doc_kind, await fetchDoc(docRef.path).catch(() => null));
    }));
    for (const kind of CHAPTER_KINDS) if (!docsByKind.has(kind)) docsByKind.set(kind, null);
    chatDocPath = [...docsByKind.values()].find((doc) => doc)?.path ?? null;   // 요약/첫 문서 기준
    const summary = docsByKind.get("summary");
    if (summary) chatDocPath = summary.path;
    body = <SubjectView node={node} docsByKind={docsByKind} extras={otherDocs(node)} />;
  } else {
    try {
      const doc = await fetchDoc(currentPath + ".md");
      chatDocPath = doc.path;
      body = <Markdown markdown={doc.markdown || "*빈 문서*"} docPath={doc.path} />;
    } catch {
      notFound();
    }
  }
  return <WikiView treeData={treeData} folder={folder} folderPath={folderPath} body={body} chatDocPath={chatDocPath} />;
}
