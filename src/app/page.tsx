import HomeView from "@/features/home/ui/HomeView";
import { backendGet, newRequestId, type TreeData } from "@/shared/api/backend";

export const dynamic = "force-dynamic";

/** app = 라우팅만 — 데이터 로드 후 feature View에 위임 */
export default async function HomePage() {
  const treeData = await backendGet<TreeData>("/api/tree", newRequestId());
  return <HomeView treeData={treeData} />;
}
