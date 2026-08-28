import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { resolveHref } from "@/features/wiki/lib/links";



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
