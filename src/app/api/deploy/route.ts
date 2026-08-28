import { NextRequest, NextResponse } from "next/server";
import { relayDeploy } from "@/features/deploy/lib/relay";

/** app = 라우팅만 — HTTP 껍데기, 로직은 feature */
export async function POST(request: NextRequest) {
  const result = await relayDeploy(
    request.headers.get("x-deploy-secret") ?? "",
    Number(request.headers.get("content-length") ?? 0),
    () => request.text(),
  );
  return NextResponse.json(result.body as object, { status: result.status });
}
