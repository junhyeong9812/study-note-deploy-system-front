/** 레이아웃 패널(트리·챗) 상태 — 순수 함수(테스트 이음새). */
export const TREE_KEY = "layout.tree";
export const CHAT_KEY = "layout.chat";

/** 저장값 "1"/"0" 해석 — 그 외(없음·손상)는 기본값 */
export function parseStoredOpen(value: string | null | undefined, fallback: boolean): boolean {
  return value === "1" ? true : value === "0" ? false : fallback;
}

/** 챗 상태 — 단일 보기 선호(저장됨)와 분할 중 열림(저장 안 함)을 분리 */
export type ChatState = { split: boolean; chatPref: boolean; splitChatOpen: boolean };

export const INITIAL_CHAT: ChatState = { split: false, chatPref: true, splitChatOpen: false };

/** 지금 챗이 열려 있나 — 분할 중엔 splitChatOpen(기본 닫힘), 아니면 저장된 선호 */
export function isChatOpen(state: ChatState): boolean {
  return state.split ? state.splitChatOpen : state.chatPref;
}

/** 토글 — 분할 중엔 분할용 값만, 단일이면 선호를 뒤집는다 */
export function toggleChatState(state: ChatState): ChatState {
  return state.split
    ? { ...state, splitChatOpen: !state.splitChatOpen }
    : { ...state, chatPref: !state.chatPref };
}

/** 토글 직전 상태 기준으로 선호를 저장할지 — 분할 중 토글은 기억하지 않는다 */
export function shouldPersistChat(before: ChatState): boolean {
  return !before.split;
}

/** 분할 여부 변경 — 바뀔 때마다 분할용 열림은 닫힘으로 초기화(선호는 보존) */
export function withSplit(state: ChatState, split: boolean): ChatState {
  return split === state.split ? state : { ...state, split, splitChatOpen: false };
}

type KeyLike = { key: string; ctrlKey: boolean; altKey?: boolean };
type TargetLike = { tagName?: string; isContentEditable?: boolean } | null | undefined;

/** 단축키 판정 — Ctrl+\ 트리, Ctrl+/ 챗. 입력 중(input·textarea·select·contenteditable)엔 무시 */
export function shortcutAction(event: KeyLike, target: TargetLike): "tree" | "chat" | null {
  if (!event.ctrlKey || event.altKey) return null;
  const tag = target?.tagName?.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return null;
  if (event.key === "\\") return "tree";
  if (event.key === "/") return "chat";
  return null;
}

/** 좁은 화면(태블릿·모바일) 드로어 — 한 번에 하나만. 기억하지 않음(매번 닫힘 시작) */
export type Drawer = "none" | "tree" | "chat";

/** 같은 드로어 버튼 = 닫기, 다른 버튼 = 그 드로어로 전환 */
export function nextDrawer(current: Drawer, pressed: "tree" | "chat"): Drawer {
  return current === pressed ? "none" : pressed;
}

/** 좁은 화면 판정 기준 폭 — 이 미만이면 드로어 모드 (CSS 미디어쿼리 1199px과 짝) */
export const COMPACT_MAX = 1199;
