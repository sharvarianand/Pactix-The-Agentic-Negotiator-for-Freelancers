"use client";

import { useRouter } from "next/navigation";
import { Sparkles, MessageSquareReply, ArrowRight, FileText, CreditCard, Edit3, Globe } from "lucide-react";
import { toast } from "sonner";
import { useDealStore } from "@/store/deal-store";
import { cn, formatCurrency, formatRelative } from "@/lib/utils";
import { DealReplay } from "@/components/DealReplay";
import { MonteCarloSimulator } from "@/components/MonteCarloSimulator";
import { RedlineViewer } from "@/components/RedlineViewer";

export function EmailDetail() {
  const router = useRouter();
  const deal = useDealStore((s) =>
    s.deals.find((d) => d.id === s.selectedDealId)
  );
  const dispatching = useDealStore((s) => s.dispatching);
  const dispatchCouncil = useDealStore((s) => s.dispatchCouncil);
  const simulateClientReply = useDealStore((s) => s.simulateClientReply);
  const closeDeal = useDealStore((s) => s.closeDeal);
  const live = useDealStore((s) => s.live);
  const openApproveReply = useDealStore((s) => s.openApproveReply);

  if (!deal) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-dim)]">
        Select a deal.
      </div>
    );
  }

  const judgeOut = live.judge.output as
    | { decision?: string; recommendedCounter?: number }
    | null;
  const canClose =
    deal.status === "accepted" ||
    (judgeOut?.decision === "accept" && !!deal.agreedAmount);

  const hasPendingReply = deal.messages.some(
    (m) => m.direction === "outbound" && !m.approvedByUser
  );
  const repliesSent = deal.messages.filter(
    (m) => m.direction === "outbound" && m.approvedByUser
  );

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[var(--color-border)] flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">
            {deal.client.company}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">
            {deal.client.contactEmail}
          </div>
          {deal.agreedAmount && (
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              Working amount:{" "}
              <span className="text-[var(--color-accept)] font-medium">
                {formatCurrency(deal.agreedAmount)}
              </span>
              {deal.winProbability != null && (
                <span className="ml-2">
                  · Win probability{" "}
                  <span className="text-[var(--color-text)]">
                    {Math.round((deal.winProbability || 0) * 100)}%
                  </span>
                </span>
              )}
            </div>
          )}
          {deal.agentTraces.length > 0 && (
            <div className="flex items-center gap-3">
              <DealReplay />
              <MonteCarloSimulator />
              <RedlineViewer />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasPendingReply && (
            <button
              onClick={() => {
                const pending = deal.messages
                  .filter((m) => m.direction === "outbound" && !m.approvedByUser)
                  .slice(-1)[0];
                if (pending) openApproveReply(pending.body);
              }}
              className="text-xs px-3 py-2 border border-[var(--color-signal)] text-[var(--color-signal)] hover:bg-[var(--color-signal-soft)] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Review pending reply
            </button>
          )}

          {repliesSent.length > 0 && deal.status === "negotiating" && (
            <button
              onClick={() => simulateClientReply(deal.id).then(() => toast("Client reply simulated — click Send to Pactix"))}
              disabled={dispatching}
              className="text-xs px-3 py-2 rounded-md border border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)] text-[var(--color-text-muted)] flex items-center gap-1.5"
            >
              <MessageSquareReply className="w-3.5 h-3.5" />
              Simulate client reply
            </button>
          )}

          {canClose && (
            <button
              onClick={() => closeDeal(deal.id)}
              className="text-xs px-3 py-2 rounded-md bg-[var(--color-closer)] text-black font-medium flex items-center gap-1.5 hover:opacity-90"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate contract & invoice
            </button>
          )}

          <button
            onClick={() => {
              if (hasPendingReply) {
                toast.warning("Approve the pending reply first, then re-dispatch.");
                return;
              }
              if (deal.status === "closed") {
                toast("This deal is already closed.");
                return;
              }
              dispatchCouncil(deal.id);
              router.push("/agents");
            }}
            disabled={dispatching}
            className={cn(
              "text-sm px-5 py-2.5 font-semibold flex items-center gap-2 transition-all",
              dispatching
                ? "bg-[var(--color-panel-2)] text-[var(--color-text-dim)] cursor-not-allowed"
                : hasPendingReply || deal.status === "closed"
                ? "bg-[var(--color-panel-2)] text-[var(--color-text-dim)]"
                : "bg-[var(--color-signal)] text-white hover:bg-[var(--color-signal-hover)]"
            )}
          >
            <Sparkles className="w-4 h-4" />
            {dispatching ? "Deliberating…" : hasPendingReply ? "Approval pending" : "Send to Pactix"}
            {!dispatching && !hasPendingReply && deal.status !== "closed" && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {deal.messages.map((m, idx) => {
          // Find corresponding orchestrator trace for inbound messages
          let detectedLang = null;
          if (m.direction === "inbound") {
            const inboundIndex = deal.messages.slice(0, idx + 1).filter(msg => msg.direction === "inbound").length;
            const trace = deal.agentTraces.find(t => t.agentName === "orchestrator" && t.round === inboundIndex);
            if (trace) {
              try {
                const parsed = JSON.parse(trace.output);
                if (parsed.detectedLanguage) {
                  detectedLang = parsed.detectedLanguage;
                }
              } catch (e) {}
            }
          }

          return (
            <div
              key={m.id}
              className={cn(
                "rounded-lg border p-4 whitespace-pre-wrap text-sm leading-relaxed",
                m.direction === "inbound"
                  ? "bg-[var(--color-panel)] border-[var(--color-border)]"
                  : "bg-[var(--color-negotiator)]/5 border-[var(--color-negotiator)]/30"
              )}
            >
              <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium uppercase tracking-wider",
                      m.direction === "inbound"
                        ? "text-[var(--color-text-muted)]"
                        : "text-[var(--color-negotiator)]"
                    )}
                  >
                    {m.direction === "inbound"
                      ? `From: ${deal.client.contactEmail}`
                      : "Sent via Pactix"}
                  </span>
                  {detectedLang && (
                    <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-panel-2)] uppercase">
                      <Globe className="w-2.5 h-2.5" />
                      {detectedLang}
                    </span>
                  )}
                </div>
                <span className="text-[var(--color-text-dim)]">
                {formatRelative(m.sentAt)}
                {m.direction === "outbound" && !m.approvedByUser && (
                  <button
                    onClick={() => openApproveReply(m.body)}
                    className="ml-2 text-[var(--color-signal)] underline underline-offset-2 hover:no-underline font-medium"
                  >
                    (pending approval · click to review)
                  </button>
                )}
              </span>
            </div>
            <div className="text-[var(--color-text)]">{m.body}</div>
          </div>
          );
        })}

        {deal.invoices.map((inv) => (
          <div
            key={inv.id}
            className="rounded-lg border border-[var(--color-closer)]/30 bg-[var(--color-closer)]/5 p-4"
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-closer)] mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              Stripe {inv.kind} invoice
              <span
                className={cn(
                  "ml-auto px-2 py-0.5 rounded text-[10px]",
                  inv.status === "paid"
                    ? "bg-[var(--color-accept)]/20 text-[var(--color-accept)]"
                    : "bg-[var(--color-warn)]/20 text-[var(--color-warn)]"
                )}
              >
                {inv.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              {formatCurrency(inv.amount)} via{" "}
              <a
                href={inv.stripePaymentLink}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] underline underline-offset-2"
              >
                {inv.stripePaymentLink}
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
