"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ClientMarkdown from "@/features/wiki/ui/ClientMarkdown";
import { useLayout } from "@/features/layout/ui/LayoutContext";
import { openLink, closeTop, visiblePanes } from "@/features/wiki/lib/paneStack";

type DocState = { markdown: string; loading: boolean; error?: string };

/** 스택 기반 2-pane 리더 — 단일 문서 보기에서 내부 링크를 옆 pane에 연다.
 * 초기 pane(A)는 SSR 콘텐츠 재사용, 이후 pane은 /api/doc 클라 fetch. 스택은 클라 상태(URL 미동기화).
 * 좁은 폭(모바일)에서는 top pane 하나만 표시(분할 폴백). */
export default function PaneReader({ initialPath, initialMarkdown }: {
  initialPath: string;
  initialMarkdown: string;
}) {
  const layout = useLayout();
  const [stack, setStack] = useState<string[]>([initialPath]);
  const [docs, setDocs] = useState<Record<string, DocState>>({
    [initialPath]: { markdown: initialMarkdown, loading: false },
  });
  const [narrow, setNarrow] = useState(false);
  const requested = useRef<Set<string>>(new Set([initialPath]));   // 요청/로드된 path (중복 fetch 차단)

  const fetchDoc = useCallback((path: string) => {
    requested.current.add(path);
    setDocs((prev) => ({ ...prev, [path]: { markdown: "", loading: true } }));
    fetch(`/api/doc?path=${encodeURIComponent(path)}`)
      .then(async (response) => {
        const body = await response.json();
        if (body?.success) return body.data.markdown as string;
        throw new Error(body?.error?.code ?? "load_failed");
      })
      .then((markdown) => setDocs((current) => ({ ...current, [path]: { markdown, loading: false } })))
      .catch((error) => {
        requested.current.delete(path);   // 에러는 재시도 가능하게 요청기록 해제 (F5)
        setDocs((current) => ({ ...current, [path]: { markdown: "", loading: false, error: String(error.message ?? error) } }));
      });
  }, []);

  const ensureDoc = useCallback((path: string) => {
    if (!requested.current.has(path)) fetchDoc(path);   // 부수효과를 업데이터 밖에서 (F4)
  }, [fetchDoc]);

  const openDoc = useCallback((paneIndex: number, path: string) => {
    ensureDoc(path);
    setStack((current) => openLink(current, paneIndex, path));
  }, [ensureDoc]);

  const close = useCallback(() => setStack((current) => closeTop(current)), []);

  // ESC = 오른쪽(top) pane 닫기
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // 좁은 폭 감지(모바일 폴백)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const allPanes = visiblePanes(stack);
  const panes = narrow ? allPanes.slice(-1) : allPanes;   // 좁으면 top 하나만 (F: 모바일 폴백)

  // 챗은 LayoutShell 소유 — 오른쪽(top) pane 문서와 분할 여부만 보고 (design.md §6)
  const topDoc = panes[panes.length - 1] ?? null;
  const reportPane = layout?.reportPane;
  const stackSplit = stack.length > 1;   // 분할 = 스택 기준(좁은 화면에서 1개만 보여도 분할)
  useEffect(() => { reportPane?.(topDoc, stackSplit); }, [reportPane, topDoc, stackSplit]);
  useEffect(() => () => { reportPane?.(null, false); }, [reportPane]);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - var(--header-h))" }}>
      {panes.map((path, index) => {
        const doc = docs[path];
        const isTop = index === panes.length - 1;
        const wikiHref = "/wiki/" + path.replace(/\.md$/, "");
        return (
          <section
            key={path + index}
            style={{ flex: 1, minWidth: 0, padding: "1.5rem 2rem", overflowY: "auto",
                     borderLeft: index > 0 ? "1px solid var(--line)" : undefined }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                          gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)",
                             overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {path.replace(/\.md$/, "")}
              </span>
              {stackSplit && isTop && (   /* 스택 기준 — 좁은 화면(1개 표시)에서도 돌아갈 수 있게 */
                <button onClick={close} aria-label="닫기 (ESC)" title="닫기 (ESC)"
                        style={{ border: "1px solid var(--line)", borderRadius: 6,
                                 padding: "0.1rem 0.5rem", cursor: "pointer", background: "var(--bg)" }}>
                  ✕
                </button>
              )}
            </div>
            <div style={{ maxWidth: 860 }}>
              {doc?.loading ? (
                <p style={{ color: "var(--muted)" }}>불러오는 중…</p>
              ) : doc?.error ? (
                <p style={{ color: "var(--muted)" }}>
                  문서를 열 수 없습니다 ({doc.error}).{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); fetchDoc(path); }}>다시 시도</a>
                  {" · "}
                  <a href={wikiHref}>페이지에서 열기</a>
                </p>
              ) : (
                <ClientMarkdown markdown={doc?.markdown ?? ""} docPath={path}
                                onOpenDoc={(next) => openDoc(index, next)} />
              )}
            </div>
          </section>
        );
      })}

    </div>
  );
}
