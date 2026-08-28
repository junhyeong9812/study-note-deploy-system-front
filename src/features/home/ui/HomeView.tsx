import Link from "next/link";
import Header from "@/shared/ui/Header";
import type { TreeData, TreeNode } from "@/shared/api/backend";

function countSubjects(node: TreeNode): number {
  return (node.is_subject ? 1 : 0) + node.children.reduce((sum, child) => sum + countSubjects(child), 0);
}

export default function HomeView({ treeData }: { treeData: TreeData }) {
  return (
    <div>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>study-note</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          공부 노트 위키 · 커밋 {treeData.commit_sha.slice(0, 8)}
        </p>
        <ul style={{ listStyle: "none", display: "grid", gap: "0.75rem" }}>
          {treeData.tree.children.map((bucket) => (
            <li key={bucket.path}
                style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <Link href={`/wiki/${bucket.path}`} style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                {bucket.name}
              </Link>
              <span style={{ color: "var(--muted)", marginLeft: "0.75rem", fontSize: "0.9rem" }}>
                주제 {countSubjects(bucket)}개
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
