"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Compass, Search, Sword, Shield, Gavel, Mic, FileSignature, CreditCard, CheckCircle2, Loader2, Zap } from "lucide-react";
import { useDealStore, AGENT_ORDER, type LiveAgentName } from "@/store/deal-store";
import { DebateArena } from "@/components/arena/DebateArena";

const AGENTS = [
  {
    id: "orchestrator", n: "01", name: "Orchestrator", role: "The Conductor",
    desc: "Triages every incoming email. Assembles deal scope, extracts deliverables, timeline, and budget signals. Routes the full context to the council.",
    icon: Compass, accent: false, status: "idle",
    stats: { deals: 48, accuracy: "99%", avgTime: "0.8s" },
  },
  {
    id: "scout", n: "02", name: "Scout", role: "The Researcher",
    desc: "Runs background checks on every client — funding rounds, headcount, comp data, LinkedIn signals. Surfaces leverage points before negotiation begins.",
    icon: Search, accent: false, status: "active",
    stats: { deals: 44, accuracy: "94%", avgTime: "2.1s" },
  },
  {
    id: "prosecutor", n: "03", name: "Prosecutor", role: "The Hawk",
    desc: "Argues aggressively for higher pricing. Lists every reason you're underselling. Anchors the target rate and defends it with data from Scout.",
    icon: Sword, accent: true, status: "active",
    stats: { deals: 44, accuracy: "91%", avgTime: "3.4s" },
  },
  {
    id: "defense", n: "04", name: "Defense", role: "The Diplomat",
    desc: "Argues for relationship preservation and reasonable positioning. Flags when Prosecutor's ask risks killing the deal. Keeps you from over-reaching.",
    icon: Shield, accent: false, status: "active",
    stats: { deals: 44, accuracy: "88%", avgTime: "3.1s" },
  },
  {
    id: "judge", n: "05", name: "Judge", role: "The Arbiter",
    desc: "Synthesises both sides. Sets a binding floor, target, and walk-away price in writing. The verdict triggers the Negotiator's draft.",
    icon: Gavel, accent: false, status: "idle",
    stats: { deals: 44, accuracy: "97%", avgTime: "1.9s" },
  },
  {
    id: "negotiator", n: "06", name: "Negotiator", role: "The Voice",
    desc: "Writes the reply in your exact tone, using your past emails as a voice fingerprint. Mirrors your vocabulary, sentence length, and sign-off style.",
    icon: Mic, accent: true, status: "active",
    stats: { deals: 42, accuracy: "96%", avgTime: "4.2s" },
  },
  {
    id: "contract", n: "07", name: "Contract", role: "The Closer",
    desc: "On approval, auto-generates a signable SOW PDF from the agreed terms. Embeds revision limits, payment schedule, and IP clauses automatically.",
    icon: FileSignature, accent: false, status: "idle",
    stats: { deals: 31, accuracy: "100%", avgTime: "1.2s" },
  },
  {
    id: "payment", n: "08", name: "Payment", role: "The Cashier",
    desc: "Opens a Stripe deposit invoice for the agreed retainer. Monitors webhook events and fires alerts the moment the payment clears.",
    icon: CreditCard, accent: false, status: "idle",
    stats: { deals: 28, accuracy: "100%", avgTime: "0.6s" },
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a",
  idle:   "#a3a3a3",
};

export default function AgentsPage() {
  const dispatching = useDealStore((s) => s.dispatching);
  const live = useDealStore((s) => s.live);
  const router = useRouter();
  const [hadDispatched, setHadDispatched] = useState(false);

  // Track when a dispatch starts so we can detect when it finishes
  useEffect(() => {
    if (dispatching) setHadDispatched(true);
  }, [dispatching]);

  // When dispatch finishes after we observed it running → go back to dashboard
  useEffect(() => {
    if (hadDispatched && !dispatching) {
      setHadDispatched(false);
      router.push("/dashboard");
    }
  }, [hadDispatched, dispatching, router]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {dispatching ? (
          <motion.div
            key="cinematic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <CinematicDispatch live={live} />
          </motion.div>
        ) : (
          <motion.div
            key="roster"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <RosterView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Cinematic dispatch view ───────────────────────────────── */
const DISPATCH_AGENTS: Array<{ id: LiveAgentName; name: string; role: string; accent: boolean }> = [
  { id: "orchestrator", name: "Orchestrator", role: "The Conductor", accent: false },
  { id: "scout",        name: "Scout",        role: "The Researcher", accent: false },
  { id: "prosecutor",   name: "Prosecutor",   role: "The Hawk",       accent: true  },
  { id: "defense",      name: "Defense",      role: "The Diplomat",   accent: false },
  { id: "judge",        name: "Judge",        role: "The Arbiter",    accent: false },
  { id: "negotiator",   name: "Negotiator",   role: "The Voice",      accent: true  },
];

function CinematicDispatch({ live }: { live: Record<LiveAgentName, { status: string; streamText: string }> }) {
  const router = useRouter();
  const doneCount = DISPATCH_AGENTS.filter((a) => live[a.id].status === "done").length;
  const progress = doneCount / DISPATCH_AGENTS.length;

  const activeAgent = DISPATCH_AGENTS.find((a) => live[a.id].status === "thinking");
  const activeStream = activeAgent ? live[activeAgent.id].streamText : "";

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-text)] text-white overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-8 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#ff1a00] animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-white/50">
            Council · Deliberating
          </span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="font-mono text-[10px] tracking-widest uppercase text-white/40 hover:text-white/70 transition-colors"
        >
          ← Back to desk
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-white/10 shrink-0">
        <motion.div
          className="h-full bg-[#ff1a00]"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Agents grid */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">
              {doneCount} of {DISPATCH_AGENTS.length} agents complete
            </div>
            <h2
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.8rem)", letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              The council is{" "}
              <span style={{ color: "#ff1a00", fontStyle: "italic" }}>deliberating.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {DISPATCH_AGENTS.map((ag, i) => {
              const state = live[ag.id];
              const isThinking = state.status === "thinking";
              const isDone = state.status === "done";
              const isIdle = state.status === "idle";
              return (
                <motion.div
                  key={ag.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative border flex flex-col items-center py-8 px-4 overflow-hidden transition-all duration-400"
                  style={{
                    borderColor: isThinking ? "#ff1a00" : isDone ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                    background: isThinking ? "rgba(255,26,0,0.06)" : isDone ? "rgba(255,255,255,0.04)" : "transparent",
                    boxShadow: isThinking ? "0 0 40px rgba(255,26,0,0.15)" : "none",
                  }}
                >
                  {/* glow ring when thinking */}
                  {isThinking && (
                    <motion.div
                      className="absolute inset-0 border border-[#ff1a00] pointer-events-none"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}

                  {/* robot SVG */}
                  <motion.div
                    animate={isThinking ? { y: [0, -6, 0] } : { y: 0 }}
                    transition={{ duration: 1.2, repeat: isThinking ? Infinity : 0, ease: "easeInOut" }}
                    style={{
                      filter: isThinking ? "drop-shadow(0 0 16px rgba(255,26,0,0.5))" : isDone ? "drop-shadow(0 0 6px rgba(255,255,255,0.15))" : "none",
                    }}
                  >
                    <CinematicRobot active={isThinking} done={isDone} accent={ag.accent} />
                  </motion.div>

                  {/* status icon */}
                  <div className="mt-4 mb-2">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : isThinking ? (
                      <Loader2 className="w-4 h-4 text-[#ff1a00] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                    )}
                  </div>

                  <div
                    style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}
                    className={isThinking ? "text-[#ff1a00]" : isDone ? "text-white" : "text-white/35"}
                  >
                    {ag.name}
                  </div>
                  <div
                    className="font-mono text-[9px] tracking-widest uppercase mt-0.5"
                    style={{ color: isThinking ? "rgba(255,26,0,0.7)" : "rgba(255,255,255,0.3)" }}
                  >
                    {ag.role}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Live Debate Arena */}
          <div className="mb-6">
            <DebateArena />
          </div>

          {/* Live stream text */}
          <AnimatePresence mode="wait">
            {activeAgent && (
              <motion.div
                key={activeAgent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="border border-white/10 bg-white/5 px-6 py-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-[#ff1a00]" />
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#ff1a00]">
                    {activeAgent.name} · Thinking
                  </span>
                </div>
                <p className="font-mono text-xs text-white/60 leading-relaxed line-clamp-4">
                  {activeStream || "Processing…"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Cinematic robot SVG ───────────────────────────────────── */
function CinematicRobot({ active, done, accent }: { active: boolean; done: boolean; accent: boolean }) {
  const bodyColor = active ? (accent ? "#ff1a00" : "#ffffff") : done ? "#737373" : "#2a2a2a";
  const eyeColor  = active ? "#000000" : done ? "#404040" : "#1a1a1a";
  const accentC   = accent ? "#ff1a00" : "#ffffff";

  return (
    <svg width="90" height="116" viewBox="0 0 100 130" fill="none">
      <line x1="50" y1="0" x2="50" y2="14" stroke={bodyColor} strokeWidth="2" />
      <circle cx="50" cy="4" r="3" fill={active ? accentC : "#333"} />
      <rect x="22" y="14" width="56" height="44" rx="2" fill="#111" stroke={bodyColor} strokeWidth="2" />
      <rect x="26" y="22" width="48" height="16" rx="1" fill={active ? accentC : "#1e1e1e"} opacity={active ? 0.15 : 1} />
      <rect x="31" y="26" width="14" height="8" rx="1" fill={active ? accentC : "#2e2e2e"} />
      <rect x="55" y="26" width="14" height="8" rx="1" fill={active ? accentC : "#2e2e2e"} />
      {active && <><rect x="36" y="28" width="4" height="4" fill={eyeColor} /><rect x="60" y="28" width="4" height="4" fill={eyeColor} /></>}
      {done && <><rect x="36" y="28" width="4" height="4" fill="#555" /><rect x="60" y="28" width="4" height="4" fill="#555" /></>}
      <line x1="34" y1="47" x2="46" y2="47" stroke={bodyColor} strokeWidth="1.5" />
      <line x1="50" y1="47" x2="66" y2="47" stroke={bodyColor} strokeWidth="1.5" />
      <rect x="43" y="58" width="14" height="8" fill={bodyColor} />
      <rect x="14" y="66" width="72" height="48" rx="2" fill="#111" stroke={bodyColor} strokeWidth="2" />
      <rect x="30" y="74" width="40" height="24" rx="1" fill={active ? accentC : "#1e1e1e"} opacity={active ? 0.1 : 1} />
      <rect x="36" y="80" width="12" height="4" fill={active ? accentC : "#2e2e2e"} />
      <rect x="52" y="80" width="12" height="4" fill={active ? accentC : "#2e2e2e"} />
      <rect x="0"  y="68" width="12" height="36" rx="2" fill="#111" stroke={bodyColor} strokeWidth="1.5" />
      <rect x="88" y="68" width="12" height="36" rx="2" fill="#111" stroke={bodyColor} strokeWidth="1.5" />
      <rect x="22" y="114" width="22" height="16" rx="2" fill="#111" stroke={bodyColor} strokeWidth="1.5" />
      <rect x="56" y="114" width="22" height="16" rx="2" fill="#111" stroke={bodyColor} strokeWidth="1.5" />
    </svg>
  );
}

/* ── Normal roster view ────────────────────────────────────── */
function RosterView() {
  return (
    <>
      <div className="shrink-0 px-8 py-6 border-b border-[var(--color-border)] flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
            004 — The Roster
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            Eight specialists.{" "}
            <span style={{ fontStyle: "italic" }} className="text-[var(--color-text-muted)]">One desk.</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">4 active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#a3a3a3]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">4 idle</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {AGENTS.map((a, i) => (
            <AgentCard key={a.id} agent={a} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}

function AgentCard({ agent: a, index: i }: { agent: typeof AGENTS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.05 }}
      className="relative flex flex-col group cursor-default border-b border-r border-[var(--color-border)] overflow-hidden"
    >
      {/* top accent bar on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"
        style={{ background: a.accent ? "var(--color-signal)" : "var(--color-text)" }}
      />

      {/* ghost number */}
      <div
        className="absolute top-0 right-0 select-none pointer-events-none"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "6rem",
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: a.accent ? "rgba(255,26,0,0.05)" : "rgba(0,0,0,0.04)",
          transform: "translate(8%, -8%)",
        }}
      >
        {a.n}
      </div>

      <div className="relative flex flex-col p-7 min-h-[260px] transition-colors duration-200 group-hover:bg-[var(--color-panel-2)]">
        {/* top row: icon + status */}
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-12 h-12 flex items-center justify-center transition-all duration-300"
            style={{
              background: a.accent ? "var(--color-signal)" : "var(--color-panel-3)",
              color: a.accent ? "#fff" : "var(--color-text)",
            }}
          >
            <a.icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[a.status] }} />
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: STATUS_COLORS[a.status] }}>
              {a.status}
            </span>
          </div>
        </div>

        {/* name */}
        <div
          style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}
          className="mb-0.5"
        >
          {a.name}
        </div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-4">
          {a.role}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-6">
          {a.desc}
        </p>

        {/* stats */}
        <div className="mt-auto grid grid-cols-3 border-t border-[var(--color-border)] pt-4 gap-3">
          {[
            ["Deals", a.stats.deals],
            ["Accuracy", a.stats.accuracy],
            ["Avg", a.stats.avgTime],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-0.5">
                {label}
              </div>
              <div
                style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}
                className={a.accent ? "text-[var(--color-signal)]" : ""}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
