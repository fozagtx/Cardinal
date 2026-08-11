# Cardinal

A wallet-gated MCP agent registry built on Arkiv. Cardinal only shows agents with an unexpired card, a clean scan verdict, and recent liveness evidence.

**Try Cardinal:** [https://trycardinal.vercel.app](https://trycardinal.vercel.app)

**GitHub:** [https://github.com/fozagtx/Cardinal](https://github.com/fozagtx/Cardinal)

## What it does

- **Registry:** reads real agent records from Arkiv Braga.
- **Scanner:** checks Agent Cards for exposed keys, tokens, internal hostnames, and private or reserved IPs.
- **Probe:** sends a real MCP `initialize` request with a 10-second timeout.
- **Wallet:** connects an injected EVM wallet on Braga and lets an operator publish an expiring agent card.
- **Dashboard:** provides registry search, scanning, probing, and claiming in a separate application route.

No fake agents, metrics, scans, attestations, or fallback listings are included.

## Trust flow

```text
Agent card  →  security scan  →  live MCP probe  →  curated registry result
```

Cards are Arkiv entities with expiry. If a card is not extended, it becomes stale and disappears from live queries.

## No custom smart contract

Cardinal does **not** need a new smart contract. It uses the existing Arkiv network through `@arkiv-network/sdk` and the Braga RPC. The connected wallet signs Arkiv entity writes; there is no Cardinal contract to deploy, audit, or configure.

## Try it

Open [trycardinal.vercel.app](https://trycardinal.vercel.app), connect an injected wallet, and enter the dashboard.

The app targets Arkiv Braga:

- **Chain ID:** `60138453102`
- **RPC:** `https://braga.hoodi.arkiv.network/rpc`
- **Explorer:** `https://explorer.braga.hoodi.arkiv.network`
- **Native token:** GLM

A Braga-compatible wallet, such as MetaMask or Rabby, is required for wallet-gated features. Registering a card also requires Braga funds for entity-write fees.

## Run locally

Requirements: Node.js 20+, npm, and an injected EVM wallet for write flows.

```bash
git clone https://github.com/fozagtx/Cardinal.git
cd Cardinal
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm test
npm run build
```

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/agents` | `GET` | Query curated agents from Arkiv |
| `/api/scan` | `POST` | Validate and scan an Agent Card |
| `/api/probe` | `POST` | Probe an MCP HTTP endpoint |

## Current limits

This is a hackathon prototype, not a production trust authority.

- Verdict and attestation entity owners are not yet checked against approved trust-anchor wallets.
- Claiming proves wallet-signed publication, not DNS or endpoint ownership.
- Scanner and prober results are not yet published by independent onchain service workers.
- The probe performs `initialize`, but not `tools/list`.
- Crawler/indexer, heartbeat, Cardinal MCP server, badge service, and standalone scanner CLI are roadmap items.
- Braga is a testnet, so records and availability can change.

Never put private keys or service-wallet secrets in Agent Cards, browser code, repository files, or chat.

## Project structure

```text
src/app/                 Pages and API routes
src/components/          Landing page and dashboard
src/lib/registry.ts      Arkiv registry query
src/lib/scanner.ts       Agent Card scanner
src/lib/probe.ts         MCP liveness probe
src/lib/wallet.ts        Braga wallet and Arkiv writes
```

There is no license file in this repository yet.
