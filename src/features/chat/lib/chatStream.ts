/** 채팅 SSE 스트림 — backend가 보내는 이벤트(queued·start·token·error·done)를 읽고 화면 문구로 옮긴다. */

export type ChatStreamEvent =
  | { type: "queued"; position: number }
  | { type: "start" }
  | { type: "token"; text: string }
  | { type: "error"; code: string }
  | { type: "done" };

function toEvent(name: string, data: string): ChatStreamEvent | null {
  let payload: Record<string, unknown> = {};
  try { payload = data ? JSON.parse(data) : {}; } catch { return null; }
  switch (name) {
    case "queued": return { type: "queued", position: Number(payload.position) || 1 };
    case "start": return { type: "start" };
    case "token": return typeof payload.text === "string" ? { type: "token", text: payload.text } : null;
    case "error": return { type: "error", code: typeof payload.code === "string" ? payload.code : "internal" };
    case "done": return { type: "done" };
    default: return null;                       // 계약 밖 이벤트·주석 줄은 버린다
  }
}

/** 조각나서 도착하는 SSE 텍스트를 이어 붙여 완성된 이벤트만 돌려준다(빈 줄이 이벤트 경계). */
export function createSseParser() {
  let buffer = "";
  return function feed(chunk: string): ChatStreamEvent[] {
    buffer += chunk.replace(/\r\n/g, "\n");
    const events: ChatStreamEvent[] = [];
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      let name = "message";
      const dataLines: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) name = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
      }
      const event = toEvent(name, dataLines.join("\n"));
      if (event) events.push(event);
      boundary = buffer.indexOf("\n\n");
    }
    return events;
  };
}

/** 대기 문구 — position은 줄에서의 순번(1 = 다음 차례) */
export function queuedNotice(position: number): string {
  return position <= 1 ? "대기 중 (다음 차례예요)" : `대기 중 (앞에 ${position - 1}명)`;
}

/** 오류 문구 — 줄이 밀린 것과 서버가 꺼진 것을 구별한다 */
export function errorNotice(code: string): string {
  switch (code) {
    case "queue_full":
    case "queue_timeout":
      return "지금 질문이 몰려 있어요. 잠시 후 다시 시도해주세요.";
    case "llm_unreachable":
      return "로컬 모델 서버가 꺼져 있어요. 아래 Claude 버튼으로 물어볼 수 있어요.";
    default:
      return "응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
  }
}
