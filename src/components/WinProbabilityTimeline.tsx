"use client";

import { useDealStore } from "@/store/deal-store";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RoundPoint {
  round: number;
  probability: number;
  amount: number | null;
  decision: string;
  ev: number;
}

export function WinProbabilityTimeline() {
  const deal = useDealStore((s) =>
    s.deals.find((d) => d.id === s.selectedDealId)
  );

  if (!deal) return null;

  // Extract round-by-round judge decisions
  const judgeTraces = deal.agentTraces
    .filter((t) => t.agentName === "judge")
    .sort((a, b) => a.round - b.round);

  if (judgeTraces.length === 0) return null;

  const points: RoundPoint[] = judgeTraces.map((t) => {
    let parsed: { winProbability?: number; recommendedCounter?: number; decision?: string } = {};
    try {
      parsed = JSON.parse(t.output);
    } catch {}
    const prob = parsed.winProbability ?? 0;
    const amount = parsed.recommendedCounter ?? null;
    return {
      round: t.round,
      probability: prob,
      amount,
      decision: parsed.decision ?? "—",
      ev: amount ? Math.round(prob * amount) : 0,
    };
  });

  const maxR = Math.max(...points.map((p) => p.round), 1);
  const latest = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = prev ? latest.probability - prev.probability : 0;
  const evDelta = prev ? latest.ev - prev.ev : 0;
  const maxEv = Math.max(...points.map((p) => p.ev), 1);

  const w = 100;
  const h = 40;
  const xStep = points.length > 1 ? w / (points.length - 1) : w;

  // Win probability path
  const probPathD = points
    .map((p, i) => {
      const x = i * xStep;
      const y = h - p.probability * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const probAreaD = probPathD + ` L ${(points.length - 1) * xStep} ${h} L 0 ${h} Z`;

  // EV path (normalized to chart height)
  const evPathD = points
    .map((p, i) => {
      const x = i * xStep;
      const y = h - (p.ev / maxEv) * h * 0.9; // 90% height max to avoid overlap
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const evAreaD = evPathD + ` L ${(points.length - 1) * xStep} ${h} L 0 ${h} Z`;

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      {/* Header row — Win Prob + EV */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] mb-0.5">
            Win Probability · Round {maxR}
          </div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
              {Math.round(latest.probability * 100)}%
            </span>
            {prev && (
              <span
                className={`flex items-center gap-1 font-mono text-[10px] ${
                  delta > 0
                    ? "text-[var(--color-accept)]"
                    : delta < 0
                    ? "text-[var(--color-signal)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {delta > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : delta < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {delta > 0 ? "+" : ""}
                {Math.round(delta * 100)}%
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] mb-0.5">
            Expected Value
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
              {latest.ev > 0 ? formatCurrency(latest.ev) : "—"}
            </span>
            {prev && evDelta !== 0 && (
              <span
                className={`flex items-center gap-0.5 font-mono text-[9px] ${
                  evDelta > 0
                    ? "text-[var(--color-accept)]"
                    : "text-[var(--color-signal)]"
                }`}
              >
                <DollarSign className="w-2.5 h-2.5" />
                {evDelta > 0 ? "+" : ""}
                {evDelta.toLocaleString()}
              </span>
            )}
          </div>
          <div className="font-mono text-[8px] text-[var(--color-text-dim)] mt-0.5">
            {latest.amount ? `${formatCurrency(latest.amount)} × ${Math.round(latest.probability * 100)}%` : ""}
          </div>
        </div>
      </div>

      {/* Recommended amount */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="font-mono text-[8px] tracking-widest uppercase text-[var(--color-text-dim)]">
          Recommended: {latest.amount ? formatCurrency(latest.amount) : "—"}
        </div>
        <div className="flex items-center gap-3 font-mono text-[8px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-[2px] bg-[var(--color-signal)] inline-block" />
            <span className="text-[var(--color-text-dim)]">Win%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-[2px] bg-[var(--color-accept)] inline-block" />
            <span className="text-[var(--color-text-dim)]">EV</span>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16">
        <defs>
          <linearGradient id="probFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-signal)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-signal)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="evFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accept)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-accept)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines at 25/50/75 */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={w}
            y1={h - t * h}
            y2={h - t * h}
            stroke="var(--color-border)"
            strokeWidth="0.2"
            strokeDasharray="1 1"
          />
        ))}
        {/* EV area + line (behind) */}
        <path d={evAreaD} fill="url(#evFill)" />
        <path d={evPathD} fill="none" stroke="var(--color-accept)" strokeWidth="0.5" strokeDasharray="1.5 1" />
        {/* Probability area + line (front) */}
        <path d={probAreaD} fill="url(#probFill)" />
        <path d={probPathD} fill="none" stroke="var(--color-signal)" strokeWidth="0.6" />
        {/* Win prob dots */}
        {points.map((p, i) => (
          <circle
            key={`prob-${i}`}
            cx={i * xStep}
            cy={h - p.probability * h}
            r="0.9"
            fill="var(--color-signal)"
          />
        ))}
        {/* EV dots */}
        {points.map((p, i) => (
          <circle
            key={`ev-${i}`}
            cx={i * xStep}
            cy={h - (p.ev / maxEv) * h * 0.9}
            r="0.7"
            fill="var(--color-accept)"
          />
        ))}
      </svg>

      <div className="flex justify-between mt-2 font-mono text-[9px] text-[var(--color-text-muted)]">
        {points.map((p) => (
          <span key={p.round}>R{p.round}</span>
        ))}
      </div>
    </div>
  );
}
