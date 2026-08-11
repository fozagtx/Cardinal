import { NextResponse } from "next/server";
import { scanAgentCard } from "@/lib/scanner";

const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return NextResponse.json({ status: "invalid", issues: ["Card exceeds the 8 KiB scan limit"] }, { status: 413 });
  }

  try {
    return NextResponse.json(scanAgentCard(JSON.parse(body)));
  } catch {
    return NextResponse.json({ status: "invalid", rulesetVersion: 1, issues: ["Body must be valid JSON"] }, { status: 400 });
  }
}
