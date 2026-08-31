import type { ReactNode } from "react";

/** ⟦m⟧…⟦/m⟧ 마커를 <mark>로 — 텍스트는 React가 이스케이프하므로 HTML 주입 원천 차단 */
export function renderMarked(text: string): ReactNode[] {
  return text.split("⟦m⟧").flatMap((piece, index) => {
    if (index === 0) return [piece];
    const [marked, ...rest] = piece.split("⟦/m⟧");
    return [
      <mark key={index} style={{ background: "var(--accent-bg)", color: "var(--accent)",
                                 padding: 0, fontWeight: 700 }}>{marked}</mark>,
      rest.join("⟦/m⟧"),
    ];
  });
}
