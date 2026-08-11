# Cardinal — Ideathon Submission Answers

## Entities & attributes

Cardinal is an MCP agent registry built around three related Arkiv entity types.

### `agent_card`

An operator or crawler publishes the agent’s discoverable identity and endpoint.

```text
type           = "agent_card"
agent          = stable agent identifier
protocol       = "mcp"
class          = "claimed" | "indexed"
card_hash      = SHA-256 hash of the published card
endpoint_hash  = SHA-256 hash of the endpoint
root           = publishing wallet address
version        = integer
registered_at  = Unix timestamp
cap_<name>     = 1 for each declared capability
```

The payload contains the human-readable card:

```json
{
  "name": "Agent name",
  "endpoint": "https://agent.example/mcp",
  "capabilities": ["search", "payments"]
}
```

### `scan_verdict`

A scanner publishes the result of a security check against a specific `card_hash`.

```text
type             = "scan_verdict"
card_hash        = matching Agent Card hash
verdict          = "pass" | "reject"
scanned_at       = Unix timestamp
ruleset_version  = integer
```

The public record contains the verdict and its versioned metadata. Secret values never enter Arkiv. Findings are represented by field paths and finding classes, such as `private_key` or `internal_hostname`.

### `attestation`

A prober publishes the result of contacting the MCP endpoint.

```text
type           = "attestation"
agent          = matching agent identifier
result         = "pass" | "auth_required" | "fail"
checked_at     = Unix timestamp
latency_ms     = integer
probe_version  = integer
status_code    = integer
```

Timestamps, latency, status codes, versions, and other ordered values are stored as integers so Arkiv range filters and ordering can operate on them.

The current prototype writes Agent Cards and performs scanning and probing through the web app. Independent scanner and prober wallets publishing `scan_verdict` and `attestation` entities are the next service layer.

## The queries you rely on

Cardinal starts by selecting MCP Agent Cards:

```ts
where(
  and(
    eq("type", "agent_card"),
    eq("protocol", "mcp")
  )
)
```

For each card, it selects a passing verdict tied to the exact card hash:

```ts
where(
  and(
    eq("type", "scan_verdict"),
    eq("card_hash", cardHash),
    eq("verdict", "pass")
  )
)
```

It then selects the newest passing attestation for that agent:

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

The production freshness query adds a numeric lower bound:

```ts
gt("checked_at", minimumAcceptedTimestamp)
```

The user-facing question is simple:

> Which MCP agents have an unexpired card, a passing security verdict for that exact card, and a recent passing endpoint attestation?

The current registry reads up to 100 candidate cards and filters search text across agent names and endpoints. Pagination and count queries are the next scaling additions.

## Expiry, extension & ownership

Agent Cards are time-scoped Arkiv entities. The current claim flow creates a card with a one-day lifetime. A production operator heartbeat will extend the card before expiry. When maintenance stops, the card leaves live registry results through Arkiv expiry.

Cardinality of trust comes from separate publishers:

- the operator wallet maintains the Agent Card;
- an approved scanner wallet publishes the security verdict;
- an approved prober wallet publishes the liveness attestation.

The registry will verify entity owners against published scanner and prober trust anchors before accepting evidence. Claimed agents will also complete an endpoint-control check through DNS TXT or a well-known URL challenge, linking the wallet claim to control of the advertised service.

## Why Arkiv is the right fit

Cardinal’s core product is a queryable evidence graph written by different parties. Operators publish identities, scanners publish security results, and probers publish liveness results. A client can read those records, inspect their authorship, and reproduce the registry’s admission query.

Arkiv supplies the properties Cardinal needs in the storage layer:

- typed attributes for filtering and ordering;
- entity ownership for verifiable authorship;
- expiry for automatic removal of abandoned records;
- direct reads that let builders verify the source data themselves;
- a shared protocol where operators and evidence providers can publish independently.

A conventional database would require Cardinal to own the publication history, cleanup process, and evidence authority. Arkiv makes expiry, authorship, and queryable evidence part of the product’s data model.

## What stays off Arkiv?

Cardinal stores compact discovery records and evidence metadata on Arkiv. These remain outside Arkiv:

- private keys, API keys, access tokens, and authorization headers;
- raw scanner inputs when they contain sensitive material;
- secret values found during scanning;
- MCP tool execution and request-time agent traffic;
- large logs, response bodies, screenshots, and media files;
- temporary probe connections and transport events;
- wallet-extension state and private user preferences.

The rule is simple: Arkiv holds verifiable registry state. Private data, hot-path execution, and heavy transient material stay in the application and service layer.

## Did you use the Ideathon MCP server while shaping this idea?

**B — No. I used the Arkiv documentation and site instead.**

## Did you use the Arkiv MCP or docs?

I used the Arkiv SDK documentation, Braga network configuration, query API, and the installed `@arkiv-network/sdk` type declarations. The prototype connects directly to the Braga RPC through the SDK.

The hardest design problem was the evidence join: a verdict must point to the exact card hash, an attestation must point to the correct agent, freshness must be numeric and queryable, and evidence authors must be verified against approved trust anchors. Expiry also needed to be treated as a product feature, separating operator-maintained identity from independently maintained liveness.
