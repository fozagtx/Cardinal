# Cardinal — 40-Second Pitch

## Problem

MCP directories list agents without proving that the endpoint still works or that the Agent Card is safe to use.

## Consequence

Developers waste time integrating dead agents. Failed connections appear late in the workflow, and exposed keys or private network details can travel inside published cards.

## Solution

Cardinal turns fresh evidence into the registry filter. Each agent publishes an expiring card to Arkiv. Cardinal scans the card, probes the MCP endpoint, and joins both results on Braga. Maintained agents stay discoverable. Expired cards leave live queries automatically.

Developers get a registry where availability, security checks, ownership, and freshness can be verified before integration.

Try Cardinal at [trycardinal.vercel.app](https://trycardinal.vercel.app).
