"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { resolveHref } from "@/features/wiki/lib/links";

/** 클라이언트 Markdown — 내부 문서 링크(/wiki/…)는 onOpenDoc로 인터셉트(pane 열기),
 * 외부·앵커 링크는 기본 동작. (서버 Markdown.tsx는 SSR 렌더용으로 유지) */
export default function ClientMarkdown({ markdown, docPath, onOpenDoc }: {
  markdown: string;
  docPath: string;
  onOpenDoc: (docPath: string) => void;
}) {
  const docDir = docPath.split("/").slice(0, -1).join("/");
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => {
            const resolved = resolveHref(href, docDir);
            if (resolved.startsWith("/wiki/")) {
              return (
                <a
                  href={resolved}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey) return; // 새 탭 등은 기본 동작
                    event.preventDefault();
                    const path = resolved.replace(/^\/wiki\//, "").split(/[#?]/)[0] + ".md";
                    onOpenDoc(path);
                  }}
                >
                  {children}
                </a>
              );
            }
            const external = /^https?:/.test(resolved);
            return (
              <a href={resolved} target={external ? "_blank" : undefined} rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
