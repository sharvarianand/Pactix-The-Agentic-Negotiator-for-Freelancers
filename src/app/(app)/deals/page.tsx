"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, CheckCircle2, AlertCircle, Inbox } from "lucide-react";
import Link from "next/link";

const DEALS = [
  {
    id: "d1", client: "Lumen Analytics", project: "Brand identity + design system",
    value: "$1,200", ask: "$150", rate: "+38%", status: "closed",
    agent: "Negotiator", date: "Today · 2:14pm", avatar: "LA",
  },
  {
    id: "d2", client: "Vercel Inc.", project: "Marketing site redesign",
    value: "$2,800", ask: "$2,200", rate: "+27%", status: "pending",
    agent: "Judge", date: "Today · 10:08am", avatar: "VI",
  },
  {
    id: "d3", client: "Linear", project: "Dashboard UX audit",
    value: "$950", ask: "$800", rate: "+18%", status: "closed",
    agent: "Contract", date: "Yesterday · 4:51pm", avatar: "LN",
  },
  {
    id: "d4", client: "Notion Labs", project: "API docs + developer experience",
    value: "$4,500", ask: "$3,000", rate: "+50%", status: "closed",
    agent: "Negotiator", date: "Yesterday · 11:30am", avatar: "NL",
  },
  {
    id: "d5", client: "Figma", project: "Component library audit",
    value: "$3,200", ask: "$2,800", rate: "+14%", status: "closed",
    agent: "Judge", date: "Mon · 3:15pm", avatar: "FG",
  },
  {
    id: "d6", client: "Stripe", project: "Onboarding flow redesign",
    value: "$1,800", ask: "$1,600", rate: "+12%", status: "pending",
    agent: "Prosecutor", date: "Mon · 9:40am", avatar: "ST",
  },
];

const STATUS: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  closed:  { icon: CheckCircle2, color: "#16a34a", bg: "rgba(22,163,74,0.08)",  label: "Closed"  },
  pending: { icon: Clock,        color: "#ca8a04", bg: "rgba(234,179,8,0.08)",  label: "Pending" },
  lost:    { icon: AlertCircle,  color: "#dc2626", bg: "rgba(220,38,38,0.08)",  label: "Lost"    },
};

export default function DealsPage() {
  const closed = DEALS.filter((d) => d.status === "closed").length;
  const pending = DEALS.filter((d) => d.status === "pending").length;

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
          {DEALS.map((deal, i) => {
            const s = STATUS[deal.status];
            const Icon = s.icon;
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex items-center gap-5 px-8 py-5 hover:bg-[var(--color-panel-2)] transition-colors group cursor-pointer"
              >
                {/* avatar */}
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold"
                  style={{ background: "var(--color-panel-3)", color: "var(--color-text)" }}
                >
                  {deal.avatar}
                </div>

                {/* main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{deal.client}</span>
                    <span className="text-[var(--color-text-muted)] text-xs">·</span>
                    <span className="text-xs text-[var(--color-text-muted)] truncate">{deal.project}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                      Asked {deal.ask}
                    </span>
                    <span className="font-mono text-[9px] text-green-600">↑ {deal.rate}</span>
                    <span className="font-mono text-[9px] text-[var(--color-text-muted)]">via {deal.agent}</span>
                  </div>
                </div>

                {/* value */}
                <div
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", letterSpacing: "-0.03em" }}
                  className="shrink-0 hidden sm:block"
                >
                  {deal.value}
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
                  {deal.date}
                </div>

                {/* arrow */}
                <Link href="/dashboard" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
