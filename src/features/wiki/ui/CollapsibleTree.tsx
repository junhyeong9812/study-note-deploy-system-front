"use client";
import Link from "next/link";
import { useState } from "react";
import type { TreeNode } from "@/shared/api/backend";

/** 전체 트리 — 콘텐츠 영역에 렌더, 폴더 구조처럼 접기/펼치기 (이슈 #17) */
function Row({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(false);              // 처음엔 전부 접힘 (사용자 사양)
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div style={{ display: "flex", alignItems: "center", gap: 6,
                    padding: `0.22rem 0 0.22rem ${depth * 20}px` }}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} aria-label={open ? "접기" : "펼치기"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                     width: 16, color: "var(--fg)", fontSize: "0.75rem" }}>
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span style={{ width: 16 }} />
        )}
        <Link href={`/wiki/${node.path}`}
          style={{ color: "var(--fg)", fontSize: "0.95rem",
                   fontWeight: node.is_subject ? 400 : 600 }}>
          {node.name}
        </Link>
        {!node.is_subject && (
          <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
            {node.children.length + node.docs.length}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <ul style={{ listStyle: "none", borderLeft: "1px solid var(--line)",
                     marginLeft: depth * 20 + 7 }}>
          {node.children.map((child) => (
            <Row key={child.path} node={child} depth={0} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CollapsibleTree({ tree }: { tree: TreeNode }) {
  return (
    <div>
      <h1 style={{ marginBottom: "1.25rem" }}>전체 트리</h1>
      <ul style={{ listStyle: "none" }}>
        {tree.children.map((bucket) => <Row key={bucket.path} node={bucket} depth={0} />)}
      </ul>
    </div>
  );
}
