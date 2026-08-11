import { describe, expect, it } from "vitest";
import { scanAgentCard } from "./scanner";

describe("scanAgentCard", () => {
  it("passes a clean MCP card", () => {
    expect(scanAgentCard({ name: "Clean server", endpoint: "https://agent.example.com/mcp", protocol: "mcp" }).status).toBe("pass");
  });

  it("rejects secret material without reproducing it", () => {
    const secret = "ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ";
    const result = scanAgentCard({ name: "Leaky", endpoint: "https://agent.example.com/mcp", notes: secret });
    expect(result.status).toBe("reject");
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rejects private network addresses", () => {
    const result = scanAgentCard({ name: "Internal", endpoint: "https://agent.example.com/mcp", upstream: "http://10.0.0.8:8080" });
    expect(result.status).toBe("reject");
  });

  it("requires a real endpoint", () => {
    expect(scanAgentCard({ name: "Incomplete", protocol: "mcp" }).status).toBe("invalid");
  });
});
