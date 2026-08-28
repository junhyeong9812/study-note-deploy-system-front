import { newRequestId } from "@/shared/api/backend";
import { log } from "@/shared/lib/logger";

const MASTER_URL = process.env.DEPLOY_MASTER_URL ?? "http://localhost:15000";
const MAX_BODY_BYTES = 4096;

export interface RelayResult { status: number; body: unknown }

/** Actions → ci-cd master 배포 중계. sync와 동형 — front는 비밀을 저장·검증하지 않는다. */
export async function relayDeploy(secret: string, declaredLength: number,
                                  readBody: () => Promise<string>): Promise<RelayResult> {
  const requestId = newRequestId();
  if (declaredLength > MAX_BODY_BYTES) {
    return { status: 413, body: { success: false, error: { code: "invalid_request", detail: "body too large" } } };
  }
  try {
    const body = await readBody();
    if (body.length > MAX_BODY_BYTES) {
      return { status: 413, body: { success: false, error: { code: "invalid_request", detail: "body too large" } } };
    }
    const response = await fetch(`${MASTER_URL}/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Deploy-Secret": secret,
                 "X-Request-Id": requestId },
      body: body || "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = await response.json();
    await log(requestId, `deploy relay -> ${response.status}`);
    return { status: response.status, body: responseBody };
  } catch (error) {
    await log(requestId, `deploy relay failed: ${String(error).slice(0, 120)}`, "error");
    return { status: 503, body: { success: false, error: { code: "master_unreachable" } } };
  }
}
