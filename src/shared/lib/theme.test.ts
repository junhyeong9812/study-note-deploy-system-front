import { describe, it, expect } from "vitest";
import { parseTheme, nextTheme } from "./theme";

describe("theme", () => {
  it("저장값 해석 — light/dark 외엔 자동", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("auto")).toBe("auto");
    expect(parseTheme(null)).toBe("auto");
    expect(parseTheme("garbage")).toBe("auto");
  });

  it("순환: 자동 → 라이트 → 다크 → 자동", () => {
    expect(nextTheme("auto")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("auto");
  });
});
