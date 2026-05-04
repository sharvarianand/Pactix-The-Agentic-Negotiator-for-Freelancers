"use client";

import { ChevronDown, Search, Scale, Gavel, Mic, FileSignature, type LucideIcon } from "lucide-react";
import { WinProbabilityTimeline } from "./WinProbabilityTimeline";
import { ClientDossier } from "./ClientDossier";
import { useState } from "react";
import {
  AGENT_ORDER,
  useDealStore,
  type AgentStatus,
  type LiveAgent,
  type LiveAgentName,
} from "@/store/deal-store";
import { cn } from "@/lib/utils";

interface CardConfig {
  id: LiveAgentName | "council" | "closer";
  title: string;
  colorVar: string;
  icon: LucideIcon;
  agentNames: LiveAgentName[]; // sub-agents whose state this card reflects
}

// Visual consolidation: 6 agents -> 4 cards.
const CARDS: CardConfig[] = [
  {
    id: "orchestrator",
    title: "Orchestrator",
    colorVar: "--color-accent",
    icon: Search,
    agentNames: ["orchestrator"],
  },
  {
    id: "scout",
    title: "Scout",
    colorVar: "--color-scout",
    icon: Search,
    agentNames: ["scout"],
  },
  {
    id: "council",
    title: "The Council",
    colorVar: "--color-council",
    icon: Scale,
    agentNames: ["prosecutor", "defense", "judge"],
  },
  {
    id: "closer",
    title: "Negotiator",
    colorVar: "--color-negotiator",
    icon: Mic,
    agentNames: ["negotiator"],
  },
];

const AGENT_META: Record<LiveAgentName, { label: string; icon: LucideIcon }> = {
  orchestrator: { label: "Orchestrator", icon: Search },
  scout: { label: "Scout", icon: Search },
  prosecutor: { label: "Prosecutor", icon: Gavel },
  defense: { label: "Defense", icon: Scale },
  judge: { label: "Judge", icon: Gavel },
  negotiator: { label: "Negotiator", icon: Mic },
};

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full inline-block",
        status === "idle" && "bg-[var(--color-text-dim)]",
        status === "thinking" &&
          "bg-[var(--color-warn)] dot-thinking",
        status === "done" && "bg-[var(--color-accept)]",
        status === "error" && "bg-[var(--color-danger)]"
      )}
    />
  );
}

function aggregateStatus(agents: LiveAgent[]): AgentStatus {
  if (agents.some((a) => a.status === "error")) return "error";
  if (agents.some((a) => a.status === "thinking")) return "thinking";
  if (agents.every((a) => a.status === "done")) return "done";
  return "idle";
}

function SubAgentBlock({ name, state }: { name: LiveAgentName; state: LiveAgent }) {
  const { label, icon: Icon } = AGENT_META[name];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <Icon className="w-3 h-3 text-[var(--color-text-muted)]" />
        <span className="font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </span>
        <StatusDot status={state.status} />
        {state.latencyMs != null && (
          <span className="ml-auto text-[10px] text-[var(--color-text-dim)]">
            {state.latencyMs}ms
          </span>
        )}
      </div>
      {state.streamText && (
        <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--color-text)] leading-relaxed bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-2 max-h-48 overflow-y-auto trace-chunk">
          {state.streamText}
        </pre>
      )}
      {state.error && (
        <div className="text-xs text-[var(--color-danger)] whitespace-pre-wrap leading-relaxed">
          {state.error}
        </div>
      )}
    </div>
  );
}

function JudgeOutputBlock({ output }: { output: unknown }) {
  if (!output || typeof output !== "object") return null;
  const j = output as {
    decision?: string;
    recommendedCounter?: number;
    revisionsCap?: number;
    timeline?: string;
    depositPct?: number;
    winProbability?: number;
    rationale?: string;
  };
  return (
    <div className="mt-2 border border-[var(--color-council)]/30 rounded-md p-3 bg-[var(--color-council)]/5 space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[var(--color-council)] uppercase tracking-wider">
          Ruling
        </div>
        <div
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium",
            j.decision === "accept" && "bg-[var(--color-accept)]/20 text-[var(--color-accept)]",
            j.decision === "counter" && "bg-[var(--color-warn)]/20 text-[var(--color-warn)]",
            j.decision === "reject" && "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
          )}
        >
          {j.decision?.toUpperCase()}
        </div>
      </div>
      {j.recommendedCounter != null && (
        <div>
          Amount:{" "}
          <span className="text-[var(--color-text)] font-medium">
            ${j.recommendedCounter}
          </span>
        </div>
      )}
      {j.revisionsCap != null && (
        <div>
          Revisions cap:{" "}
          <span className="text-[var(--color-text)]">{j.revisionsCap}</span>
        </div>
      )}
      {j.timeline && (
        <div>
          Timeline: <span className="text-[var(--color-text)]">{j.timeline}</span>
        </div>
      )}
      {j.winProbability != null && (
        <div>
          Win probability:{" "}
          <span className="text-[var(--color-text)] font-medium">
            {Math.round(j.winProbability * 100)}%
          </span>
        </div>
      )}
      {j.rationale && (
        <div className="pt-1 text-[var(--color-text-muted)] italic">
          "{j.rationale}"
        </div>
      )}
    </div>
  );
}

function AgentCard({ config }: { config: CardConfig }) {
  const live = useDealStore((s) => s.live);
  const [open, setOpen] = useState(true);

  const agents = config.agentNames.map((n) => live[n]);
  const status = aggregateStatus(agents);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border bg-[var(--color-panel)] transition-colors",
        status === "thinking" && "border-[var(--color-warn)]/50",
        status === "done" && "border-[var(--color-accept)]/40",
        status === "error" && "border-[var(--color-danger)]/50",
        status === "idle" && "border-[var(--color-border)]"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Icon
          className="w-4 h-4 shrink-0"
          style={{ color: `var(${config.colorVar})` }}
        />
        <div className="text-sm font-semibold">{config.title}</div>
        <StatusDot status={status} />
        <ChevronDown
          className={cn(
            "w-4 h-4 ml-auto text-[var(--color-text-dim)] transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-[var(--color-border)]/50 pt-3">
          {config.agentNames.map((n) => (
            <SubAgentBlock key={n} name={n} state={live[n]} />
          ))}
          {config.agentNames.includes("judge") && Boolean(live.judge.output) && (
            <JudgeOutputBlock output={live.judge.output} />
          )}
        </div>
      )}
    </div>
  );
}

export function AgentCouncil() {
  const dispatching = useDealStore((s) => s.dispatching);

  return (
    <aside className="w-[420px] shrink-0 flex flex-col border-l border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
        <FileSignature className="w-4 h-4 text-[var(--color-text-muted)]" />
        <div className="text-sm font-medium">Agent Council</div>
        {dispatching && (
          <div className="ml-auto text-[10px] uppercase tracking-wider text-[var(--color-warn)] dot-thinking">
            Deliberating
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <WinProbabilityTimeline />
        <ClientDossier />
        {CARDS.map((c) => (
          <AgentCard key={c.id} config={c} />
        ))}
        {!dispatching && AGENT_ORDER.every((n): boolean => useDealStore.getState().live[n].status === "idle") && (
          <div className="text-xs text-[var(--color-text-dim)] text-center pt-6 leading-relaxed">
            Click <span className="text-[var(--color-text)]">Send to Pactix</span>{" "}
            on an email to convene the council.
          </div>
        )}
      </div>
    </aside>
  );
}
