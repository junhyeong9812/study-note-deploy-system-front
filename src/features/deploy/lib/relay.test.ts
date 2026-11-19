import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/logger", () => ({ log: vi.fn() }));

import { relayDeploymentStatus } from "./relay";

afterEach(() => vi.unstubAllGlobals());

describe("relayDeploymentStatus", () => {
  it("master의 상태 코드와 본문을 그대로 돌려주고 비밀을 넘긴다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { state: "ci_running" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await relayDeploymentStatus("the-secret", "gh-123-1");

    expect(result).toEqual({ status: 200, body: { success: true, data: { state: "ci_running" } } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/deploys\/gh-123-1$/);
    expect(init.headers["X-Deploy-Secret"]).toBe("the-secret");
  });

  it("master가 모른다고 하면 404를 그대로 전한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: { code: "not_found" } }), { status: 404 }),
    ));
    expect((await relayDeploymentStatus("the-secret", "gh-9-1")).status).toBe(404);
  });

  it("master에 닿지 못하면 503 master_unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));
    const result = await relayDeploymentStatus("the-secret", "gh-9-1");
    expect(result).toEqual({ status: 503, body: { success: false, error: { code: "master_unreachable" } } });
  });

  it("형식이 다른 요청 번호는 master를 부르지 않고 422", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await relayDeploymentStatus("the-secret", "../status")).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
