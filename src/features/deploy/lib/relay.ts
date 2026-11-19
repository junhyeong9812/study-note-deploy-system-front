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

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Actions → ci-cd master 배포 상태 조회 중계. 접수 중계와 같은 방식 — 비밀은 그대로 넘기기만 한다. */
export async function relayDeploymentStatus(secret: string, deployRequestId: string): Promise<RelayResult> {
  if (!REQUEST_ID_PATTERN.test(deployRequestId)) {
    return { status: 422, body: { success: false, error: { code: "invalid_request", detail: "request id" } } };
  }
  try {
    const response = await fetch(`${MASTER_URL}/deploys/${deployRequestId}`, {
      headers: { "X-Deploy-Secret": secret },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return { status: response.status, body: await response.json() };
  } catch (error) {
    // 10초 간격으로 조회되므로 성공은 기록하지 않는다 — 실패만 남긴다
    await log(deployRequestId, `deploy status relay failed: ${String(error).slice(0, 120)}`, "error");
    return { status: 503, body: { success: false, error: { code: "master_unreachable" } } };
  }
}
