import WikiView from "@/features/wiki/ui/WikiView";
import Markdown from "@/features/wiki/ui/Markdown";
import { backendGet, newRequestId, type DocData, type TreeData } from "@/shared/api/backend";

export const dynamic = "force-dynamic";

/** app = 라우팅만 — 루트: 사이드바에 최상위 주제, 콘텐츠에 전체 README (이슈 #17) */
export default async function HomePage() {
  const requestId = newRequestId();
  const treeData = await backendGet<TreeData>("/api/tree", requestId);
  let markdown = "*README 없음*";
  try {
    const doc = await backendGet<DocData>(`/api/doc?path=${encodeURIComponent("README.md")}`, requestId);
    markdown = doc.markdown || markdown;
  } catch {}
  return (
    <WikiView treeData={treeData} folder={treeData.tree} folderPath=""
      body={<Markdown markdown={markdown} docPath="README.md" />} />
  );
}
