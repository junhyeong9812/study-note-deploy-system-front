import { describe, expect, it } from "vitest";
import {
  applyStreamCut, applyStreamEvent, createSseParser, errorNotice, initialAnswerState, queuedNotice,
  type ChatStreamEvent,
} from "./chatStream";

describe("createSseParser", () => {
  it("다섯 종류 이벤트를 순서대로 읽는다", () => {
    const feed = createSseParser();
    const events = feed(
      'event:queued\ndata:{"position":2}\n\n' +
      "event:start\ndata:{}\n\n" +
      'event:token\ndata:{"text":"안녕\\n하세요"}\n\n' +
      "event:done\ndata:{}\n\n",
    );
    expect(events).toEqual([
      { type: "queued", position: 2 },
      { type: "start" },
      { type: "token", text: "안녕\n하세요" },
      { type: "done" },
    ]);
  });

  it("이벤트가 조각나 도착해도 완성된 뒤에만 내보낸다", () => {
    const feed = createSseParser();
    expect(feed('event:token\ndata:{"te')).toEqual([]);
    expect(feed('xt":"가"}\n')).toEqual([]);
    expect(feed("\nevent:error\ndata:{\"code\":\"queue_full\"}\n\n")).toEqual([
      { type: "token", text: "가" },
      { type: "error", code: "queue_full" },
    ]);
  });

  it("CRLF가 조각 경계에서 갈려도 이벤트 경계를 찾는다", () => {
    const feed = createSseParser();
    expect(feed("event:start\r\ndata:{}\r")).toEqual([]);
    expect(feed("\n\r")).toEqual([]);
    expect(feed("\n")).toEqual([{ type: "start" }]);
  });

  it("CRLF 경계와 data 뒤 공백 한 칸을 받아들인다", () => {
    const feed = createSseParser();
    expect(feed('event: token\r\ndata: {"text":" 앞 공백"}\r\n\r\n'))
      .toEqual([{ type: "token", text: " 앞 공백" }]);
  });

  it("계약 밖 이벤트·주석·깨진 JSON은 버린다", () => {
    const feed = createSseParser();
    expect(feed(": ping\n\nevent:unknown\ndata:{}\n\nevent:token\ndata:{broken\n\n")).toEqual([]);
  });
});

describe("화면 문구", () => {
  it("대기 순번을 그대로 앞사람 수로 보여준다", () => {
    expect(queuedNotice(1)).toBe("대기 중 (앞에 1명)");
    expect(queuedNotice(2)).toBe("대기 중 (앞에 2명)");
  });

  it("줄이 밀린 것과 서버가 꺼진 것을 다른 문구로 알린다", () => {
    const crowded = errorNotice("queue_full");
    expect(errorNotice("queue_timeout")).toBe(crowded);
    expect(errorNotice("llm_unreachable")).not.toBe(crowded);
    expect(errorNotice("llm_unreachable")).toContain("꺼져");
    expect(errorNotice("upstream")).toBe(errorNotice("internal"));
  });
});

describe("applyStreamEvent — 답변 말풍선 상태 전이", () => {
  const run = (events: ChatStreamEvent[]) => events.reduce(applyStreamEvent, initialAnswerState);

  it("대기 → 시작 → 토큰 → 완료: 대기 문구가 답변으로 바뀐다", () => {
    expect(run([{ type: "queued", position: 2 }]).content).toBe("대기 중 (앞에 2명)");
    expect(run([{ type: "queued", position: 2 }, { type: "queued", position: 1 }]).content)
      .toBe("대기 중 (앞에 1명)");
    expect(run([{ type: "queued", position: 1 }, { type: "start" }]).content).toBe("");
    expect(run([{ type: "queued", position: 1 }, { type: "start" },
      { type: "token", text: "가" }, { type: "token", text: "나" }, { type: "done" }]))
      .toEqual({ content: "가나", answering: true, finished: true });
  });

  it("start 없이 토큰이 와도 대기 문구에 이어 붙지 않는다", () => {
    expect(run([{ type: "queued", position: 1 }, { type: "token", text: "답" }]).content).toBe("답");
  });

  it("대기 중 오류는 문구만, 답변 중 오류는 받은 글 아래에 알린다", () => {
    expect(run([{ type: "queued", position: 3 }, { type: "error", code: "queue_timeout" }]))
      .toEqual({ content: errorNotice("queue_timeout"), answering: false, finished: true });
    expect(run([{ type: "start" }, { type: "token", text: "반쯤" }, { type: "error", code: "upstream" }]).content)
      .toBe(`반쯤\n\n${errorNotice("upstream")}`);
  });

  it("서버 꺼짐은 대기·혼잡과 다른 문구로 끝난다", () => {
    const down = run([{ type: "error", code: "llm_unreachable" }]);
    expect(down.finished).toBe(true);
    expect(down.content).toBe(errorNotice("llm_unreachable"));
    expect(down.content).not.toBe(errorNotice("queue_full"));
  });

  it("끝난 뒤에 온 이벤트는 무시한다", () => {
    const done = run([{ type: "token", text: "끝" }, { type: "done" }]);
    expect(applyStreamEvent(done, { type: "token", text: "늦은 글" })).toBe(done);
  });

  it("끝 표시 없이 닫히면 실패로 끝낸다 — 완료된 답은 건드리지 않는다", () => {
    expect(applyStreamCut(run([{ type: "queued", position: 1 }])).content).toBe(errorNotice("internal"));
    const done = run([{ type: "token", text: "끝" }, { type: "done" }]);
    expect(applyStreamCut(done)).toBe(done);
  });
});
