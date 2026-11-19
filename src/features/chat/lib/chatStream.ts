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
    buffer = (buffer + chunk).replace(/\r\n/g, "\n");   // 이어 붙인 뒤 정규화 — \r 과 \n 이 조각 경계에서 갈려도 된다
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

/** 대기 문구 — position은 llm이 알려준 대기 순번(1부터) */
export function queuedNotice(position: number): string {
  return `대기 중 (앞에 ${position}명)`;
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

/** 답변 말풍선의 상태 — 이벤트 하나를 받을 때마다 다음 상태로 넘어간다 */
export interface AnswerState {
  content: string;       // 말풍선에 보이는 글 (대기·오류 문구 또는 답변)
  answering: boolean;    // 답변 글자가 한 번이라도 도착했나 — 그 전의 content는 상태 문구다
  finished: boolean;     // done 또는 error로 끝났나
}

export const initialAnswerState: AnswerState = { content: "", answering: false, finished: false };

export function applyStreamEvent(state: AnswerState, event: ChatStreamEvent): AnswerState {
  if (state.finished) return state;
  switch (event.type) {
    case "queued":
      return state.answering ? state : { ...state, content: queuedNotice(event.position) };
    case "start":
      return state.answering ? state : { ...state, content: "" };
    case "token":
      return { ...state, answering: true, content: (state.answering ? state.content : "") + event.text };
    case "error": {
      const notice = errorNotice(event.code);
      // 답변이 나오다 끊겼으면 받은 글은 두고 아래에 알린다
      return { ...state, finished: true, content: state.answering ? `${state.content}\n\n${notice}` : notice };
    }
    case "done":
      return { ...state, finished: true };
  }
}

/** 끝 표시(done·error) 없이 스트림이 닫혔을 때 */
export function applyStreamCut(state: AnswerState): AnswerState {
  return state.finished ? state : applyStreamEvent(state, { type: "error", code: "internal" });
}
