"use client";

import { useDealStore } from "@/store/deal-store";
import { Building2, AlertTriangle, Zap, DollarSign } from "lucide-react";

interface ScoutOutput {
  companyProfile?: string;
  recentSpendSignals?: string[];
  riskFlags?: string[];
  leverageForFreelancer?: string;
}

export function ClientDossier() {
  const deal = useDealStore((s) =>
    s.deals.find((d) => d.id === s.selectedDealId)
  );

  if (!deal) return null;

  // Pull most recent Scout trace
  const scoutTrace = [...deal.agentTraces]
    .filter((t) => t.agentName === "scout")
    .sort((a, b) => b.round - a.round)[0];

  if (!scoutTrace) return null;

  let scout: ScoutOutput = {};
  try {
    scout = JSON.parse(scoutTrace.output);
  } catch {}

  const companyInitials = deal.client.company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]">
          Client Dossier · Scout
        </div>
        <div className="font-mono text-[9px] text-[var(--color-text-dim)]">
          R{scoutTrace.round} · {scoutTrace.latencyMs}ms
        </div>
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 bg-[var(--color-text)] text-[var(--color-bg)] flex items-center justify-center font-mono text-sm font-bold shrink-0"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {companyInitials}
        </div>
        <div className="min-w-0">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "-0.01em" }}>
            {deal.client.company}
          </div>
          <div className="font-mono text-[10px] text-[var(--color-text-muted)] truncate">
            {deal.client.contactEmail}
          </div>
        </div>
      </div>

      {scout.companyProfile && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
            <Building2 className="w-2.5 h-2.5" />
            Profile
          </div>
          <p className="text-xs leading-relaxed">{scout.companyProfile}</p>
        </div>
      )}

      {scout.recentSpendSignals && scout.recentSpendSignals.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
            <DollarSign className="w-2.5 h-2.5" />
            Spend signals
          </div>
          <ul className="space-y-1">
            {scout.recentSpendSignals.map((s, i) => (
              <li key={i} className="text-xs flex gap-2">
                <span className="text-[var(--color-accept)]">▸</span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {scout.riskFlags && scout.riskFlags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-[var(--color-signal)] mb-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            Risk flags
          </div>
          <ul className="space-y-1">
            {scout.riskFlags.map((s, i) => (
              <li key={i} className="text-xs flex gap-2">
                <span className="text-[var(--color-signal)]">▸</span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {scout.leverageForFreelancer && (
        <div className="border-t border-[var(--color-border)] pt-3 mt-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-[var(--color-warn)] mb-1">
            <Zap className="w-2.5 h-2.5" />
            Your leverage
          </div>
          <p className="text-xs leading-relaxed italic">{scout.leverageForFreelancer}</p>
        </div>
      )}
    </div>
  );
}
