import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** app = 라우팅만 — 채팅 스트림 패스스루(쿠키 양방향 전달이 핵심: 세션은 backend가 발급) */
export async function POST(request: NextRequest) {
  const upstream = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: await request.text(),
    signal: AbortSignal.timeout(180_000),
  });
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8" });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) headers.set("set-cookie", setCookie);
  return new Response(upstream.body, { status: upstream.status, headers });
}
