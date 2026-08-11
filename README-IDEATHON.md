# Cardinal — Ideathon Arkiv Answers

## Entities & attributes

Cardinal uses three Arkiv entity types.

### `agent_card`

Published by an agent operator or approved crawler.

Queryable attributes:

```text
type = "agent_card"
agent = "<stable agent identifier>"
protocol = "mcp"
class = "claimed" | "indexed"
card_hash = "<SHA-256 hash>"
endpoint_hash = "<SHA-256 hash>"
root = "<operator wallet address>"
version = 1
registered_at = <Unix timestamp>
cap_<capability> = 1
```

Payload:

```json
{
  "name": "Agent name",
  "endpoint": "https://agent.example/mcp",
  "capabilities": ["search", "payments"]
}
```

### `scan_verdict`

Published by a recognized scanner wallet after checking an Agent Card.

Queryable attributes:

```text
type = "scan_verdict"
card_hash = "<matching Agent Card hash>"
verdict = "pass" | "reject"
scanned_at = <Unix timestamp>
ruleset_version = <integer>
```

Detailed findings stay out of public attributes. The scanner records finding classes and field paths without reproducing detected secrets.

### `attestation`

Published by a recognized prober wallet after contacting the MCP endpoint.

Queryable attributes:

```text
type = "attestation"
agent = "<matching agent identifier>"
result = "pass" | "auth_required" | "fail"
checked_at = <Unix timestamp>
latency_ms = <integer>
probe_version = <integer>
status_code = <integer>
```

`registered_at`, `scanned_at`, `checked_at`, `latency_ms`, `status_code`, and version fields are numeric so they support ordering and range filters.

## The queries you rely on

The main query begins with live MCP Agent Cards:

```ts
where(
  and(
    eq("type", "agent_card"),
    eq("protocol", "mcp")
  )
)
```

For every card, Cardinal finds a passing verdict for the same card hash:

```ts
where(
  and(
    eq("type", "scan_verdict"),
    eq("card_hash", cardHash),
    eq("verdict", "pass")
  )
)
```

It then finds the latest passing liveness attestation:

```ts
where(
  and(
    eq("type", "attestation"),
    eq("agent", agentId),
    eq("result", "pass")
  )
)
.orderBy("checked_at", "number", "desc")
.limit(1)
```

The freshness policy applies a numeric lower bound:

```ts
gt("checked_at", minimumAcceptedTimestamp)
```

A user asks Arkiv:

> Show me live MCP agents with an unexpired Agent Card, a passing scan for the current card hash, and a recent passing endpoint attestation.

Cardinal currently fetches up to 100 candidate cards and supports text search over agent names and endpoints. Pagination and counts can be added as the registry grows.

## Expiry, extension & ownership

Every Agent Card has an Arkiv expiry. The current claimed-card flow creates cards with a one-day lifetime.

An operator must periodically extend the card to keep it discoverable. If the operator stops maintaining it, Arkiv removes it from live query results automatically.

Liveness uses two separate signals:

1. The operator wallet maintains the Agent Card.
2. An independent prober wallet publishes recent endpoint attestations.

Ownership identifies who published each card, verdict, and attestation. The production policy will accept scan and probe evidence only from approved trust-anchor wallets.

Claimed agents will also use DNS TXT or a well-known endpoint challenge to connect the wallet identity to control of the advertised domain.

## Why Arkiv, not a plain database?

Cardinal's registry is built around queryable evidence from multiple independent authors:

- operators publish Agent Cards;
- scanners publish security verdicts;
- probers publish liveness attestations;
- clients verify the records and their owners directly.

Arkiv gives every record verifiable authorship, expiry, and typed queryable attributes. Expiry is part of the product: abandoned listings leave live queries without a centralized administrator running cleanup jobs.

A plain database would make Cardinal the sole authority over publication history, record ownership, evidence, and removal. Arkiv lets builders independently inspect the same records and reproduce Cardinal's registry query.

## What stays off Arkiv?

Cardinal keeps these off Arkiv:

- private keys, API keys, access tokens, and authentication headers;
- full scanner request bodies containing sensitive material;
- detailed secret values found by the scanner;
- MCP tool execution and hot-path agent traffic;
- large logs, response bodies, screenshots, and other heavy files;
- temporary probe connections and raw transport events;
- private user preferences and wallet-extension state.

Arkiv stores compact discovery records, hashes, typed evidence, timestamps, ownership, and expiry. Scanning, probing, endpoint execution, and private data remain offchain.

## Did you use the Ideathon MCP server while shaping this idea?

**B — No, I used the docs or the site instead.**

## Did you use the Arkiv MCP or docs?

I used Arkiv's official SDK documentation, Braga chain configuration, query API, and the installed `@arkiv-network/sdk` type declarations. Cardinal connects directly to the Braga RPC through the SDK.

The hardest part was designing the trust join correctly: matching a verdict to the exact Agent Card hash, matching an attestation to the agent, enforcing numeric freshness, and verifying that evidence was authored by an approved scanner or prober wallet. Expiry and extension also require a clear separation between operator-maintained identity and independently maintained liveness evidence.
