import { describe, it, expect } from "vitest";
import {
  parseStoredOpen, INITIAL_CHAT, isChatOpen, toggleChatState, withSplit, shortcutAction, shouldPersistChat, nextDrawer,
} from "./layoutState";

describe("layoutState", () => {
  it("저장값 해석 — 1/0 외엔 기본값", () => {
    expect(parseStoredOpen("1", false)).toBe(true);
    expect(parseStoredOpen("0", true)).toBe(false);
    expect(parseStoredOpen(null, true)).toBe(true);
    expect(parseStoredOpen("garbage", false)).toBe(false);
  });

  it("단일 보기: 챗 기본 열림, 토글은 선호를 뒤집는다", () => {
    expect(isChatOpen(INITIAL_CHAT)).toBe(true);
    const closed = toggleChatState(INITIAL_CHAT);
    expect(closed.chatPref).toBe(false);
    expect(isChatOpen(closed)).toBe(false);
  });

  it("분할 진입 시 챗 닫힘(선호는 보존), 분할 중 토글은 선호를 안 건드림", () => {
    const split = withSplit(INITIAL_CHAT, true);
    expect(isChatOpen(split)).toBe(false);
    expect(split.chatPref).toBe(true);
    const opened = toggleChatState(split);
    expect(isChatOpen(opened)).toBe(true);
    expect(opened.chatPref).toBe(true);
  });

  it("분할 해제 시 선호로 복귀, 다시 분할하면 분할용 열림은 초기화", () => {
    const opened = toggleChatState(withSplit(INITIAL_CHAT, true));
    const single = withSplit(opened, false);
    expect(isChatOpen(single)).toBe(true);
    expect(isChatOpen(withSplit(single, true))).toBe(false);
  });

  it("선호 저장은 단일 보기에서 토글할 때만", () => {
    expect(shouldPersistChat(INITIAL_CHAT)).toBe(true);
    expect(shouldPersistChat(withSplit(INITIAL_CHAT, true))).toBe(false);
  });

  it("분할 여부가 같으면 상태 그대로(불필요한 리렌더 방지)", () => {
    expect(withSplit(INITIAL_CHAT, false)).toBe(INITIAL_CHAT);
  });

  it("단축키 — Ctrl+\\ 트리, Ctrl+/ 챗, 입력 중·Alt 조합·Ctrl 없음은 무시", () => {
    expect(shortcutAction({ key: "\\", ctrlKey: true }, { tagName: "BODY" })).toBe("tree");
    expect(shortcutAction({ key: "/", ctrlKey: true }, { tagName: "DIV" })).toBe("chat");
    expect(shortcutAction({ key: "/", ctrlKey: true }, { tagName: "INPUT" })).toBe(null);
    expect(shortcutAction({ key: "/", ctrlKey: true }, { tagName: "TEXTAREA" })).toBe(null);
    expect(shortcutAction({ key: "\\", ctrlKey: true }, { tagName: "DIV", isContentEditable: true })).toBe(null);
    expect(shortcutAction({ key: "/", ctrlKey: false }, { tagName: "BODY" })).toBe(null);
    expect(shortcutAction({ key: "/", ctrlKey: true, altKey: true }, { tagName: "BODY" })).toBe(null);
    expect(shortcutAction({ key: "a", ctrlKey: true }, { tagName: "BODY" })).toBe(null);
  });

  it("드로어 — 같은 버튼은 닫기, 다른 버튼은 전환, 닫힘에서 열기", () => {
    expect(nextDrawer("none", "tree")).toBe("tree");
    expect(nextDrawer("tree", "tree")).toBe("none");
    expect(nextDrawer("tree", "chat")).toBe("chat");
    expect(nextDrawer("chat", "chat")).toBe("none");
  });
});
