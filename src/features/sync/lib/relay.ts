import { newRequestId } from "@/shared/api/backend";
import { log } from "@/shared/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";
const MAX_BODY_BYTES = 4096;   // sync 본문은 {commit_sha, request_id, full} 뿐

export interface RelayResult { status: number; body: unknown }

/** Actions → backend sync 중계. front는 비밀을 저장·검증하지 않는다 — 판정은 소유자(backend). */
export async function relaySync(secret: string, declaredLength: number,
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
    const response = await fetch(`${BACKEND_URL}/internal/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sync-Secret": secret,
                 "X-Request-Id": requestId },
      body: body || "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = await response.json();
    await log(requestId, `sync relay -> ${response.status}`);
    return { status: response.status, body: responseBody };
  } catch (error) {
    await log(requestId, `sync relay failed: ${String(error).slice(0, 120)}`, "error");
    return { status: 503, body: { success: false, error: { code: "backend_unreachable" } } };
  }
}
