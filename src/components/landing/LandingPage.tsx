"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowRight, Zap } from "lucide-react";
import { PactixLogo } from "@/components/shell/Logo";
import { ArenaPreview } from "./ArenaPreview";
import { AgentRoll } from "./AgentRoll";
import { Marquee } from "./Marquee";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <Manifesto />
      <ArenaPreview />
      <AgentRoll />
      <HowItWorks />
      <Stats />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ───────────── NAV ───────────── */
function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-[1400px] px-6 h-14 flex items-center gap-6">
        <PactixLogo href="/" size="lg" />

        {/* divider */}
        <div className="w-px h-5 bg-[var(--color-border-strong)] hidden md:block" />

        <nav className="hidden md:flex items-center gap-7">
          {[
            ["#arena", "The Arena"],
            ["#agents", "Agents"],
            ["#process", "Process"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-xs tracking-widest uppercase font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="btn-signal px-4 py-2 text-sm inline-flex items-center gap-1.5 font-semibold"
          >
            Open desk <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ───────────── HERO ───────────── */
function Hero() {
  return (
    <section className="relative pt-28 pb-0 overflow-hidden">
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6">

        {/* main grid */}
        <div className="grid grid-cols-12 gap-x-6 items-start">
          {/* headline — left 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="display-xl"
            >
              The council
              <br />
              <span
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
                className="text-[var(--color-text-muted)]"
              >
                argues.
              </span>
              <br />
              You{" "}
              <span className="relative inline-block">
                <span className="text-[var(--color-signal)]">close.</span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[var(--color-signal)]"
                />
              </span>
            </motion.h1>

            {/* stat rail */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-14 grid grid-cols-4 border-t border-[var(--color-border)]"
            >
              {[
                ["6", "AI agents"],
                ["< 8s", "verdict"],
                ["+30%", "rate uplift"],
                ["1-click", "to close"],
              ].map(([n, l], i) => (
                <div
                  key={i}
                  className={`pt-6 pb-4 pr-6 ${i > 0 ? "pl-6 border-l border-[var(--color-border)]" : ""}`}
                >
                  <div
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
                    className="text-4xl"
                  >
                    {i === 0 ? (
                      <span>
                        {n}
                        <span className="text-[var(--color-signal)]">.</span>
                      </span>
                    ) : (
                      n
                    )}
                  </div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mt-1.5">
                    {l}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* right panel — 4 cols, agent council visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-4 mt-10 lg:mt-0"
          >
            <CouncilVisual />
          </motion.div>
        </div>

        {/* CTA + sub-copy row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-12 pb-16 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t border-[var(--color-border)] pt-10"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="btn-signal px-6 py-3.5 text-base inline-flex items-center gap-2 font-semibold"
            >
              Run the demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="btn-ghost px-6 py-3.5 text-base inline-flex items-center gap-2"
            >
              Sign up free
            </Link>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm leading-relaxed">
            A council of AI agents reads your client emails, debates what to charge, and
            drafts the reply <em>in your voice</em>. You just approve.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* Animated Council Visual — circular spoke layout */
const CX = 50; // center x
const CY = 45; // center y (slightly above mid to leave room for ticker)
const R  = 26; // orbit radius

// Judge at center; 5 agents evenly on orbit starting top
const SPOKE_AGENTS = [
  { label: "ORCHESTRATOR", angle: -90, accent: false },
  { label: "NEGOTIATOR",   angle: -18, accent: true  },
  { label: "DEFENSE",      angle:  54, accent: false },
  { label: "PROSECUTOR",   angle: 126, accent: true  },
  { label: "SCOUT",        angle: 198, accent: false },
];

function nodeXY(angle: number, r = R) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function CouncilVisual() {
  return (
    <div className="relative w-full aspect-square rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden">
      {/* Corner labels */}
      <div className="absolute top-3 left-3 font-mono text-[9px] tracking-widest text-[var(--color-text-muted)] uppercase">
        Council · Live
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-[var(--color-signal)] signal-pulse" />
        <span className="font-mono text-[9px] text-[var(--color-signal)] tracking-widest">ACTIVE</span>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-[calc(100%-40px)]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Orbit ring */}
        <motion.circle
          cx={CX} cy={CY} r={R}
          fill="none" stroke="#e5e5e5" strokeWidth="0.3" strokeDasharray="1 2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />

        {/* Spoke lines center → nodes */}
        {SPOKE_AGENTS.map((ag, i) => {
          const { x, y } = nodeXY(ag.angle);
          return (
            <motion.line
              key={`spoke-${i}`}
              x1={CX} y1={CY} x2={x} y2={y}
              stroke={ag.accent ? "#ff1a00" : "#d4d4d4"}
              strokeWidth={ag.accent ? "0.5" : "0.35"}
              strokeDasharray={ag.accent ? "2 1.5" : "none"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.14 }}
            />
          );
        })}

        {/* Animated data packet along PROSECUTOR spoke */}
        {[0, 1].map((k) => {
          const { x, y } = nodeXY(126);
          return (
            <motion.circle
              key={`pkt-${k}`}
              r="0.8" fill="#ff1a00"
              initial={{ cx: CX, cy: CY, opacity: 0 }}
              animate={{ cx: [CX, x], cy: [CY, y], opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, delay: 2 + k * 1.8, repeat: Infinity, repeatDelay: 2 }}
            />
          );
        })}
        {[0, 1].map((k) => {
          const { x, y } = nodeXY(-18);
          return (
            <motion.circle
              key={`pkt2-${k}`}
              r="0.8" fill="#ff1a00"
              initial={{ cx: CX, cy: CY, opacity: 0 }}
              animate={{ cx: [CX, x], cy: [CY, y], opacity: [0, 1, 0] }}
              transition={{ duration: 1.0, delay: 3 + k * 2.1, repeat: Infinity, repeatDelay: 2.5 }}
            />
          );
        })}

        {/* Outer nodes */}
        {SPOKE_AGENTS.map((ag, i) => {
          const { x, y } = nodeXY(ag.angle);
          const labelPos = nodeXY(ag.angle, R + 9);
          return (
            <motion.g key={`node-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.12 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              {/* pulse ring */}
              {ag.accent && (
                <motion.circle
                  cx={x} cy={y} r={5.5}
                  fill="none" stroke="#ff1a00" strokeWidth="0.4"
                  animate={{ r: [4.5, 7, 4.5], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4 }}
                />
              )}
              <circle
                cx={x} cy={y} r={ag.accent ? 3.5 : 2.5}
                fill={ag.accent ? "#ff1a00" : "#ffffff"}
                stroke={ag.accent ? "#ff1a00" : "#0a0a0a"}
                strokeWidth="0.8"
              />
              <motion.text
                x={labelPos.x} y={labelPos.y + 1.2}
                textAnchor="middle" fontSize="3.2"
                fill={ag.accent ? "#ff1a00" : "#737373"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
              >
                {ag.label}
              </motion.text>
            </motion.g>
          );
        })}

        {/* JUDGE — center, larger, gold ring */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <motion.circle
            cx={CX} cy={CY} r={8}
            fill="none" stroke="#b8960c" strokeWidth="0.5"
            animate={{ r: [7, 10, 7], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <circle cx={CX} cy={CY} r={5.5} fill="#0a0a0a" stroke="#0a0a0a" strokeWidth="0.5" />
          <text
            x={CX} y={CY + 1.2}
            textAnchor="middle" fontSize="3.2" fill="#ffffff" fontWeight="bold"
          >
            J
          </text>
          <motion.text
            x={CX} y={CY + 10}
            textAnchor="middle" fontSize="3.2" fill="#b8960c" letterSpacing="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            JUDGE
          </motion.text>
        </motion.g>
      </svg>

      {/* Bottom ticker */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--color-border)] bg-[var(--color-panel-2)] px-4 py-2.5 font-mono text-[10px] text-[var(--color-text-muted)] tracking-wider">
        <LiveTicker />
      </div>
    </div>
  );
}

const TICKS = [
  "ORCHESTRATOR → classifying scope…",
  "SCOUT → Lumen Analytics: $40M ARR, 42 employees",
  "PROSECUTOR → floor $850, target $1,200",
  "DEFENSE → stress-test: risk of losing deal at $1,200?",
  "JUDGE → verdict: $1,200 · one revision · Friday rush +15%",
  "NEGOTIATOR → drafting reply in Maya Chen voice…",
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
        className="block truncate"
      >
        {TICKS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

/* ───────────── MANIFESTO ───────────── */
function Manifesto() {
  return (
    <section id="manifesto" className="border-t border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="mx-auto max-w-[1400px] px-6 py-24 grid grid-cols-12 gap-6 items-center">
        <div className="col-span-12 lg:col-span-2">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
            002 — Manifesto
          </div>
        </div>
        <div className="col-span-12 lg:col-span-10 display-lg leading-tight">
          Freelancers{" "}
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }} className="text-[var(--color-text-muted)]">
            underprice
          </span>{" "}
          by 30%. They reply at midnight.
          <br />
          <span className="text-[var(--color-signal)]">Pactix doesn&apos;t advise.</span>
          <span className="text-[var(--color-text-muted)]"> It executes.</span>
        </div>
      </div>
    </section>
  );
}

/* ───────────── HOW IT WORKS ───────────── */
const STEPS = [
  { n: "01", t: "Email lands", d: "Client emails. Pactix ingests, classifies, and assembles the deal scope in seconds." },
  { n: "02", t: "Council fires", d: "Scout researches the client. Prosecutor & Defense debate pricing. Judge sets your numbers." },
  { n: "03", t: "Negotiator drafts", d: "Reply written in your tone using your past emails as a voice fingerprint. You approve." },
  { n: "04", t: "Contract closes", d: "Pactix generates the SOW PDF, opens a Stripe deposit invoice, and sends both." },
];

function HowItWorks() {
  return (
    <section id="process" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="py-16 grid grid-cols-12 gap-6 border-b border-[var(--color-border)]">
          <div className="col-span-12 lg:col-span-2">
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
              004 — Process
            </div>
          </div>
          <h2 className="col-span-12 lg:col-span-7 display-md">
            Inbox to{" "}
            <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>invoice</span>
            {" "}in four moves.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`py-10 pr-8 ${i > 0 ? "md:pl-8 border-l border-[var(--color-border)]" : ""}`}
            >
              <div className="font-mono text-[var(--color-signal)] text-xs mb-6 tracking-wider">{s.n}</div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-3">{s.t}</div>
              <div className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.d}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── STATS ───────────── */
function Stats() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-text)] text-[var(--color-bg)]">
      <div className="mx-auto max-w-[1400px] px-6 py-24 grid grid-cols-12 gap-6 items-center">
        <div className="col-span-12 lg:col-span-4">
          <div className="font-mono text-[10px] tracking-widest uppercase text-white/50 mb-4">005 — Receipts</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            Numbers that{" "}
            <span style={{ fontStyle: "italic" }}>matter.</span>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-px bg-white/10">
          {[
            ["+30%", "average rate uplift"],
            ["12 min", "inbox to closed deal"],
            ["0", "midnight Slack replies"],
            ["100%", "audit-trailed"],
          ].map(([n, l]) => (
            <div key={l} className="bg-[var(--color-text)] p-10">
              <div
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,5vw,4rem)", letterSpacing: "-0.04em", lineHeight: 1 }}
                className="text-[var(--color-bg)]"
              >
                {n}
              </div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mt-3">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── FINAL CTA ───────────── */
function FinalCTA() {
  return (
    <section className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-[1400px] px-6 py-32 grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 lg:col-span-8">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-8">
            006 — Step in
          </div>
          <h2 className="display-xl mb-0">
            Stop{" "}
            <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }} className="text-[var(--color-text-muted)]">
              guessing.
            </span>
            <br />
            Start{" "}
            <span className="text-[var(--color-signal)]">closing.</span>
          </h2>
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col items-start lg:items-end gap-4 pb-2">
          <Link
            href="/dashboard"
            className="btn-signal px-7 py-4 text-base inline-flex items-center gap-2.5 font-semibold w-full lg:w-auto justify-center"
          >
            <Zap className="w-4 h-4" />
            Open the deal desk
          </Link>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
            Demo data preloaded · No setup
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── FOOTER ───────────── */
function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-panel)]">
      {/* main footer row */}
      <div className="mx-auto max-w-[1400px] px-6 pt-12 pb-8 grid grid-cols-12 gap-6">
        {/* brand column */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <PactixLogo href="/" size="sm" />
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
            An autonomous AI council that reads your client emails, debates pricing, and closes deals — in your voice.
          </p>
        </div>

        {/* spacer */}
        <div className="hidden md:block md:col-span-2" />

        {/* links */}
        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-4">Product</div>
          <div className="flex flex-col gap-2.5">
            {[["#arena", "The Arena"], ["#agents", "Agents"], ["#process", "How it works"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">{label}</a>
            ))}
          </div>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-4">Access</div>
          <div className="flex flex-col gap-2.5">
            {[["/login", "Sign in"], ["/dashboard", "Dashboard"], ["/dashboard", "Run demo"]].map(([href, label]) => (
              <Link key={label} href={href} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">{label}</Link>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-2">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-4">Stack</div>
          <div className="flex flex-col gap-2.5">
            {[["Gemini 2.5", ""], ["Next.js 15", ""], ["Framer Motion", ""]].map(([label]) => (
              <span key={label} className="text-sm text-[var(--color-text-muted)]">{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="mx-auto max-w-[1400px] px-6 py-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
          © 2026 Pactix · All rights reserved
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-[var(--color-signal)] signal-pulse" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-signal)]">v0.1 · Live</span>
        </div>
      </div>
    </footer>
  );
}
