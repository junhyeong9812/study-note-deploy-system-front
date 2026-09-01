import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function POST(request: NextRequest) {
  const upstream = await fetch(`${BACKEND_URL}/api/chat/escalate`, {
    method: "POST",
    headers: { "Content-Type": "application/json",
               cookie: request.headers.get("cookie") ?? "" },
    body: await request.text(),
    signal: AbortSignal.timeout(180_000),
  });
  const response = NextResponse.json(await upstream.json(), { status: upstream.status });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
