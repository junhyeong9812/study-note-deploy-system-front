/** 테마 선호 — 자동(OS) / 라이트 / 다크. 순수 함수(테스트 이음새). */
export type ThemePref = "auto" | "light" | "dark";
export const THEME_KEY = "theme";

/** 저장값 해석 — 알 수 없거나 없으면 자동 */
export function parseTheme(value: string | null | undefined): ThemePref {
  return value === "light" || value === "dark" ? value : "auto";
}

/** 토글 순환: 자동 → 라이트 → 다크 → 자동 */
export function nextTheme(current: ThemePref): ThemePref {
  return current === "auto" ? "light" : current === "light" ? "dark" : "auto";
}

/** 첫 페인트 전 적용 스크립트(layout <head>) — 깜빡임 방지. 저장 실패는 무시(자동). */
export const THEME_BOOT_SCRIPT =
  `(function(){try{var t=localStorage.getItem("${THEME_KEY}");` +
  `if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
