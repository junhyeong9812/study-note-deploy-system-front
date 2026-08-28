import Link from "next/link";
import type { TreeNode } from "@/shared/api/backend";

function NodeLink({ node, currentPath }: { node: TreeNode; currentPath: string }) {
  const isActive = currentPath === node.path || currentPath.startsWith(node.path + "/");
  return (
    <li style={{ margin: "0.15rem 0" }}>
      <Link href={`/wiki/${node.path}`}
        style={{ color: isActive ? "var(--accent)" : "var(--fg)",
                 fontWeight: currentPath === node.path ? 700 : 400, fontSize: "0.9rem" }}>
        {node.name}
      </Link>
      {isActive && node.children.length > 0 && (
        <ul style={{ listStyle: "none", paddingLeft: "0.9rem", borderLeft: "1px solid var(--line)" }}>
          {node.children.map((child) => (
            <NodeLink key={child.path} node={child} currentPath={currentPath} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ tree, currentPath }: { tree: TreeNode; currentPath: string }) {
  return (
    <nav style={{ padding: "1rem 0" }}>
      <ul style={{ listStyle: "none" }}>
        {tree.children.map((bucket) => (
          <NodeLink key={bucket.path} node={bucket} currentPath={currentPath} />
        ))}
      </ul>
    </nav>
  );
}
