import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "study-note",
  description: "공부 노트 위키 — 인출 학습 저장소",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
