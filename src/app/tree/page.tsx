import CollapsibleTree from "@/features/wiki/ui/CollapsibleTree";
import WikiView from "@/features/wiki/ui/WikiView";
import { backendGet, newRequestId, type TreeData } from "@/shared/api/backend";

export const dynamic = "force-dynamic";

/** app = 라우팅만 — 전체 트리를 콘텐츠 영역에 렌더 (모달 아님, 이슈 #17) */
export default async function TreePage() {
  const treeData = await backendGet<TreeData>("/api/tree", newRequestId());
  return (
    <WikiView treeData={treeData} folder={treeData.tree} folderPath=""
      body={<CollapsibleTree tree={treeData.tree} />} />
  );
}
