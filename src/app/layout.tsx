import type { ReactNode } from "react";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/shared/lib/theme";

export const metadata = {
  title: "study-note",
  description: "공부 노트 위키 — 인출 학습 저장소",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme은 첫 페인트 전 스크립트가 붙이므로 서버 HTML과 다를 수 있음 → 경고 억제
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
