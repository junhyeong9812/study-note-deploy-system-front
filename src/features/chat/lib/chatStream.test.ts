import { describe, expect, it } from "vitest";
import { createSseParser, errorNotice, queuedNotice } from "./chatStream";

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
  it("대기 순번을 앞사람 수로 보여준다", () => {
    expect(queuedNotice(1)).toBe("대기 중 (다음 차례예요)");
    expect(queuedNotice(3)).toBe("대기 중 (앞에 2명)");
  });

  it("줄이 밀린 것과 서버가 꺼진 것을 다른 문구로 알린다", () => {
    const crowded = errorNotice("queue_full");
    expect(errorNotice("queue_timeout")).toBe(crowded);
    expect(errorNotice("llm_unreachable")).not.toBe(crowded);
    expect(errorNotice("llm_unreachable")).toContain("꺼져");
    expect(errorNotice("upstream")).toBe(errorNotice("internal"));
  });
});
