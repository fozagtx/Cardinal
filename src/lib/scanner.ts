import ipaddr from "ipaddr.js";
import { z } from "zod";

const cardSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().max(2_000).optional(),
    url: z.string().url().optional(),
    endpoint: z.string().url().optional(),
    protocol: z.literal("mcp").default("mcp"),
    capabilities: z.union([z.array(z.string()), z.record(z.string(), z.unknown())]).optional(),
  })
  .passthrough()
  .refine((card) => Boolean(card.url || card.endpoint), {
    message: "A card must include url or endpoint",
  });

const secretRules = [
  { class: "private_key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  { class: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { class: "aws_access_key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { class: "github_token", pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/ },
  { class: "openai_api_key", pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { class: "slack_token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
] as const;

const sensitiveField = /(?:secret|token|password|passwd|private.?key|api.?key|authorization)/i;
const internalHostname = /\b(?:localhost|[a-z0-9-]+\.(?:local|internal|lan))\b/i;
const ipv4Candidate = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export type Finding = {
  field: string;
  secretClass: string;
};

export type ScanResult =
  | { status: "pass"; rulesetVersion: 1; card: z.infer<typeof cardSchema> }
  | { status: "reject"; rulesetVersion: 1; findings: Finding[] }
  | { status: "invalid"; rulesetVersion: 1; issues: string[] };

function inspect(value: unknown, path: string, findings: Finding[]) {
  if (typeof value === "string") {
    for (const rule of secretRules) {
      if (rule.pattern.test(value)) findings.push({ field: path, secretClass: rule.class });
    }

    if (sensitiveField.test(path) && value.length >= 8) {
      findings.push({ field: path, secretClass: "sensitive_field_value" });
    }

    if (internalHostname.test(value)) {
      findings.push({ field: path, secretClass: "internal_hostname" });
    }

    for (const candidate of value.match(ipv4Candidate) ?? []) {
      try {
        const address = ipaddr.parse(candidate);
        if (address.range() !== "unicast") {
          findings.push({ field: path, secretClass: "private_or_reserved_ip" });
        }
      } catch {
        continue;
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`, findings));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => inspect(item, path ? `${path}.${key}` : key, findings));
  }
}

export function scanAgentCard(input: unknown): ScanResult {
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "invalid",
      rulesetVersion: 1,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "card"}: ${issue.message}`),
    };
  }

  const findings: Finding[] = [];
  inspect(parsed.data, "", findings);
  const unique = Array.from(new Map(findings.map((finding) => [`${finding.field}:${finding.secretClass}`, finding])).values());

  return unique.length
    ? { status: "reject", rulesetVersion: 1, findings: unique }
    : { status: "pass", rulesetVersion: 1, card: parsed.data };
}
