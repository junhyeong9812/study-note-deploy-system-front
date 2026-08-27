"use client";
import { useState, type ReactNode } from "react";

export default function Tabs({ labels, panels }: { labels: string[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: "1.25rem" }}>
        {labels.map((label, index) => (
          <button key={label} onClick={() => setActive(index)}
            style={{
              padding: "0.5rem 1rem", border: "none", cursor: "pointer", fontSize: "0.95rem",
              background: index === active ? "var(--accent-bg)" : "transparent",
              color: index === active ? "var(--accent)" : "var(--muted)",
              borderBottom: index === active ? "2px solid var(--accent)" : "2px solid transparent",
              borderRadius: "6px 6px 0 0", fontWeight: index === active ? 600 : 400,
            }}>
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div key={index} style={{ display: index === active ? "block" : "none" }}>{panel}</div>
      ))}
    </div>
  );
}
