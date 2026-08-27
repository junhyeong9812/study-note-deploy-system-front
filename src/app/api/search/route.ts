import { NextRequest, NextResponse } from "next/server";
import { newRequestId } from "@/lib/backend";
import { log } from "@/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** 검색 BFF — 브라우저는 backend를 모른다. 봉투는 해제하지 않고 그대로 전달(소비자 분기 통일). */
export async function GET(request: NextRequest) {
  const requestId = newRequestId();
  const search = request.nextUrl.searchParams;
  const upstream = new URLSearchParams();
  for (const key of ["q", "topic", "size"]) {
    const value = search.get(key);
    if (value) upstream.set(key, value);
  }
  for (const kind of search.getAll("doc_kind")) upstream.append("doc_kind", kind);
  try {
    const response = await fetch(`${BACKEND_URL}/api/search?${upstream}`, {
      headers: { "X-Request-Id": requestId },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json();
    await log(requestId, `search proxy q=${(search.get("q") ?? "").slice(0, 40)} -> ${response.status}`);
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    await log(requestId, `search proxy failed: ${String(error).slice(0, 120)}`, "error");
    return NextResponse.json(
      { success: false, error: { code: "backend_unreachable" } }, { status: 503 });
  }
}
