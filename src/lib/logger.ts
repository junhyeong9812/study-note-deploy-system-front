/** 로그 규약 — `requestId:server-name:message` (루트 docs/logging.md 정본).
 * stdout(항상) + Redis Stream XADD(실패 무해 — 짧은 타임아웃·백오프·예외 전량 흡수). */
import Redis from "ioredis";

const SERVER_NAME = process.env.SERVER_NAME ?? "front";
const LOG_REDIS_URL = process.env.LOG_REDIS_URL ?? "";
const LOG_STREAM = process.env.LOG_STREAM ?? "logs";
const BACKOFF_MS = 30_000;
const STREAM_MAXLEN = 10_000;

let redisClient: Redis | null = null;
let disabledUntil = 0;

export function formatLine(requestId: string, message: string): string {
  return `${requestId}:${SERVER_NAME}:${message}`;
}

export async function log(requestId: string, message: string, level = "info"): Promise<void> {
  const line = formatLine(requestId, message);
  if (level === "error") console.error(line);
  else if (level === "warning") console.warn(line);
  else console.log(line);

  if (!LOG_REDIS_URL || Date.now() < disabledUntil) return;
  try {
    if (!redisClient) {
      redisClient = new Redis(LOG_REDIS_URL, {
        connectTimeout: 300, commandTimeout: 300,
        maxRetriesPerRequest: 0, lazyConnect: false,
      });
      redisClient.on("error", () => { disabledUntil = Date.now() + BACKOFF_MS; });
    }
    await redisClient.xadd(LOG_STREAM, "MAXLEN", "~", STREAM_MAXLEN, "*", "level", level, "line", line);
  } catch {
    disabledUntil = Date.now() + BACKOFF_MS;   // 로그가 요청을 인질로 잡지 않는다
  }
}
