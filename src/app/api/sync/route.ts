import { NextRequest, NextResponse } from "next/server";
import { newRequestId } from "@/lib/backend";
import { log } from "@/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

/** Actions → backend sync 중계. front는 비밀을 저장·검증하지 않는다 —
 * X-Sync-Secret을 그대로 넘기고 판정은 backend(진짜 소유자)가 한다. */
export async function POST(request: NextRequest) {
  const requestId = newRequestId();
  const secret = request.headers.get("x-sync-secret") ?? "";
  const body = await request.text();
  try {
    const response = await fetch(`${BACKEND_URL}/internal/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sync-Secret": secret },
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
