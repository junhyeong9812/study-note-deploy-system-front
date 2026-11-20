import { NextRequest, NextResponse } from "next/server";
import { relayAlertEvent } from "@/features/ops/lib/alertRelay";

/** app = 라우팅만 — 알림 서버 사건 접수 중계 */
export async function POST(request: NextRequest) {
  const result = await relayAlertEvent(
    request.headers.get("x-alert-secret") ?? "",
    Number(request.headers.get("content-length") ?? 0),
    () => request.text(),
  );
  return NextResponse.json(result.body as object, { status: result.status });
}
