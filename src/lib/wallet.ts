"use client";

import { createWalletClient, jsonToPayload } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { custom, type Address, type EIP1193Provider } from "viem";

const chainHex = `0x${braga.id.toString(16)}`;

declare global {
  interface Window { ethereum?: EIP1193Provider }
}

export async function getConnectedArkivWallet() {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as Address[];
  if (!accounts[0]) return null;
  const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
  return chainId.toLowerCase() === chainHex.toLowerCase() ? accounts[0] : null;
}

export async function connectArkivWallet() {
  if (!window.ethereum) throw new Error("Install an EVM wallet to continue.");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as Address[];
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
  } catch {
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: chainHex, chainName: braga.name, nativeCurrency: braga.nativeCurrency, rpcUrls: [...braga.rpcUrls.default.http], blockExplorerUrls: [braga.blockExplorers.default.url] }] });
  }
  return accounts[0];
}

export async function registerAgentCard(account: Address, card: { name: string; endpoint: string; capabilities: string[] }) {
  if (!window.ethereum) throw new Error("Wallet unavailable.");
  const cardHash = `0x${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(card))))).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const client = createWalletClient({ chain: braga, transport: custom(window.ethereum), account });
  return client.createEntity({
    payload: jsonToPayload(card),
    contentType: "application/json",
    expiresIn: 86_400,
    attributes: [
      { key: "type", value: "agent_card" }, { key: "agent", value: card.name },
      { key: "endpoint_hash", value: cardHash }, { key: "card_hash", value: cardHash },
      { key: "protocol", value: "mcp" }, { key: "class", value: "claimed" },
      { key: "root", value: account }, { key: "version", value: 1 },
      { key: "registered_at", value: Math.floor(Date.now() / 1000) },
      ...card.capabilities.map((capability) => ({ key: `cap_${capability.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, value: 1 })),
    ],
  });
}
