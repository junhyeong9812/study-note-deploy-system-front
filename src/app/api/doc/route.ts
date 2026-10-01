import { NextRequest, NextResponse } from "next/server";
import { newRequestId } from "@/shared/api/backend";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** app = 라우팅만 — 분할 리더용 문서 원문 프록시 (봉투 그대로).
 * 경로 검증(트래버설·denylist)은 backend PathGuard가 담당 — front는 통과만. */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/doc?path=${encodeURIComponent(path)}`,
      { headers: { "X-Request-Id": newRequestId() }, signal: AbortSignal.timeout(10_000) },
    );
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "backend_unreachable" } }, { status: 503 });
  }
}
