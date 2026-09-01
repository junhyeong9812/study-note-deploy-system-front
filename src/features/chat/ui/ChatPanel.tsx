"use client";
import { useEffect, useRef, useState } from "react";

interface ChatMessage { role: string; content: string; source?: "local" | "claude" }

/** 우측 채팅 패널 — 현재 문서에 대해 묻는다. 스트림 타자 렌더 + 에스컬레이션 수동 트리거. */
export default function ChatPanel({ docPath }: { docPath: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {                                    // 페이지(doc)별 이력 로드
    setMessages([]);
    fetch(`/api/chat/history?doc_path=${encodeURIComponent(docPath)}`)
      .then((response) => response.json())
      .then((body) => { if (body.success) setMessages(body.data.messages); })
      .catch(() => {});
  }, [docPath]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput(""); setBusy(true);
    setMessages((previous) => [...previous,
      { role: "user", content: question }, { role: "assistant", content: "" }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_path: docPath, question }),
      });
      if (!response.ok || !response.body) throw new Error(String(response.status));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setMessages((previous) => {
          const next = [...previous];
          next[next.length - 1] = { ...next[next.length - 1],
            content: next[next.length - 1].content + token };
          return next;
        });
      }
    } catch {
      setMessages((previous) => {
        const next = [...previous];
        next[next.length - 1] = { role: "assistant",
          content: "응답에 실패했습니다. 잠시 후 다시 시도해주세요." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  const escalate = async () => {
    const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.content;
    if (!lastQuestion || busy) return;
    setBusy(true);
    setMessages((previous) => [...previous,
      { role: "assistant", content: "Claude에게 물어보는 중… (수십 초 걸릴 수 있어요)", source: "claude" }]);
    try {
      const response = await fetch("/api/chat/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_path: docPath, question: lastQuestion }),
      });
      const body = await response.json();
      setMessages((previous) => {
        const next = [...previous];
        next[next.length - 1] = body.success
          ? { role: "assistant", content: body.data.answer, source: "claude" }
          : { role: "assistant", source: "claude",
              content: body.error?.code === "escalate_unavailable"
                ? "지금은 로컬 답변만 가능합니다 (Claude 브리지 오프라인)."
                : "Claude 응답에 실패했습니다." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  const lastIsAnswer = messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].source !== "claude" && !busy;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 53px)",
                  position: "sticky", top: 53 }}>
      <div style={{ padding: "0.7rem 1rem", borderBottom: "1px solid var(--line)",
                    fontWeight: 700, fontSize: "0.9rem" }}>
        문서에게 질문
        <div style={{ fontWeight: 400, fontSize: "0.72rem", color: "var(--muted)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {docPath}
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0.8rem 1rem",
                                    display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
            이 문서 내용에 대해 물어보세요. 답변은 문서를 근거로 로컬 모델이 만듭니다.
          </p>
        )}
        {messages.map((message, index) => (
          <div key={index} style={{
            alignSelf: message.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "92%", padding: "0.5rem 0.75rem", borderRadius: 10,
            fontSize: "0.84rem", whiteSpace: "pre-wrap", lineHeight: 1.55,
            background: message.role === "user" ? "var(--accent-bg)" : "var(--code-bg)",
            border: message.source === "claude" ? "1px solid var(--accent)" : "none",
          }}>
            {message.source === "claude" && (
              <div style={{ fontSize: "0.68rem", color: "var(--accent)", marginBottom: 3 }}>Claude</div>
            )}
            {message.content}
            {busy && index === messages.length - 1 && message.role === "assistant" && "▌"}
          </div>
        ))}
        {lastIsAnswer && (
          <button onClick={escalate}
            style={{ alignSelf: "flex-start", fontSize: "0.75rem", color: "var(--accent)",
                     background: "none", border: "1px solid var(--line)", borderRadius: 6,
                     padding: "0.25rem 0.6rem", cursor: "pointer" }}>
            더 정확한 답변 (Claude)
          </button>
        )}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); send(); }}
        style={{ display: "flex", gap: 6, padding: "0.7rem 0.9rem",
                 borderTop: "1px solid var(--line)" }}>
        <input value={input} onChange={(event) => setInput(event.target.value)}
          placeholder={busy ? "답변 생성 중…" : "질문 입력"}
          disabled={busy}
          style={{ flex: 1, padding: "0.5rem 0.8rem", borderRadius: 8,
                   border: "1px solid var(--line)", background: "var(--code-bg)",
                   color: "var(--fg)", fontSize: "0.85rem", outline: "none" }} />
        <button type="submit" disabled={busy} aria-label="보내기"
          style={{ border: "none", borderRadius: 8, cursor: busy ? "default" : "pointer",
                   background: "var(--accent)", color: "#fff", width: 38, fontSize: "1rem" }}>
          →
        </button>
      </form>
    </div>
  );
}
