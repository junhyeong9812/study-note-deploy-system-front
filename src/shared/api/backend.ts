/** backend BFF 헬퍼 — 봉투 해제 + requestId 발행(진입 서버 = front, 규약 v2).
 * backend는 X-Request-Id를 검증(acceptOrIssue)해 그대로 쓴다. */
import { log } from "@/shared/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export function newRequestId(): string {
  return "req-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export class BackendError extends Error {
  constructor(readonly code: string, readonly status: number, readonly detail?: string) {
    super(`${code} (${status})`);
  }
}

/** 봉투를 해제해 data를 반환. success=false·비봉투·네트워크 오류는 BackendError로 정규화 */
export async function backendGet<T>(path: string, requestId: string): Promise<T> {
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      headers: { "X-Request-Id": requestId },
      cache: "no-store",                       // 콘텐츠 최신성은 backend 캐시(트리)가 담당
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    await log(requestId, `backend unreachable ${path}: ${String(error).slice(0, 120)}`, "error");
    throw new BackendError("backend_unreachable", 503);
  }
  const body = await response.json().catch(() => null);
  if (!body || typeof body.success !== "boolean") {
    await log(requestId, `backend non-envelope ${path} status=${response.status}`, "error");
    throw new BackendError("invalid_envelope", response.status);
  }
  if (!body.success) {
    await log(requestId, `backend error ${path}: ${body.error?.code}`, "warning");
    throw new BackendError(body.error?.code ?? "unknown", response.status, body.error?.detail);
  }
  await log(requestId, `${path.split("?")[0]} ok ${Date.now() - startedAt}ms`);
  return body.data as T;
}

// ---- backend 계약 타입 (README의 API 계약) ----
export interface TreeDocRef { path: string; doc_kind: string; form: string }
export interface TreeNode {
  name: string; path: string; prev: string | null;   // 상위 폴더 경로 — 루트는 null (backend #21)
  docs: TreeDocRef[]; children: TreeNode[]; is_subject: boolean;
}
export interface TreeData { commit_sha: string; tree: TreeNode }
export interface DocData {
  path: string; topic: string; subject: string; doc_kind: string; form: string; markdown: string;
}
export interface SearchResult {
  path: string; chunk_no: number; heading: string; snippet: string; doc_kind: string; score: number;
}
export interface SearchData {
  rewrite_used: boolean; dense_used: boolean; results: SearchResult[]; request_id: string;
}
