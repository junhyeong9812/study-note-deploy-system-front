"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
      style={{ flex: 1, maxWidth: 480 }}
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="노트 검색 — 예: 정렬을 나중으로 미루는 구조"
        style={{
          width: "100%", padding: "0.5rem 0.9rem", borderRadius: 8,
          border: "1px solid var(--line)", background: "var(--code-bg)",
          color: "var(--fg)", fontSize: "0.9rem", outline: "none",
        }}
      />
    </form>
  );
}
