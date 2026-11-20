import { NextResponse } from "next/server";
import { relayAlertHealth } from "@/features/ops/lib/alertRelay";

export const dynamic = "force-dynamic";

/** app = 라우팅만 — 알림 서버 헬스 중계 */
export async function GET() {
  const result = await relayAlertHealth();
  return NextResponse.json(result.body as object, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
