import { NextRequest, NextResponse } from "next/server";
import { newRequestId } from "@/lib/backend";
import { log } from "@/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** Actions → backend sync 중계. front는 비밀을 저장·검증하지 않는다 —
 * X-Sync-Secret을 그대로 넘기고 판정은 backend(진짜 소유자)가 한다. */
const MAX_BODY_BYTES = 4096;   // sync 본문은 {commit_sha, request_id, full} 뿐 — 그 이상은 거절

export async function POST(request: NextRequest) {
  const requestId = newRequestId();
  const secret = request.headers.get("x-sync-secret") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: { code: "invalid_request", detail: "body too large" } }, { status: 413 });
  }
  try {
    const body = await request.text();                    // 공개 경로 — try 안에서, 상한 재확인
    if (body.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: { code: "invalid_request", detail: "body too large" } }, { status: 413 });
    }
    const response = await fetch(`${BACKEND_URL}/internal/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sync-Secret": secret,
                 "X-Request-Id": requestId },             // 규약: 진입 서버 발행 id 전파
      body: body || "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = await response.json();
    await log(requestId, `sync relay -> ${response.status}`);
    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    await log(requestId, `sync relay failed: ${String(error).slice(0, 120)}`, "error");
    return NextResponse.json(
      { success: false, error: { code: "backend_unreachable" } }, { status: 503 });
  }
}
