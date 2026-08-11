import ipaddr from "ipaddr.js";
import { NextResponse } from "next/server";
import { probeMcpEndpoint } from "@/lib/probe";

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.hostname === "localhost" || url.hostname.endsWith(".local")) return false;
    if (ipaddr.isValid(url.hostname)) return ipaddr.parse(url.hostname).range() === "unicast";
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (!input || typeof input.endpoint !== "string" || !isPublicHttpUrl(input.endpoint)) {
    return NextResponse.json({ error: "Provide a public HTTP or HTTPS MCP endpoint" }, { status: 400 });
  }

  return NextResponse.json(await probeMcpEndpoint(input.endpoint));
}
