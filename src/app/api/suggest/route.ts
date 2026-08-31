import { NextRequest, NextResponse } from "next/server";
import { newRequestId } from "@/shared/api/backend";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** app = 라우팅만 — ES 자동완성 프록시 (봉투 그대로) */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/suggest?q=${encodeURIComponent(query)}`,
      { headers: { "X-Request-Id": newRequestId() }, signal: AbortSignal.timeout(5_000) },
    );
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "backend_unreachable" } }, { status: 503 });
  }
}
