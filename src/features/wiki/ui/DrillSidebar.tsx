import Link from "next/link";
import type { TreeNode } from "@/shared/api/backend";

/** 드릴다운 사이드바 — 현재 폴더의 하위만 나열. 맨 위에 뒤로가기 + 전체 트리 모달. (이슈 #17) */
export default function DrillSidebar({ folder, folderPath }: {
  folder: TreeNode;         // 현재 폴더 노드
  folderPath: string;       // "" = 루트
}) {
  // 뒤로 = 트리 객체의 prev 링크 (경로 문자열 계산 아님 — backend #21)
  const backHref = folder.prev === null && folderPath === ""
    ? null
    : folder.prev === "" || folder.prev === null ? "/" : `/wiki/${folder.prev}`;
  return (
    <nav style={{ padding: "1rem 0", position: "sticky", top: 53,
                  maxHeight: "calc(100vh - 53px)", overflowY: "auto", overflowX: "hidden" }}>
      {/* 상단: < 뒤로(좌) · 전체트리 >(우) — 음수 마진 없이 aside 전폭 사용 (횡스크롤 원인 제거) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0 1rem 0.7rem", marginBottom: "0.9rem",
                    borderBottom: "1px solid var(--line)" }}>
        {backHref !== null ? (
          <Link href={backHref}
            style={{ color: "var(--fg)", fontSize: "0.88rem", fontWeight: 600 }}>&lt; 뒤로</Link>
        ) : (
          <span style={{ color: "var(--fg)", fontSize: "0.88rem", fontWeight: 600 }}>루트</span>
        )}
        <Link href="/tree"
          style={{ color: "var(--fg)", fontSize: "0.88rem", fontWeight: 600 }}>전체트리 &gt;</Link>
      </div>
      {/* 현재 카테고리명 — 크게 */}
      <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--fg)",
                    margin: "0 1rem 0.7rem" }}>
        {folder.name || "study-note"}
      </div>
      <ul style={{ listStyle: "none", padding: "0 0.6rem" }}>
        {folder.children.map((child) => (
          <li key={child.path} style={{ margin: "0.1rem 0" }}>
            <Link href={`/wiki/${child.path}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                       color: "var(--fg)", fontSize: "0.92rem", padding: "0.28rem 0.4rem",
                       borderRadius: 6,
                       fontWeight: child.is_subject ? 400 : 600 }}>
              <span>{child.name}</span>
              {!child.is_subject && (
                <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>
                  {child.children.length + child.docs.length} ›
                </span>
              )}
            </Link>
          </li>
        ))}
        {folder.docs.filter((doc) => !doc.path.endsWith("README.md")).map((doc) => (
          <li key={doc.path} style={{ margin: "0.1rem 0" }}>
            <Link href={`/wiki/${doc.path.replace(/\.md$/, "")}`}
              style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "0.2rem 0.4rem",
                       display: "block" }}>
              {doc.path.split("/").pop()?.replace(/\.md$/, "")}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
