"use client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import ChatPanel from "@/features/chat/ui/ChatPanel";
import { LayoutContext, type LayoutApi } from "@/features/layout/ui/LayoutContext";
import {
  CHAT_KEY, INITIAL_CHAT, TREE_KEY, isChatOpen, parseStoredOpen, shortcutAction,
  toggleChatState, withSplit, shouldPersistChat, type ChatState,
} from "@/features/layout/lib/layoutState";
import styles from "./LayoutShell.module.css";

function readOpen(key: string, fallback: boolean): boolean {
  try { return parseStoredOpen(localStorage.getItem(key), fallback); } catch { return fallback; }
}

/** 첫 하이드레이션 이후(같은 탭의 클라 이동)엔 저장값으로 바로 시작 — 이동마다 패널이 펼쳐졌다 접히는 깜빡임 방지.
 *  서버에선 effect가 안 돌아 항상 false → 서버 HTML·첫 하이드레이션은 기본값(열림)으로 일치. */
let restoredOnce = false;

function save(key: string, open: boolean) {
  try { localStorage.setItem(key, open ? "1" : "0"); } catch { /* 저장 차단 — 이번 세션만 */ }
}

/** 레이아웃 셸 — 트리·챗 열림 상태와 챗 대상 문서의 단일 소유자 (design.md §6). */
export default function LayoutShell({ header, sidebar, chatDocPath, wide, children }: {
  header: ReactNode;
  sidebar: ReactNode;
  chatDocPath?: string | null;     // 페이지 기본 챗 문서(없으면 챗 없음)
  wide?: boolean;                  // 분할 리더 — 본문 폭 캡·패딩 제거
  children: ReactNode;
}) {
  const [treeOpen, setTreeOpen] = useState(() => (restoredOnce ? readOpen(TREE_KEY, true) : true));
  const [chat, setChat] = useState<ChatState>(() =>
    restoredOnce ? { ...INITIAL_CHAT, chatPref: readOpen(CHAT_KEY, true) } : INITIAL_CHAT);
  const [paneDoc, setPaneDoc] = useState<string | null>(null);

  // 첫 하이드레이션 1회: 저장된 선호 복원 (새로고침 첫 로드만 기본값→저장값 짧은 전환 — 수용 한계)
  useEffect(() => {
    if (restoredOnce) return;
    setTreeOpen(readOpen(TREE_KEY, true));
    const chatPref = readOpen(CHAT_KEY, true);
    setChat((current) => ({ ...current, chatPref }));
    restoredOnce = true;
  }, []);

  const chatDoc = paneDoc ?? chatDocPath ?? null;
  const chatAvailable = chatDoc !== null;
  const chatOpen = chatAvailable && isChatOpen(chat);

  const toggleTree = useCallback(() => {
    const next = !treeOpen;
    setTreeOpen(next);
    save(TREE_KEY, next);
  }, [treeOpen]);

  const toggleChat = useCallback(() => {
    const next = toggleChatState(chat);
    setChat(next);
    if (shouldPersistChat(chat)) save(CHAT_KEY, next.chatPref);   // 분할 중 토글은 기억 안 함
  }, [chat]);

  const reportPane = useCallback((docPath: string | null, split: boolean) => {
    setPaneDoc(docPath);
    setChat((current) => withSplit(current, split));
  }, []);

  // 단축키: Ctrl+\ 트리 · Ctrl+/ 챗 (입력 중 무시)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;   // 키를 누르고 있을 때 반복 토글 방지
      const action = shortcutAction(event, event.target as HTMLElement | null);
      if (action === "tree") { event.preventDefault(); toggleTree(); }
      else if (action === "chat" && chatAvailable) { event.preventDefault(); toggleChat(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTree, toggleChat, chatAvailable]);

  const api: LayoutApi = useMemo(
    () => ({ treeOpen, chatOpen, chatAvailable, toggleTree, toggleChat, reportPane }),
    [treeOpen, chatOpen, chatAvailable, toggleTree, toggleChat, reportPane],
  );

  return (
    <LayoutContext.Provider value={api}>
      <div className={styles.shell} data-tree={treeOpen ? "open" : "closed"} data-chat={chatOpen ? "open" : "closed"}>
        {header}
        <div className={styles.body}>
          <aside id="layout-tree" className={styles.tree} hidden={!treeOpen} aria-label="문서 트리">
            {sidebar}
          </aside>
          <main className={wide ? styles.mainWide : styles.main}>
            {wide ? children : <div className={styles.reading}>{children}</div>}
          </main>
          {chatAvailable && (
            <aside id="layout-chat" className={styles.chat} hidden={!chatOpen} aria-label="문서 질문 챗">
              {chatOpen && <ChatPanel docPath={chatDoc} />}   {/* 닫힘 = 미마운트 → 이력 fetch 없음 */}
            </aside>
          )}
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
