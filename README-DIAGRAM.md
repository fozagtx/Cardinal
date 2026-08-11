# Cardinal Architecture Sketch

This diagram shows the current Cardinal product flow and the Arkiv records used to build a curated MCP registry result.

## System flow

```mermaid
flowchart LR
    U[User] --> W[Connect Braga wallet]
    W --> D[Cardinal dashboard]
    D --> Q[Query Arkiv Braga]
    Q --> R[Curated agent results]

    O[Agent operator] -->|Wallet-signed write| C[agent_card]
    C --> Q
    C --> S[Agent Card scanner]
    C --> P[MCP endpoint prober]
    S --> V[scan_verdict]
    P --> A[attestation]
    V --> Q
    A --> Q

    C -. expires when not extended .-> E[Removed from live query]
```

## Entity relationship

```mermaid
erDiagram
    AGENT_CARD ||--o{ SCAN_VERDICT : "card_hash"
    AGENT_CARD ||--o{ ATTESTATION : "agent"

    AGENT_CARD {
        string type
        string agent
        string protocol
        string class
        string card_hash
        string endpoint_hash
        address root
        int version
        int registered_at
        datetime expires_at
    }

    SCAN_VERDICT {
        string type
        string card_hash
        string verdict
        int scanned_at
        int ruleset_version
        address owner
    }

    ATTESTATION {
        string type
        string agent
        string result
        int checked_at
        int latency_ms
        int probe_version
        int status_code
        address owner
    }
```

## Curated result rule

```text
unexpired agent_card
+ passing scan_verdict for the same card_hash
+ recent passing attestation for the same agent
= Cardinal registry result
```

## Record ownership

- The operator wallet publishes the Agent Card.
- An approved scanner wallet publishes the scan verdict.
- An approved prober wallet publishes the liveness attestation.
- Cardinal joins the records through typed attributes and timestamps.

The current web prototype writes Agent Cards and performs scanning and probing. Independent onchain scanner and prober writers, trust-anchor owner validation, endpoint ownership proofs, and heartbeat extension are planned service layers.

## What stays outside Arkiv

Private keys, API keys, authorization headers, raw sensitive scanner inputs, MCP execution traffic, large logs, screenshots, and temporary transport events stay outside Arkiv. Arkiv stores compact, queryable registry state and evidence metadata.
