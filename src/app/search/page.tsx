import Link from "next/link";
import Header from "@/components/Header";
import { backendGet, newRequestId, type SearchData } from "@/lib/backend";
import { KIND_LABEL } from "@/lib/tree";

export const dynamic = "force-dynamic";

function Badge({ on, labelOn, labelOff }: { on: boolean; labelOn: string; labelOff: string }) {
  return (
    <span style={{
      fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: 99,
      background: on ? "var(--accent-bg)" : "var(--code-bg)",
      color: on ? "var(--accent)" : "var(--muted)", marginRight: "0.5rem",
    }}>
      {on ? labelOn : labelOff}
    </span>
  );
}

export default async function SearchPage({ searchParams }:
  { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const requestId = newRequestId();

  let content;
  if (!query) {
    content = <p style={{ color: "var(--muted)" }}>검색어를 입력하세요.</p>;
  } else {
    try {
      const data = await backendGet<SearchData>(`/api/search?q=${encodeURIComponent(query)}`, requestId);
      content = (
        <div>
          <p style={{ marginBottom: "1.25rem", color: "var(--muted)", fontSize: "0.85rem" }}>
            <Badge on={data.rewrite_used} labelOn="질의 확장 사용" labelOff="질의 확장 생략(폴백)" />
            <Badge on={data.dense_used} labelOn="의미 검색 사용" labelOff="의미 검색 생략(폴백)" />
            {data.results.length}건
          </p>
          <ul style={{ listStyle: "none", display: "grid", gap: "1rem" }}>
            {data.results.map((result) => (
              <li key={`${result.path}#${result.chunk_no}`}
                  style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                <Link href={`/wiki/${result.path.split("/").slice(0, -1).join("/")}`}
                      style={{ fontWeight: 600 }}>
                  {result.heading || result.path}
                </Link>
                <span style={{ marginLeft: "0.6rem", fontSize: "0.75rem", color: "var(--muted)" }}>
                  {KIND_LABEL[result.doc_kind] ?? result.doc_kind} · {result.path}
                </span>
                <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--muted)" }}>
                  {result.snippet}…
                </p>
              </li>
            ))}
          </ul>
        </div>
      );
    } catch (error) {
      content = <p style={{ color: "var(--muted)" }}>검색 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.</p>;
    }
  }

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h1 style={{ marginBottom: "1.5rem", fontSize: "1.3rem" }}>
          {query ? <>검색: <em>{query}</em></> : "검색"}
        </h1>
        {content}
      </main>
    </div>
  );
}
