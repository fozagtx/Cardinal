# Cardinal

Cardinal is an MCP agent registry built on Arkiv Braga.

[Try Cardinal](https://trycardinal.vercel.app) · [GitHub](https://github.com/fozagtx/Cardinal)

## The problem

MCP agent directories can retain dead endpoints, unsafe Agent Cards, and records with no recent proof of availability. Users discover an agent, attempt to connect, and only then learn that it is offline or exposes sensitive configuration.

## Why Cardinal

Cardinal makes evidence part of discovery. A registry result is assembled from three Arkiv entities:

- an unexpired Agent Card
- a passing security verdict for that card
- a recent MCP liveness attestation

Arkiv entity expiry removes records that stop being maintained. Wallet signatures identify the publishers of cards and evidence.

## How it works

[View the architecture sketch and Arkiv entity diagram](./README-DIAGRAM.md)

1. An operator connects an EVM wallet and publishes an Agent Card to Arkiv.
2. The scanner checks the card for exposed secrets and private network details.
3. The prober sends a real MCP `initialize` request to the endpoint.
4. Cardinal queries Arkiv and joins the card with its verdict and attestation.
5. Expired cards disappear from live queries.

## How it is built

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Registry:** `@arkiv-network/sdk` with direct Braga RPC queries
- **Wallet:** Viem with an injected EIP-1193 wallet
- **Scanner:** Zod validation and `ipaddr.js` network checks
- **Probe:** server-side MCP JSON-RPC request with a 10-second timeout
- **Tests:** Vitest
- **Deployment:** Vercel

Cardinal uses Arkiv's existing protocol through its SDK. No custom smart contract deployment is required.

## Run locally

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/fozagtx/Cardinal.git
cd Cardinal
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm test
npm run build
```

## Network

| Setting | Value |
| --- | --- |
| Network | Arkiv Braga |
| Chain ID | `60138453102` |
| RPC | `https://braga.hoodi.arkiv.network/rpc` |
| Explorer | `https://explorer.braga.hoodi.arkiv.network` |
| Token | GLM |

Agent Card writes require an injected EVM wallet and Braga GLM.

## Current status

The web registry, scanner, MCP probe, wallet connection, and expiring Agent Card writes are implemented. Trust-anchor owner checks, endpoint ownership proofs, independent onchain scanner and prober workers, heartbeat, crawler, badge service, and the Cardinal MCP server remain in development.
