import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

/** 노트 내 상대 md 링크를 /wiki 경로로 치환 — docPath 기준 상대 해석 */
function resolveHref(href: string | undefined, docDir: string): string {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href ?? "";
  const clean = href.replace(/\/$/, "").replace(/\.md$/, "");
  const stack = docDir === "" ? [] : docDir.split("/");
  for (const segment of clean.split("/")) {
    if (segment === "..") stack.pop();
    else if (segment !== ".") stack.push(segment);
  }
  return "/wiki/" + stack.join("/");
}

export default function Markdown({ markdown, docPath }: { markdown: string; docPath: string }) {
  const docDir = docPath.split("/").slice(0, -1).join("/");
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => <a href={resolveHref(href, docDir)}>{children}</a>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
