import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function GET(request: NextRequest) {
  const docPath = request.nextUrl.searchParams.get("doc_path") ?? "";
  const upstream = await fetch(
    `${BACKEND_URL}/api/chat/history?doc_path=${encodeURIComponent(docPath)}`,
    { headers: { cookie: request.headers.get("cookie") ?? "" } },
  );
  const response = NextResponse.json(await upstream.json(), { status: upstream.status });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
