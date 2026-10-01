/** 분할 리더 스택 — 순수 함수(UI와 분리, 테스트 이음새).
 * 표시 = 스택의 마지막 1~2개. 왼쪽 pane 링크 = top 교체 / 오른쪽 pane 링크 = push / 닫기 = pop. */

/** 링크 클릭 전이. paneIndex = 보이는 pane에서의 위치(0=왼쪽, 1=오른쪽). */
export function openLink(stack: string[], paneIndex: number, path: string): string[] {
  if (stack.length <= 1) return [...stack, path];            // 단일에서 클릭 = push (A → A|B)
  if (paneIndex === 0) return [...stack.slice(0, -1), path];  // 왼쪽 = 스택 top 교체 (A|B → A|C)
  return [...stack, path];                                    // 오른쪽 = push·이동 (A|B → B|D)
}

/** 오른쪽(top) pane 닫기 = pop. 단일(길이 1)이면 유지. */
export function closeTop(stack: string[]): string[] {
  return stack.length > 1 ? stack.slice(0, -1) : stack;
}

/** 현재 보이는 pane들(마지막 1~2개). */
export function visiblePanes(stack: string[]): string[] {
  return stack.length <= 1 ? stack.slice(-1) : stack.slice(-2);
}
