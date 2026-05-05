"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useDealStore } from "@/store/deal-store";
import { formatRelative } from "@/lib/utils";

const STATUS: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  closed:      { icon: CheckCircle2, color: "#16a34a", bg: "rgba(22,163,74,0.08)",  label: "Closed"      },
  accepted:    { icon: CheckCircle2, color: "#16a34a", bg: "rgba(22,163,74,0.08)",  label: "Accepted"    },
  pending:     { icon: Clock,        color: "#ca8a04", bg: "rgba(234,179,8,0.08)",  label: "Pending"     },
  negotiating: { icon: Clock,        color: "#ca8a04", bg: "rgba(234,179,8,0.08)",  label: "Negotiating" },
  lost:        { icon: AlertCircle,  color: "#dc2626", bg: "rgba(220,38,38,0.08)",  label: "Lost"        },
  rejected:    { icon: AlertCircle,  color: "#dc2626", bg: "rgba(220,38,38,0.08)",  label: "Rejected"    },
};

export default function DealsPage() {
  const { deals, loadDeals, selectDeal } = useDealStore();

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const closed = deals.filter((d) => d.status === "closed" || d.status === "accepted").length;
  const pending = deals.filter((d) => d.status === "pending" || d.status === "negotiating" || d.status === "new").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 px-8 py-6 border-b border-[var(--color-border)] flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
            Deal desk
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            All deals
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">Closed</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "-0.03em" }} className="text-green-600">
              {closed}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">Pending</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "-0.03em" }} className="text-[#ca8a04]">
              {pending}
            </div>
          </div>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          {deals.length === 0 ? (
            <div className="p-20 text-center text-sm text-[var(--color-text-muted)] font-mono">
              NO_DEALS_FOUND
            </div>
          ) : (
            deals.map((deal, i) => {
              const s = STATUS[deal.status] || STATUS.pending;
              const Icon = s.icon;
              const latestMsg = deal.messages[deal.messages.length - 1];
              
              return (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => selectDeal(deal.id)}
                  className="flex items-center gap-5 px-8 py-5 hover:bg-[var(--color-panel-2)] transition-colors group cursor-pointer"
                >
                  {/* avatar */}
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold"
                    style={{ background: "var(--color-panel-3)", color: "var(--color-text)" }}
                  >
                    {deal.client.company[0].toUpperCase()}
                  </div>

                  {/* main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm">{deal.client.company}</span>
                      <span className="text-[var(--color-text-muted)] text-xs">·</span>
                      <span className="text-xs text-[var(--color-text-muted)] truncate">{deal.briefText.slice(0, 50)}...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                        Latest: {latestMsg?.body.slice(0, 30) || "No messages"}...
                      </span>
                    </div>
                  </div>

                  {/* value */}
                  <div
                    style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", letterSpacing: "-0.03em" }}
                    className="shrink-0 hidden sm:block"
                  >
                    ${deal.agreedAmount || "---"}
                  </div>

                  {/* status badge */}
                  <div
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5"
                    style={{ background: s.bg }}
                  >
                    <Icon className="w-3 h-3" style={{ color: s.color }} />
                    <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: s.color }}>
                      {s.label}
                    </span>
                  </div>

                  {/* date */}
                  <div className="shrink-0 font-mono text-[10px] text-[var(--color-text-muted)] hidden lg:block w-32 text-right">
                    {formatRelative(deal.createdAt)}
                  </div>

                  {/* arrow */}
                  <Link href="/dashboard" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
