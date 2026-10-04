"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ChatPanel from "@/features/chat/ui/ChatPanel";
import { LayoutContext, type LayoutApi } from "@/features/layout/ui/LayoutContext";
import {
  CHAT_KEY, COMPACT_MAX, INITIAL_CHAT, TREE_KEY, isChatOpen, nextDrawer, parseStoredOpen,
  shortcutAction, toggleChatState, withSplit, shouldPersistChat, type ChatState, type Drawer,
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

/** 레이아웃 셸 — 트리·챗 열림 상태와 챗 대상 문서의 단일 소유자 (design.md §6).
 *  데스크톱(≥1200): 접는 그리드 열(선호 기억) / 좁은 화면(<1200): 드로어 하나씩(기억 안 함, 닫힘 시작). */
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
  // 서버·첫 하이드레이션 = 데스크톱(좁은 화면은 CSS가 드로어를 숨김). 클라 이동(재마운트)은 화면 폭을 바로 읽어 aria 불일치 없음
  const [compact, setCompact] = useState(() =>
    restoredOnce ? window.matchMedia(`(max-width: ${COMPACT_MAX}px)`).matches : false);
  const [drawer, setDrawer] = useState<Drawer>("none");
  const returnFocus = useRef<HTMLElement | null>(null);
  const treeRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLElement>(null);

  // 첫 하이드레이션 1회: 저장된 선호 복원 (새로고침 첫 로드만 기본값→저장값 짧은 전환 — 수용 한계)
  useEffect(() => {
    if (restoredOnce) return;
    setTreeOpen(readOpen(TREE_KEY, true));
    const chatPref = readOpen(CHAT_KEY, true);
    setChat((current) => ({ ...current, chatPref }));
    restoredOnce = true;
  }, []);

  // 화면 폭 → 데스크톱/좁은 화면. 모드가 바뀌면 드로어는 닫힘으로
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COMPACT_MAX}px)`);
    const update = () => { setCompact(mq.matches); setDrawer("none"); };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const chatDoc = paneDoc ?? chatDocPath ?? null;
  const chatAvailable = chatDoc !== null;
  // 실제 보이는가 — 좁은 화면은 드로어, 데스크톱은 그리드 열
  const treeVisible = compact ? drawer === "tree" : treeOpen;
  const chatVisible = chatAvailable && (compact ? drawer === "chat" : isChatOpen(chat));
  const drawerOpen = compact && drawer !== "none";

  const openDrawer = useCallback((pressed: "tree" | "chat") => {
    const next = nextDrawer(drawer, pressed);
    const active = document.activeElement as HTMLElement | null;
    const insideDrawer = !!active && (!!treeRef.current?.contains(active) || !!chatRef.current?.contains(active));
    if (next !== "none" && active && !insideDrawer) returnFocus.current = active;   // 드로어 밖에서 연 버튼으로 갱신
    setDrawer(next);
  }, [drawer]);

  const closeDrawer = useCallback(() => setDrawer("none"), []);

  const toggleTree = useCallback(() => {
    if (compact) { openDrawer("tree"); return; }
    const next = !treeOpen;
    setTreeOpen(next);
    save(TREE_KEY, next);
  }, [compact, openDrawer, treeOpen]);

  const toggleChat = useCallback(() => {
    if (compact) { openDrawer("chat"); return; }
    const next = toggleChatState(chat);
    setChat(next);
    if (shouldPersistChat(chat)) save(CHAT_KEY, next.chatPref);   // 분할 중 토글은 기억 안 함
  }, [compact, openDrawer, chat]);

  const reportPane = useCallback((docPath: string | null, split: boolean) => {
    setPaneDoc(docPath);
    setChat((current) => withSplit(current, split));
  }, []);

  // 드로어 포커스: 열리면 드로어로, 닫히면 연 버튼으로 복귀
  useEffect(() => {
    if (drawer === "tree") treeRef.current?.focus();
    else if (drawer === "chat") chatRef.current?.focus();
    else if (returnFocus.current) { returnFocus.current.focus(); returnFocus.current = null; }
  }, [drawer]);

  // 단축키: Ctrl+\ 트리 · Ctrl+/ 챗 (입력 중·키 반복 무시) · ESC = 열린 드로어 닫기(pane pop보다 우선)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawerOpen) { closeDrawer(); return; }
      if (event.repeat) return;
      const action = shortcutAction(event, event.target as HTMLElement | null);
      if (action === "tree") { event.preventDefault(); toggleTree(); }
      else if (action === "chat" && chatAvailable) { event.preventDefault(); toggleChat(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTree, toggleChat, chatAvailable, drawerOpen, closeDrawer]);

  const api: LayoutApi = useMemo(
    () => ({ treeOpen: treeVisible, chatOpen: chatVisible, chatAvailable, drawerOpen,
             toggleTree, toggleChat, reportPane }),
    [treeVisible, chatVisible, chatAvailable, drawerOpen, toggleTree, toggleChat, reportPane],
  );

  return (
    <LayoutContext.Provider value={api}>
      <div className={styles.shell}
           data-tree={treeOpen ? "open" : "closed"}
           data-chat={chatAvailable && isChatOpen(chat) ? "open" : "closed"}
           data-drawer={drawer}>
        {header}
        <div className={styles.body}>
          <aside id="layout-tree" ref={treeRef} tabIndex={-1} className={styles.tree}
                 hidden={!treeVisible} aria-label="문서 트리"
                 onClick={(event) => {   // 드로어 안 링크 이동 시 닫기(같은 경로 링크 포함 — 재마운트에 의존하지 않음)
                   if (compact && (event.target as HTMLElement).closest("a")) closeDrawer();
                 }}>
            {sidebar}
          </aside>
          <main className={wide ? styles.mainWide : styles.main}>
            {wide ? children : <div className={styles.reading}>{children}</div>}
          </main>
          {chatAvailable && (
            <aside id="layout-chat" ref={chatRef} tabIndex={-1} className={styles.chat}
                   hidden={!chatVisible} aria-label="문서 질문 챗">
              {/* 닫힘 = 미마운트 → 이력 fetch 없음 (데스크톱 열림은 SSR 포함 — 2단계와 동일) */}
              {chatVisible && <ChatPanel docPath={chatDoc} />}
            </aside>
          )}
        </div>
        {drawerOpen && <div className={styles.backdrop} onClick={closeDrawer} aria-hidden="true" />}
      </div>
    </LayoutContext.Provider>
  );
}
