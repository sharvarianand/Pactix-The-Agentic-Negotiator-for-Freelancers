"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice6, TrendingUp, X, Loader2 } from "lucide-react";
import { useDealStore } from "@/store/deal-store";
import { formatCurrency } from "@/lib/utils";

interface SimResult {
  aggression: number;
  runs: number;
  medianOutcome: number;
  meanOutcome: number;
  closeRate: number;
  p10: number;
  p90: number;
  distribution: number[];
}

function runSimulation(
  askAmount: number,
  winProb: number,
  aggression: number,
  runs: number = 200
): SimResult {
  const outcomes: number[] = [];

  for (let i = 0; i < runs; i++) {
    // Base close probability decays with aggression
    const baseClose = winProb * (1 - aggression * 0.3);
    // Random variation
    const noise = (Math.random() - 0.5) * 0.2;
    const closeProb = Math.max(0.05, Math.min(0.98, baseClose + noise));

    if (Math.random() < closeProb) {
      // Deal closes — outcome is some fraction of the ask
      const priceMultiplier = 0.7 + aggression * 0.4 + (Math.random() - 0.5) * 0.3;
      outcomes.push(Math.round(askAmount * Math.max(0.5, Math.min(1.5, priceMultiplier))));
    } else {
      outcomes.push(0); // Deal lost
    }
  }

  outcomes.sort((a, b) => a - b);
  const successful = outcomes.filter((o) => o > 0);
  const closeRate = successful.length / runs;
  const median = outcomes[Math.floor(runs / 2)];
  const mean = Math.round(outcomes.reduce((a, b) => a + b, 0) / runs);
  const p10 = outcomes[Math.floor(runs * 0.1)];
  const p90 = outcomes[Math.floor(runs * 0.9)];

  // Distribution buckets (10 buckets)
  const max = Math.max(...outcomes, 1);
  const bucketSize = max / 10;
  const distribution = Array(10).fill(0);
  for (const o of outcomes) {
    const bucket = Math.min(9, Math.floor(o / bucketSize));
    distribution[bucket]++;
  }

  return {
    aggression,
    runs,
    medianOutcome: median,
    meanOutcome: mean,
    closeRate,
    p10,
    p90,
    distribution,
  };
}

export function MonteCarloSimulator() {
  const deal = useDealStore((s) => s.deals.find((d) => d.id === s.selectedDealId));
  const [open, setOpen] = useState(false);
  const [aggression, setAggression] = useState(0.5);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const simulate = useCallback(() => {
    if (!deal) return;
    setRunning(true);

    // Simulate async to show loading
    setTimeout(() => {
      const askAmount = deal.agreedAmount || 550;
      const winProb = deal.winProbability || 0.7;
      const sim = runSimulation(askAmount, winProb, aggression, 200);
      setResult(sim);
      setRunning(false);
    }, 600);
  }, [deal, aggression]);

  if (!deal) return null;

  const maxDist = result ? Math.max(...result.distribution) : 0;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(true); setResult(null); }}
        className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <Dice6 className="w-3 h-3" />
        What-If
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-[var(--color-panel)] border border-[var(--color-border-strong)] shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Dice6 className="w-4 h-4 text-[var(--color-signal)]" />
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                      Monte Carlo What-If
                    </span>
                  </div>
                  <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] mt-0.5">
                    200 simulated negotiations · {deal.client.company}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Aggression slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]">
                      Aggression level
                    </div>
                    <div className="font-mono text-xs">
                      {Math.round(aggression * 100)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[8px] text-[var(--color-text-muted)]">SOFT</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={aggression}
                      onChange={(e) => setAggression(parseFloat(e.target.value))}
                      className="flex-1 h-1 appearance-none bg-[var(--color-border)] cursor-pointer"
                      style={{
                        accentColor: "var(--color-signal)",
                      }}
                    />
                    <span className="font-mono text-[8px] text-[var(--color-signal)]">HARD</span>
                  </div>
                </div>

                {/* Run button */}
                <button
                  onClick={simulate}
                  disabled={running}
                  className="w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: "var(--color-signal)", color: "#fff" }}
                >
                  {running ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Simulating 200 deals…</>
                  ) : (
                    <><Dice6 className="w-4 h-4" /> Run simulation</>
                  )}
                </button>

                {/* Results */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* KPI row */}
                    <div className="grid grid-cols-3 gap-px bg-[var(--color-border)]">
                      {[
                        ["Median outcome", formatCurrency(result.medianOutcome)],
                        ["Close rate", `${Math.round(result.closeRate * 100)}%`],
                        ["Expected value", formatCurrency(result.meanOutcome)],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-[var(--color-bg)] p-4">
                          <div className="font-mono text-[8px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
                            {label}
                          </div>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "-0.02em" }}>
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Distribution chart */}
                    <div className="border border-[var(--color-border)] p-4">
                      <div className="font-mono text-[8px] tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                        Outcome distribution
                      </div>
                      <div className="flex items-end gap-1 h-20">
                        {result.distribution.map((count, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1"
                            style={{
                              height: `${(count / maxDist) * 100}%`,
                              background: i === 0 ? "var(--color-danger)" : i > 7 ? "var(--color-accept)" : "var(--color-text)",
                              transformOrigin: "bottom",
                              minHeight: count > 0 ? "4px" : "0",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 font-mono text-[7px] text-[var(--color-text-dim)]">
                        <span>$0</span>
                        <span>{formatCurrency(result.p10)} (P10)</span>
                        <span>{formatCurrency(result.p90)} (P90)</span>
                      </div>
                    </div>

                    {/* Insight */}
                    <div className="flex items-start gap-2 p-3 bg-[var(--color-panel-2)] border border-[var(--color-border)]">
                      <TrendingUp className="w-3.5 h-3.5 text-[var(--color-accept)] shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        At {Math.round(aggression * 100)}% aggression, your median outcome is{" "}
                        <strong className="text-[var(--color-text)]">{formatCurrency(result.medianOutcome)}</strong>{" "}
                        with a{" "}
                        <strong className="text-[var(--color-text)]">{Math.round(result.closeRate * 100)}%</strong>{" "}
                        close rate across 200 simulated negotiations.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
