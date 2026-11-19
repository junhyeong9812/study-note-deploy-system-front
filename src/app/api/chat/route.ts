import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** app = 라우팅만 — 채팅 스트림 패스스루(쿠키 양방향 전달이 핵심: 세션은 backend가 발급).
 * 형식(SSE·text)은 Accept로 backend가 정한다 — 여기서는 그대로 흘린다. */
export async function POST(request: NextRequest) {
  const upstream = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: request.headers.get("accept") ?? "*/*",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: await request.text(),
    // 브라우저가 떠나면 backend 연결도 끊는다 — 대기 자리를 붙잡아 두지 않게
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(180_000)]),
  });
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "text/plain; charset=utf-8",
    "Cache-Control": "no-store, no-transform",   // no-transform — 중간에서 압축하며 모아두지 않게
    "X-Accel-Buffering": "no",                 // 엣지 nginx가 이벤트를 모아두지 않게
  });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) headers.set("set-cookie", setCookie);
  return new Response(upstream.body, { status: upstream.status, headers });
}
