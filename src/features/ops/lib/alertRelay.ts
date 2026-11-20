import { log } from "@/shared/lib/logger";
import { newRequestId } from "@/shared/api/backend";

const ALERT_URL = process.env.ALERT_URL ?? "";
const MAX_BODY_BYTES = 4096;

export interface RelayResult { status: number; body: unknown }

const unreachable: RelayResult = { status: 503, body: { success: false, error: { code: "alert_unreachable" } } };

/** 집 밖의 감시자(엣지)가 알림 서버가 살아 있는지 보는 길 — 알림 서버의 헬스를 그대로 전한다. */
export async function relayAlertHealth(): Promise<RelayResult> {
  if (!ALERT_URL) return unreachable;
  try {
    const response = await fetch(`${ALERT_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    return { status: response.status, body: await response.json() };
  } catch {
    return unreachable;   // 1분마다 불리므로 기록하지 않는다 — 판단은 부르는 쪽(감시자)이 한다
  }
}

/** 집 밖에서 온 사건(엣지가 잰 끊김 등)을 알림 서버로 넘긴다. 배포 중계와 같은 방식 — 비밀은 저장·검증하지 않고 그대로 넘긴다. */
export async function relayAlertEvent(secret: string, declaredLength: number,
                                      readBody: () => Promise<string>): Promise<RelayResult> {
  const requestId = newRequestId();
  if (declaredLength > MAX_BODY_BYTES) {
    return { status: 413, body: { success: false, error: { code: "invalid_request", detail: "body too large" } } };
  }
  if (!ALERT_URL) return unreachable;
  try {
    const body = await readBody();
    if (body.length > MAX_BODY_BYTES) {
      return { status: 413, body: { success: false, error: { code: "invalid_request", detail: "body too large" } } };
    }
    const response = await fetch(`${ALERT_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Alert-Secret": secret },
      body: body || "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = await response.json();
    await log(requestId, `alert event relay -> ${response.status}`);
    return { status: response.status, body: responseBody };
  } catch (error) {
    await log(requestId, `alert event relay failed: ${String(error).slice(0, 120)}`, "error");
    return unreachable;
  }
}
