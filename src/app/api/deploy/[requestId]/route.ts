import { NextRequest, NextResponse } from "next/server";
import { relayDeploymentStatus } from "@/features/deploy/lib/relay";

/** app = 라우팅만 — 배포 한 건의 상태 조회 */
export async function GET(request: NextRequest, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  const result = await relayDeploymentStatus(request.headers.get("x-deploy-secret") ?? "", requestId);
  return NextResponse.json(result.body as object, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
