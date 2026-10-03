"use client";
import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";
import { THEME_KEY, nextTheme, parseTheme, type ThemePref } from "@/shared/lib/theme";

const ICON: Record<ThemePref, string> = { auto: "🖥", light: "☀", dark: "🌙" };
const NAME: Record<ThemePref, string> = { auto: "자동", light: "라이트", dark: "다크" };

/** 다크모드 토글 — 자동(OS)/라이트/다크. 선택은 localStorage, 적용은 <html data-theme>. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePref>("auto");   // 서버·첫 렌더 = 자동(일치), 마운트 후 저장값

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* 저장 차단 — 자동 */ }
    setTheme(parseTheme(saved));
  }, []);

  const change = () => {
    const next = nextTheme(theme);
    setTheme(next);
    const root = document.documentElement;
    if (next === "auto") delete root.dataset.theme;
    else root.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* 저장 차단 — 이번 세션만 적용 */ }
  };

  return (
    <button onClick={change} className={styles.toggle}
            aria-label={`테마 ${NAME[theme]}, 눌러서 변경`} title="테마 변경 (자동 → 라이트 → 다크)">
      <span aria-hidden="true">{ICON[theme]}</span> {NAME[theme]}
    </button>
  );
}
