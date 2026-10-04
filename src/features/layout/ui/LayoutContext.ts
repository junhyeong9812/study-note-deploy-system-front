"use client";
import { createContext, useContext } from "react";

export type LayoutApi = {
  treeOpen: boolean;
  chatOpen: boolean;
  chatAvailable: boolean;          // 챗을 붙일 문서가 있는 페이지인가
  toggleTree: () => void;
  toggleChat: () => void;
  /** 분할 리더가 오른쪽(top) pane 문서와 분할 여부를 보고 — 챗이 그 문서를 따라간다 */
  reportPane: (docPath: string | null, split: boolean) => void;
};

export const LayoutContext = createContext<LayoutApi | null>(null);

/** Shell 밖(검색 페이지 등)에선 null — 소비자는 null이면 아무것도 안 그린다 */
export function useLayout(): LayoutApi | null {
  return useContext(LayoutContext);
}
