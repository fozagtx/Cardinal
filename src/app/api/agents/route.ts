import { NextResponse } from "next/server";
import { queryCuratedAgents } from "@/lib/registry";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("search") ?? undefined;
  return NextResponse.json(await queryCuratedAgents(search));
}
