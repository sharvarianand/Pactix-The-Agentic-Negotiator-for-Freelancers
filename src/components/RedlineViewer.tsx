"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileWarning, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useDealStore } from "@/store/deal-store";

interface RedlineItem {
  clause: string;
  original: string;
  redlined: string;
  severity: "critical" | "major" | "minor";
  reason: string;
}

// Simulated redline analysis — in production this would call an LLM
function analyzeContract(scope: string, deal: { agreedAmount: number | null; client: { company: string } }): RedlineItem[] {
  let parsed: { deliverables?: string[]; revisions?: number; timeline?: string; depositPct?: number; amount?: number } = {};
  try { parsed = JSON.parse(scope); } catch {}

  const items: RedlineItem[] = [];

  // Check revision cap
  if (parsed.revisions && parsed.revisions > 2) {
    items.push({
      clause: "Revision Clause",
      original: `${parsed.revisions} revisions included`,
      redlined: `2 revisions included (additional at $150/hr)`,
      severity: "major",
      reason: `${parsed.revisions} revisions is above market standard. Cap at 2 with hourly overage.`,
    });
  }

  // Check deposit percentage
  if (parsed.depositPct && parsed.depositPct < 0.5) {
    items.push({
      clause: "Payment Terms",
      original: `${Math.round(parsed.depositPct * 100)}% deposit upfront`,
      redlined: `50% deposit upfront, 50% on delivery`,
      severity: "critical",
      reason: `A ${Math.round(parsed.depositPct * 100)}% deposit exposes you to non-payment risk. Industry standard is 50%.`,
    });
  }

  // Check timeline
  if (parsed.timeline) {
    const hasRush = parsed.timeline.toLowerCase().includes("rush") || parsed.timeline.toLowerCase().includes("asap");
    if (hasRush) {
      items.push({
        clause: "Timeline",
        original: parsed.timeline,
        redlined: `${parsed.timeline} (+25% rush surcharge applied)`,
        severity: "major",
        reason: "Rush work should always include a surcharge. Add 25% minimum.",
      });
    }
  }

  // IP ownership clause
  items.push({
    clause: "IP Assignment",
    original: "Work product assigned to client upon final payment",
    redlined: "Work product assigned to client upon receipt of FINAL payment. Freelancer retains portfolio usage rights.",
    severity: "minor",
    reason: "Ensure IP only transfers after all payments clear. Retain portfolio rights.",
  });

  // Scope creep protection
  items.push({
    clause: "Scope Creep Protection",
    original: "(not present in contract)",
    redlined: `Any work outside the agreed deliverables requires a written change order and may incur additional fees at $${deal.agreedAmount ? Math.round(deal.agreedAmount * 0.1) : 100}/hr.`,
    severity: "critical",
    reason: `No scope creep clause detected. ${deal.client.company} may request unlimited additions without this protection.`,
  });

  // Late payment penalty
  items.push({
    clause: "Late Payment",
    original: "(not present in contract)",
    redlined: "Invoices overdue by 15+ days incur a 1.5% monthly late fee. Work pauses on invoices overdue by 30+ days.",
    severity: "major",
    reason: "Without late payment terms, you have no recourse for delayed payments.",
  });

  // Kill fee
  if (deal.agreedAmount && deal.agreedAmount > 500) {
    items.push({
      clause: "Cancellation / Kill Fee",
      original: "(not present in contract)",
      redlined: `If ${deal.client.company} cancels after work begins, a kill fee of 25% of the total contract value ($${Math.round(deal.agreedAmount * 0.25)}) is due within 7 days.`,
      severity: "minor",
      reason: "Protect against abrupt cancellations after you've committed time and turned down other work.",
    });
  }

  return items;
}

const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: "rgba(255,26,0,0.08)", color: "#ff1a00", label: "CRITICAL" },
  major: { bg: "rgba(184,150,12,0.08)", color: "#b8960c", label: "MAJOR" },
  minor: { bg: "rgba(115,115,115,0.08)", color: "#737373", label: "MINOR" },
};

export function RedlineViewer() {
  const deal = useDealStore((s) => s.deals.find((d) => d.id === s.selectedDealId));
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RedlineItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  if (!deal || !deal.scope) return null;

  function runAnalysis() {
    if (!deal || !deal.scope) return;
    setOpen(true);
    setAnalyzing(true);
    setTimeout(() => {
      const result = analyzeContract(deal.scope!, deal);
      setItems(result);
      setAnalyzing(false);
    }, 800);
  }

  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const majorCount = items.filter((i) => i.severity === "major").length;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={runAnalysis}
        className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[var(--color-signal)] hover:text-[var(--color-signal-hover)] transition-colors"
      >
        <FileWarning className="w-3 h-3" />
        Redline
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
              className="w-full max-w-2xl bg-[var(--color-panel)] border border-[var(--color-border-strong)] shadow-2xl flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-[var(--color-signal)]" />
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                      Contract Redline
                    </span>
                  </div>
                  <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] mt-0.5">
                    AI adversarial review · {deal.client.company}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {analyzing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[var(--color-signal)] animate-spin" />
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">
                      Redline agent analyzing contract...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary bar */}
                  <div className="px-6 py-3 border-b border-[var(--color-border)] flex items-center gap-4 bg-[var(--color-panel-2)]">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-[#ff1a00]" />
                      <span className="font-mono text-[9px] tracking-widest text-[#ff1a00]">
                        {criticalCount} CRITICAL
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-[#b8960c]" />
                      <span className="font-mono text-[9px] tracking-widest text-[#b8960c]">
                        {majorCount} MAJOR
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-accept)]" />
                      <span className="font-mono text-[9px] tracking-widest text-[var(--color-text-muted)]">
                        {items.length} TOTAL FINDINGS
                      </span>
                    </div>
                  </div>

                  {/* Redline items */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {items.map((item, i) => {
                      const style = SEVERITY_STYLE[item.severity];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="border p-4"
                          style={{ borderColor: `${style.color}30`, background: style.bg }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{item.clause}</span>
                            <span
                              className="font-mono text-[8px] tracking-widest px-2 py-0.5"
                              style={{ background: `${style.color}15`, color: style.color }}
                            >
                              {style.label}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex gap-2">
                              <span className="font-mono text-[8px] tracking-widest uppercase text-[var(--color-text-dim)] shrink-0 w-16 pt-0.5">
                                Before
                              </span>
                              <span className="text-[var(--color-text-muted)] line-through decoration-[var(--color-signal)]/50">
                                {item.original}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-mono text-[8px] tracking-widest uppercase text-[var(--color-accept)] shrink-0 w-16 pt-0.5">
                                After
                              </span>
                              <span className="text-[var(--color-text)] font-medium">
                                {item.redlined}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-[var(--color-border)] mt-2">
                              <span className="text-[var(--color-text-muted)] italic">
                                {item.reason}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
