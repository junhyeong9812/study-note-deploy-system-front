import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/logger", () => ({ log: vi.fn() }));

async function load(alertUrl: string | undefined) {
  vi.resetModules();
  if (alertUrl === undefined) delete process.env.ALERT_URL; else process.env.ALERT_URL = alertUrl;
  return import("./alertRelay");
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => { vi.unstubAllGlobals(); delete process.env.ALERT_URL; });

describe("relayAlertHealth", () => {
  it("알림 서버의 상태 코드와 본문을 그대로 전한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { relayAlertHealth } = await load("http://alert.internal:16000");
    expect(await relayAlertHealth()).toEqual({ status: 200, body: { status: "ok" } });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://alert.internal:16000/health");
  });

  it("멈춘 감시 루프(503)도 그대로 전한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "stalled" }), { status: 503 })));
    const { relayAlertHealth } = await load("http://alert.internal:16000");
    expect((await relayAlertHealth()).status).toBe(503);
  });

  it("알림 서버에 닿지 못하거나 주소가 없으면 503 alert_unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));
    const configured = await load("http://alert.internal:16000");
    expect(await configured.relayAlertHealth()).toEqual({ status: 503, body: { success: false, error: { code: "alert_unreachable" } } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const missing = await load(undefined);
    expect((await missing.relayAlertHealth()).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("relayAlertEvent", () => {
  it("본문과 비밀을 그대로 넘기고 알림 서버의 응답을 전한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { sent: true } }), { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { relayAlertEvent } = await load("http://alert.internal:16000");
    const body = JSON.stringify({ source: "edge", kind: "outage", title: "집과의 연결이 끊겼다" });
    const result = await relayAlertEvent("the-secret", body.length, async () => body);
    expect(result).toEqual({ status: 202, body: { success: true, data: { sent: true } } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://alert.internal:16000/events");
    expect(init.headers["X-Alert-Secret"]).toBe("the-secret");
    expect(init.body).toBe(body);
  });

  it("인증 실패(401)를 그대로 전한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 401 })));
    const { relayAlertEvent } = await load("http://alert.internal:16000");
    expect((await relayAlertEvent("wrong", 2, async () => "{}")).status).toBe(401);
  });

  it("큰 본문은 알림 서버를 부르지 않고 413", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { relayAlertEvent } = await load("http://alert.internal:16000");
    expect((await relayAlertEvent("s", 5000, async () => "x")).status).toBe(413);
    expect((await relayAlertEvent("s", 10, async () => "x".repeat(5000))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
