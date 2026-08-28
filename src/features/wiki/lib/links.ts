/** 노트 내 상대 md 링크를 /wiki 경로로 치환 — docPath 기준 상대 해석.
 * hash(#절)·query는 분리해 보존 — "other.md#절" 이 ".md.md" 조회가 되던 결함 수정(리뷰). */
export function resolveHref(href: string | undefined, docDir: string): string {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href ?? "";
  const hashIndex = href.search(/[#?]/);
  const pathname = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const suffix = hashIndex === -1 ? "" : href.slice(hashIndex);
  const clean = pathname.replace(/\/$/, "").replace(/\.md$/, "");
  const stack = docDir === "" ? [] : docDir.split("/");
  for (const segment of clean.split("/")) {
    if (segment === "..") stack.pop();
    else if (segment !== ".") stack.push(segment);
  }
  return "/wiki/" + stack.join("/") + suffix;
}
