"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { renderMarked } from "@/features/search/lib/mark";

interface SuggestItem { path: string; title: string; doc_kind: string; snippet: string }

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {                                   // 입력 → 200ms 디바운스 → ES 자동완성
    if (debounce.current) clearTimeout(debounce.current);
    const trimmed = query.trim();
    if (!trimmed) { setItems([]); setActive(-1); return; }
    debounce.current = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`)
        .then((response) => response.json())
        .then((body) => { if (body.success) { setItems(body.data.items); setActive(-1); } })
        .catch(() => {});
    }, 200);
  }, [query]);

  const submitSearch = () => {
    if (!query.trim()) return;
    setItems([]);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  const goItem = (item: SuggestItem) => {
    setItems([]); setQuery("");
    router.push(`/wiki/${item.path.replace(/\.md$/, "")}`);
  };

  return (
    <div style={{ flex: 1, maxWidth: 520, position: "relative" }}>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (active >= 0 && items[active]) goItem(items[active]);
        else submitSearch();
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0,
                      border: "1px solid var(--line)", borderRadius: 8,
                      background: "var(--code-bg)" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => setTimeout(() => setItems([]), 150)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
              if (event.key === "Escape") setItems([]);
            }}
            placeholder="노트 검색"
            style={{ flex: 1, padding: "0.5rem 0.9rem", border: "none", outline: "none",
                     background: "transparent", color: "var(--fg)", fontSize: "0.9rem" }}
          />
          <button type="button" onClick={submitSearch} aria-label="검색"
            style={{ border: "none", background: "transparent", cursor: "pointer",
                     padding: "0.45rem 0.8rem", color: "var(--muted)", fontSize: "0.95rem" }}>
            🔍
          </button>
        </div>
      </form>
      {items.length > 0 && (
        <ul style={{ listStyle: "none", position: "absolute", top: "112%", left: 0, right: 0,
                     background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10,
                     boxShadow: "0 10px 30px rgba(0,0,0,0.14)", zIndex: 30, overflow: "hidden" }}>
          {items.map((item, index) => (
            <li key={item.path} style={{ borderTop: index ? "1px solid var(--line)" : "none" }}>
              <button onMouseDown={() => goItem(item)}
                style={{ display: "block", width: "100%", padding: "0.55rem 0.9rem",
                         border: "none", cursor: "pointer", textAlign: "left",
                         background: index === active ? "var(--accent-bg)" : "transparent",
                         color: "var(--fg)" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 2 }}>
                  {renderMarked(item.title)}
                  <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.72rem",
                                 marginLeft: 8 }}>{item.path}</span>
                </div>
                {item.snippet && (
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {renderMarked(item.snippet)}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
