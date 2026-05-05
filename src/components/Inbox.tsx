"use client";

import { Inbox as InboxIcon, RefreshCw } from "lucide-react";
import { useDealStore, type DealRow } from "@/store/deal-store";
import { cn, formatRelative } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  negotiating: "bg-[var(--color-warn)]/15 text-[var(--color-warn)] border-[var(--color-warn)]/30",
  accepted: "bg-[var(--color-accept)]/15 text-[var(--color-accept)] border-[var(--color-accept)]/30",
  closed: "bg-[var(--color-accept)]/15 text-[var(--color-accept)] border-[var(--color-accept)]/30",
  lost: "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30",
  rejected: "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30",
};

function statusLabel(status: string) {
  return status[0].toUpperCase() + status.slice(1);
}

function InboxItem({
  deal,
  selected,
  onClick,
}: {
  deal: DealRow;
  selected: boolean;
  onClick: () => void;
}) {
  const latest = deal.messages[deal.messages.length - 1];
  const avatarLetter = deal.client.company[0]?.toUpperCase() || "?";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-[var(--color-border)] transition-colors",
        selected
          ? "bg-[var(--color-panel-2)]"
          : "hover:bg-[var(--color-panel-2)]/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-panel-2)] border border-[var(--color-border-strong)] flex items-center justify-center text-sm font-medium text-[var(--color-text-muted)]">
          {avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm truncate">
              {deal.client.company}
            </div>
            <div className="text-xs text-[var(--color-text-dim)] shrink-0">
              {formatRelative(deal.createdAt)}
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
            {latest?.body.slice(0, 80) || deal.briefText.slice(0, 80)}
          </div>
          <div className="mt-2">
            <span
              className={cn(
                "inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium",
                STATUS_STYLES[deal.status] || STATUS_STYLES.new
              )}
            >
              {statusLabel(deal.status)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function Inbox() {
  const deals = useDealStore((s) => s.deals);
  const loadDeals = useDealStore((s) => s.loadDeals);
  const selectedDealId = useDealStore((s) => s.selectedDealId);
  const selectDeal = useDealStore((s) => s.selectDeal);
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    const id = toast.loading("Scanning Gmail...");
    try {
      const res = await fetch("/api/sync/gmail", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      await loadDeals();
      toast.success("Inbox up to date", { id });
    } catch (e) {
      toast.error("Connect Gmail in settings first", { id });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <aside className="w-[300px] shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
        <InboxIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
        <div className="text-sm font-medium">Inbox</div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="ml-2 p-1 hover:bg-[var(--color-panel-2)] transition-colors rounded"
        >
          <RefreshCw className={cn("w-3 h-3 text-[var(--color-text-muted)]", syncing && "animate-spin")} />
        </button>
        <div className="ml-auto text-xs text-[var(--color-text-dim)]">
          {deals.length}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {deals.length === 0 ? (
          <div className="p-6 text-sm text-[var(--color-text-dim)] text-center">
            No deals yet.
          </div>
        ) : (
          deals.map((d) => (
            <InboxItem
              key={d.id}
              deal={d}
              selected={d.id === selectedDealId}
              onClick={() => selectDeal(d.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
