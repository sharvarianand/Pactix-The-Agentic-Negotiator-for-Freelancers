"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, DollarSign, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

const METRICS = [
  { label: "Total deals closed",  value: "48",    delta: "+12 this month", up: true,  icon: CheckCircle  },
  { label: "Avg rate uplift",     value: "+31%",  delta: "vs. manual",     up: true,  icon: TrendingUp   },
  { label: "Revenue generated",   value: "$284k", delta: "+$48k MoM",      up: true,  icon: DollarSign   },
  { label: "Avg verdict time",    value: "7.4s",  delta: "−1.2s MoM",      up: true,  icon: Clock        },
];

const DEALS = [
  { client: "Lumen Analytics",   value: "$1,200", agent: "Negotiator", status: "closed",  rate: "+38%", date: "Today"   },
  { client: "Vercel Inc.",       value: "$2,800", agent: "Negotiator", status: "pending", rate: "+22%", date: "Today"   },
  { client: "Linear",            value: "$950",   agent: "Judge",      status: "closed",  rate: "+18%", date: "Yest."   },
  { client: "Notion Labs",       value: "$4,500", agent: "Contract",   status: "closed",  rate: "+41%", date: "Yest."   },
  { client: "Figma",             value: "$3,200", agent: "Negotiator", status: "closed",  rate: "+29%", date: "Mon"     },
  { client: "Stripe",            value: "$1,800", agent: "Judge",      status: "pending", rate: "+15%", date: "Mon"     },
];

const BAR_DATA = [
  { label: "Jan", value: 28 },
  { label: "Feb", value: 34 },
  { label: "Mar", value: 41 },
  { label: "Apr", value: 38 },
  { label: "May", value: 56 },
  { label: "Jun", value: 48 },
];

const MAX_BAR = Math.max(...BAR_DATA.map((d) => d.value));

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  closed:  { bg: "rgba(22,163,74,0.08)",  color: "#16a34a" },
  pending: { bg: "rgba(234,179,8,0.08)",  color: "#ca8a04" },
};

export default function AnalyticsPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 px-8 py-6 border-b border-[var(--color-border)]">
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
          005 — Receipts
        </div>
        <h1
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.03em", lineHeight: 1 }}
        >
          Numbers that{" "}
          <span style={{ fontStyle: "italic" }} className="text-[var(--color-text-muted)]">matter.</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-8">
        {/* KPI grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-[var(--color-border)]">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[var(--color-bg)] p-6 flex flex-col gap-3 group hover:bg-[var(--color-panel-2)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                  {m.label}
                </div>
                <m.icon className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <div
                style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", letterSpacing: "-0.04em", lineHeight: 1 }}
              >
                {m.value}
              </div>
              <div className="flex items-center gap-1">
                {m.up
                  ? <ArrowUpRight className="w-3 h-3 text-green-600" />
                  : <ArrowDownRight className="w-3 h-3 text-[var(--color-signal)]" />}
                <span className="font-mono text-[10px] tracking-wider text-[var(--color-text-muted)]">
                  {m.delta}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts + table row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 lg:col-span-5 border border-[var(--color-border)] p-6"
          >
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-6">
              Deals closed / month
            </div>
            <div className="flex items-end gap-2 h-40">
              {BAR_DATA.map((b, i) => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: `${(b.value / MAX_BAR) * 100}%`,
                      background: i === BAR_DATA.length - 1 ? "var(--color-signal)" : "var(--color-text)",
                      transformOrigin: "bottom",
                    }}
                    className="w-full"
                  />
                  <span className="font-mono text-[9px] text-[var(--color-text-muted)]">{b.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agent performance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="col-span-12 lg:col-span-7 border border-[var(--color-border)] p-6"
          >
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-6">
              Agent performance
            </div>
            <div className="flex flex-col gap-3">
              {[
                { name: "Negotiator", pct: 96, deals: 42 },
                { name: "Prosecutor", pct: 91, deals: 44 },
                { name: "Judge",      pct: 97, deals: 44 },
                { name: "Scout",      pct: 94, deals: 44 },
              ].map((ag, i) => (
                <div key={ag.name} className="flex items-center gap-4">
                  <div className="w-24 text-xs text-[var(--color-text-muted)] shrink-0">{ag.name}</div>
                  <div className="flex-1 h-1.5 bg-[var(--color-border)] relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ag.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0"
                      style={{ background: i === 0 ? "var(--color-signal)" : "var(--color-text)" }}
                    />
                  </div>
                  <div className="w-10 text-right font-mono text-[11px] text-[var(--color-text-muted)]">
                    {ag.pct}%
                  </div>
                  <div className="w-12 text-right font-mono text-[10px] text-[var(--color-text-dim)]">
                    {ag.deals} deals
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent deals table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="border border-[var(--color-border)]"
        >
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
              Recent deals
            </div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
              {DEALS.length} entries
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["Client", "Value", "Rate uplift", "Closed by", "Status", "Date"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEALS.map((d, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-panel-2)] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{d.client}</td>
                    <td className="px-6 py-4" style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                      {d.value}
                    </td>
                    <td className="px-6 py-4 text-green-600 font-mono text-xs">{d.rate}</td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)] text-xs">{d.agent}</td>
                    <td className="px-6 py-4">
                      <span
                        className="font-mono text-[9px] tracking-widest uppercase px-2 py-1"
                        style={STATUS_STYLE[d.status]}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)] text-xs">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
