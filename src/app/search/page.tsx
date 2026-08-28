import SearchResultsView from "@/features/search/ui/SearchResultsView";
import { backendGet, newRequestId, type SearchData } from "@/shared/api/backend";

export const dynamic = "force-dynamic";

/** app = 라우팅만 — SSR 검색 후 feature View에 위임 */
export default async function SearchPage({ searchParams }:
  { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  let data: SearchData | null = null;
  let failed = false;
  if (query) {
    try {
      data = await backendGet<SearchData>(`/api/search?q=${encodeURIComponent(query)}`, newRequestId());
    } catch {
      failed = true;
    }
  }
  return <SearchResultsView query={query} data={data} failed={failed} />;
}
