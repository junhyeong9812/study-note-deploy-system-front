"use client";
import { useLayout } from "@/features/layout/ui/LayoutContext";
import styles from "./LayoutToggles.module.css";

/** 헤더 트리 토글 [≡] — Shell 밖이면 렌더 안 함. (3단계: 좁은 화면 햄버거 드로어) */
export function TreeToggle() {
  const layout = useLayout();
  if (!layout) return null;
  return (
    <button type="button" className={styles.toggle} onClick={layout.toggleTree}
            aria-expanded={layout.treeOpen} aria-controls="layout-tree"
            aria-label="문서 트리" title="트리 열고 닫기 (Ctrl+\)">
      ≡
    </button>
  );
}

/** 헤더 챗 토글 [💬] — 챗을 붙일 문서가 없는 페이지에선 렌더 안 함 */
export function ChatToggle() {
  const layout = useLayout();
  if (!layout || !layout.chatAvailable) return null;
  return (
    <button type="button" className={styles.toggle} onClick={layout.toggleChat}
            aria-expanded={layout.chatOpen} aria-controls="layout-chat"
            aria-label="문서 질문 챗" title="챗 열고 닫기 (Ctrl+/)">
      <span aria-hidden="true">💬</span>
    </button>
  );
}
