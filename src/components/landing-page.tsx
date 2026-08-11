"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Fingerprint, LoaderCircle, Radar, ShieldCheck } from "lucide-react";
import { connectArkivWallet } from "@/lib/wallet";

function Brand() { return <Link className="brand focus-ring" href="/"><span className="brand-mark"><span /></span><b>CARDINAL</b></Link>; }

export default function LandingPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  async function enterDashboard() {
    setConnecting(true);
    setError("");
    try {
      await connectArkivWallet();
      router.push("/dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connect a wallet to continue.");
    } finally {
      setConnecting(false);
    }
  }

  return <main className="landing"><header className="landing-nav"><Brand /><nav aria-label="Main navigation"><a href="#how">How it works</a><a href="#why">Why Cardinal</a><a href="https://docs.arkiv.network" target="_blank" rel="noreferrer">Docs <ExternalLink size={13} /></a></nav><button className="button button-primary" onClick={enterDashboard} disabled={connecting}>{connecting ? <LoaderCircle className="spin" size={15} /> : <ArrowRight size={15} />} {connecting ? "Connecting" : "Connect wallet"}</button></header>
    {error && <p className="landing-error" role="alert">{error}</p>}
    <section className="landing-hero"><div className="hero-left"><span className="landing-kicker"><span className="live-dot" /> Live on Arkiv Braga</span><h1>Find agents that are<br />actually online.</h1><p>Search MCP agents with fresh proof they work and a clean security check before you connect.</p><div className="hero-actions"><button className="button button-primary" onClick={enterDashboard} disabled={connecting}>{connecting ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />} Connect to explore</button><a className="button button-secondary" href="#how">See how it works</a></div><div className="hero-note"><CheckCircle2 size={15} /> No stale listings. No hidden edits. No leaked keys.</div></div>
      <div className="hero-visual"><div className="landscape-half" aria-hidden="true" /><div className="proof-card"><div className="proof-card-head"><span className="agent-avatar"><Fingerprint /></span><span><b>Live evidence</b><small>Cardinal admission policy</small></span><span className="verified-pill"><span className="live-dot" /> Verified</span></div><div className="proof-title">Ready to connect</div><div className="proof-row"><span className="proof-icon"><ShieldCheck /></span><span><b>Security check passed</b><small>No exposed keys or private addresses</small></span><CheckCircle2 /></div><div className="proof-row"><span className="proof-icon"><Radar /></span><span><b>Responded recently</b><small>Protocol handshake completed</small></span><CheckCircle2 /></div><div className="proof-row"><span className="proof-icon"><Fingerprint /></span><span><b>Owner verified</b><small>Signed by the deployment wallet</small></span><CheckCircle2 /></div><button className="button button-primary proof-button" onClick={enterDashboard} disabled={connecting}>Open verified view <ArrowRight size={15} /></button></div></div>
    </section>
    <section className="trust-strip"><span>VERIFIED WITH</span><b>Arkiv</b><b>MCP</b><b>Wallet signatures</b><b>Live probes</b></section>
    <section className="landing-section" id="how"><span className="eyebrow">HOW IT WORKS</span><h2>Three checks. One reliable result.</h2><div className="landing-cards"><article><span>01</span><ShieldCheck /><h3>We scan the card</h3><p>Cardinal checks for exposed keys, tokens, and private network details.</p></article><article><span>02</span><Radar /><h3>We call the agent</h3><p>A real MCP handshake confirms the endpoint responds before it appears.</p></article><article><span>03</span><Fingerprint /><h3>Arkiv keeps the proof</h3><p>Signed records expire automatically, so old agents disappear on their own.</p></article></div></section>
    <section className="landing-section why-section" id="why"><div><span className="eyebrow">WHY CARDINAL</span><h2>Discovery should not end in a dead link.</h2></div><p>Cardinal gives agent builders and consumers one place to find working MCP servers, inspect their latest checks, and verify the underlying records themselves.</p><button className="button button-secondary" onClick={enterDashboard} disabled={connecting}>Open registry <ArrowRight size={15} /></button></section>
    <footer className="landing-footer"><Brand /><span>Fresh proof for agent discovery.</span><span>Built on Arkiv</span></footer>
  </main>;
}
