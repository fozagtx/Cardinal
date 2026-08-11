import crypto from "node:crypto";

export type ProbeResult = {
  result: "pass" | "auth_required" | "fail";
  statusCode?: number;
  latencyMs?: number;
  error?: string;
  probeVersion: 1;
};

export async function probeMcpEndpoint(endpoint: string, timeoutMs = 10_000): Promise<ProbeResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "Cardinal", version: "0.1.0" },
        },
      }),
      signal: controller.signal,
    });

    const latencyMs = Math.round(performance.now() - started);
    if (response.status === 401 || response.status === 403) return { result: "auth_required", statusCode: response.status, latencyMs, probeVersion: 1 };
    if (!response.ok) return { result: "fail", statusCode: response.status, latencyMs, error: `HTTP ${response.status}`, probeVersion: 1 };

    const body = await response.text();
    if (!body.includes("jsonrpc") && !body.includes("event:")) return { result: "fail", statusCode: response.status, latencyMs, error: "Malformed initialize response", probeVersion: 1 };
    return { result: "pass", statusCode: response.status, latencyMs, probeVersion: 1 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Probe failed";
    return { result: "fail", latencyMs: Math.round(performance.now() - started), error: message, probeVersion: 1 };
  } finally {
    clearTimeout(timer);
  }
}
