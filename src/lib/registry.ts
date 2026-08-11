import { createPublicClient } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { and, eq } from "@arkiv-network/sdk/query";
import { http } from "viem";

export type RegistryAgent = {
  entityKey: string;
  name: string;
  endpoint: string;
  protocol: "mcp";
  class: "claimed" | "indexed";
  root?: string;
  capabilities: string[];
  authRequired: boolean;
  cardExpiresAt: number;
  verdict: { entityKey: string; scannedAt: number; rulesetVersion: number };
  attestation: { entityKey: string; checkedAt: number; result: "pass" | "auth_required"; latencyMs: number };
};

export type RegistryResponse = {
  status: "ready" | "error";
  agents: RegistryAgent[];
  query: string;
  source: "arkiv" | null;
  chainId: number;
  message?: string;
};

const curatedQuery = 'type="agent_card" AND protocol="mcp"';
const publicClient = createPublicClient({ chain: braga, transport: http() });

type EntityRecord = {
  key: string;
  owner?: string;
  attributes: { key: string; value: string | number }[];
  toJson(): unknown;
  expiresAtBlock?: bigint;
};

function attr(entity: EntityRecord, key: string) {
  return entity.attributes.find((item) => item.key === key)?.value;
}

function payload(entity: EntityRecord) {
  const value = entity.toJson();
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export async function queryCuratedAgents(search?: string): Promise<RegistryResponse> {
  try {
    const cardResult = await publicClient
      .select({ key: true, payload: true, attributes: true, expiresAtBlock: true })
      .where(and(eq("type", "agent_card"), eq("protocol", "mcp")))
      .limit(100)
      .fetch();
    const cards = cardResult.entities as unknown as EntityRecord[];
    const visible = [] as RegistryAgent[];

    for (const card of cards) {
      const cardHash = String(attr(card, "card_hash") ?? "");
      const name = String(payload(card).name ?? payload(card).agent ?? attr(card, "agent") ?? "Unnamed agent");
      const endpoint = String(payload(card).endpoint ?? "");
      if (search && !`${name} ${endpoint}`.toLowerCase().includes(search.toLowerCase())) continue;
      if (!cardHash || !endpoint) continue;

      const verdictResult = await publicClient
        .select({ key: true, attributes: true })
        .where(and(eq("type", "scan_verdict"), eq("card_hash", cardHash), eq("verdict", "pass")))
        .limit(1)
        .fetch();
      const verdict = verdictResult.entities[0] as unknown as EntityRecord | undefined;
      if (!verdict) continue;

      const attestationResult = await publicClient
        .select({ key: true, attributes: true })
        .where(and(eq("type", "attestation"), eq("agent", String(attr(card, "agent") ?? name)), eq("result", "pass")))
        .orderBy("checked_at", "number", "desc")
        .limit(1)
        .fetch();
      const attestation = attestationResult.entities[0] as unknown as EntityRecord | undefined;
      if (!attestation) continue;

      visible.push({
        entityKey: card.key,
        name,
        endpoint,
        protocol: "mcp",
        class: String(attr(card, "class") ?? "indexed") as "claimed" | "indexed",
        root: String(attr(card, "root") ?? "") || undefined,
        capabilities: card.attributes.filter((item) => item.key.startsWith("cap_")).map((item) => item.key.slice(4)),
        authRequired: Number(attr(card, "auth_required") ?? 0) === 1,
        cardExpiresAt: Number(card.expiresAtBlock ?? 0),
        verdict: { entityKey: verdict.key, scannedAt: Number(attr(verdict, "scanned_at") ?? 0), rulesetVersion: Number(attr(verdict, "ruleset_version") ?? 0) },
        attestation: { entityKey: attestation.key, checkedAt: Number(attr(attestation, "checked_at") ?? 0), result: "pass", latencyMs: Number(attr(attestation, "latency_ms") ?? 0) },
      });
    }

    return { status: "ready", agents: visible, query: curatedQuery, source: "arkiv", chainId: braga.id };
  } catch (error) {
    return { status: "error", agents: [], query: curatedQuery, source: null, chainId: braga.id, message: error instanceof Error ? error.message : "Arkiv query failed" };
  }
}
