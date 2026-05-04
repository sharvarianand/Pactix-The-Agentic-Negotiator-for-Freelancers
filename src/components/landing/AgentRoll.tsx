"use client";

import { motion } from "framer-motion";
import { Compass, Search, Sword, Shield, Gavel, Mic, FileSignature, CreditCard } from "lucide-react";

const AGENTS = [
  {
    id: "orchestrator",
    n: "01",
    name: "Orchestrator",
    role: "The Conductor",
    desc: "Triages every email. Assembles deal scope and routes the council.",
    icon: Compass,
    accent: false,
  },
  {
    id: "scout",
    n: "02",
    name: "Scout",
    role: "The Researcher",
    desc: "Digs cached intel on the client — funding, headcount, comp rates.",
    icon: Search,
    accent: false,
  },
  {
    id: "prosecutor",
    n: "03",
    name: "Prosecutor",
    role: "The Hawk",
    desc: "Argues for higher pricing. Lists every reason you're underselling.",
    icon: Sword,
    accent: true,
  },
  {
    id: "defense",
    n: "04",
    name: "Defense",
    role: "The Diplomat",
    desc: "Argues for relationship and reasonableness. Keeps the deal alive.",
    icon: Shield,
    accent: false,
  },
  {
    id: "judge",
    n: "05",
    name: "Judge",
    role: "The Arbiter",
    desc: "Reads both sides. Sets your floor, target, and walk-away in writing.",
    icon: Gavel,
    accent: false,
  },
  {
    id: "negotiator",
    n: "06",
    name: "Negotiator",
    role: "The Voice",
    desc: "Drafts the reply in your tone using past emails as a fingerprint.",
    icon: Mic,
    accent: true,
  },
  {
    id: "contract",
    n: "07",
    name: "Contract",
    role: "The Closer",
    desc: "On agreement, generates a signable SOW PDF in seconds.",
    icon: FileSignature,
    accent: false,
  },
  {
    id: "payment",
    n: "08",
    name: "Payment",
    role: "The Cashier",
    desc: "Opens a Stripe deposit invoice and watches for the green check.",
    icon: CreditCard,
    accent: false,
  },
];

export function AgentRoll() {
  return (
    <section id="agents" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-[1400px] px-6">
        {/* section header */}
        <div className="py-16 grid grid-cols-12 gap-6 border-b border-[var(--color-border)]">
          <div className="col-span-12 lg:col-span-2">
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
              004 — The Roster
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <h2
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3.25rem)", lineHeight: 1, letterSpacing: "-0.03em" }}
            >
              Eight specialists.{" "}
              <span style={{ fontStyle: "italic" }} className="text-[var(--color-text-muted)]">One desk.</span>
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] text-sm leading-relaxed max-w-lg">
              Each agent has a single job and a single voice. They argue, vote, and execute.
              You stay in command.
            </p>
          </div>
        </div>

        {/* agent grid */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {AGENTS.map((a, i) => (
            <AgentCard key={a.id} agent={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ agent: a, index: i }: { agent: typeof AGENTS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (i % 4) * 0.07 }}
      className="relative flex flex-col overflow-hidden group cursor-default"
      style={{
        borderRight: i % 4 !== 3 ? "1px solid var(--color-border)" : "none",
        borderBottom: i < 4 ? "1px solid var(--color-border)" : "none",
      }}
    >
      {/* top accent bar — slides in on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 origin-left"
        style={{
          background: a.accent ? "var(--color-signal)" : "var(--color-text)",
          transform: "scaleX(0)",
        }}
        ref={(el) => {
          if (!el) return;
          const parent = el.parentElement;
          if (!parent) return;
          parent.addEventListener("mouseenter", () => { el.style.transform = "scaleX(1)"; });
          parent.addEventListener("mouseleave", () => { el.style.transform = "scaleX(0)"; });
        }}
      />

      {/* ghost number — background watermark */}
      <div
        className="absolute top-0 right-0 select-none pointer-events-none"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(5rem,10vw,9rem)",
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: a.accent ? "rgba(255,26,0,0.05)" : "rgba(0,0,0,0.04)",
          transform: "translate(10%, -10%)",
          transition: "color 300ms",
        }}
      >
        {a.n}
      </div>

      {/* card content */}
      <div className="relative flex flex-col h-full p-8 min-h-[280px] transition-colors duration-200 group-hover:bg-[var(--color-panel-2)]">
        {/* icon block */}
        <div className="mb-8">
          <div
            className="w-14 h-14 flex items-center justify-center transition-all duration-300"
            style={{
              background: a.accent ? "var(--color-signal)" : "var(--color-panel-3)",
              color: a.accent ? "#ffffff" : "var(--color-text)",
            }}
          >
            <a.icon className="w-6 h-6" />
          </div>
        </div>

        {/* text */}
        <div className="mt-auto">
          <div
            style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            className="mb-1 transition-colors duration-200"
          >
            {a.name}
          </div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-4">
            {a.role}
          </div>
          <div className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {a.desc}
          </div>
        </div>

        {/* bottom signal line for accent agents */}
        {a.accent && (
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "var(--color-signal-line)" }}
          />
        )}
      </div>
    </motion.div>
  );
}
