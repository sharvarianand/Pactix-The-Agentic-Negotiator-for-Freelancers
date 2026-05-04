"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Search,
  LayoutGrid,
  Bot,
  BarChart3,
  Inbox,
  Settings,
  Sparkles,
  FileText,
  MessageSquareReply,
  ArrowRight,
  Keyboard,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDealStore } from "@/store/deal-store";

interface PaletteAction {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const deal = useDealStore((s) =>
    s.deals.find((d) => d.id === s.selectedDealId)
  );
  const dispatching = useDealStore((s) => s.dispatching);
  const dispatchCouncil = useDealStore((s) => s.dispatchCouncil);
  const openApproveReply = useDealStore((s) => s.openApproveReply);
  const selectDeal = useDealStore((s) => s.selectDeal);
  const deals = useDealStore((s) => s.deals);
  const simulateClientReply = useDealStore((s) => s.simulateClientReply);

  const hasPendingReply = deal?.messages.some(
    (m) => m.direction === "outbound" && !m.approvedByUser
  );

  const actions: PaletteAction[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: LayoutGrid,
      category: "Navigation",
      action: () => { router.push("/dashboard"); setOpen(false); },
    },
    {
      id: "nav-agents",
      label: "Go to Agents",
      icon: Bot,
      category: "Navigation",
      action: () => { router.push("/agents"); setOpen(false); },
    },
    {
      id: "nav-analytics",
      label: "Go to Analytics",
      icon: BarChart3,
      category: "Navigation",
      action: () => { router.push("/analytics"); setOpen(false); },
    },
    {
      id: "nav-deals",
      label: "Go to Deals",
      icon: Inbox,
      category: "Navigation",
      action: () => { router.push("/deals"); setOpen(false); },
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: Settings,
      category: "Navigation",
      action: () => { router.push("/settings"); setOpen(false); },
    },
    // Actions
    ...(deal && !dispatching && !hasPendingReply && deal.status !== "closed"
      ? [{
          id: "dispatch",
          label: "Send to Pactix (Dispatch Council)",
          shortcut: "D",
          icon: Sparkles,
          category: "Actions",
          action: () => {
            dispatchCouncil(deal.id);
            router.push("/agents");
            setOpen(false);
          },
        }]
      : []),
    ...(deal && hasPendingReply
      ? [{
          id: "approve",
          label: "Review Pending Reply",
          shortcut: "A",
          icon: FileText,
          category: "Actions",
          action: () => {
            const pending = deal.messages
              .filter((m) => m.direction === "outbound" && !m.approvedByUser)
              .slice(-1)[0];
            if (pending) openApproveReply(pending.body);
            setOpen(false);
          },
        }]
      : []),
    ...(deal && deal.status === "negotiating"
      ? [{
          id: "simulate",
          label: "Simulate Client Reply",
          icon: MessageSquareReply,
          category: "Actions",
          action: () => {
            simulateClientReply(deal.id).then(() =>
              toast("Client reply simulated")
            );
            setOpen(false);
          },
        }]
      : []),
    // Deal switching
    ...deals.map((d, i) => ({
      id: `deal-${d.id}`,
      label: `Switch to: ${d.client.company}`,
      shortcut: i < 9 ? `${i + 1}` : undefined,
      icon: ArrowRight,
      category: "Deals",
      action: () => { selectDeal(d.id); setOpen(false); },
    })),
  ];

  const filtered = query.trim()
    ? actions.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      )
    : actions;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIdx(0);
        return;
      }

      // Shortcuts only when palette is closed and not in an input
      if (!open) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
        if (isInput) return;

        if (e.key === "d" || e.key === "D") {
          if (deal && !dispatching && !hasPendingReply && deal.status !== "closed") {
            e.preventDefault();
            dispatchCouncil(deal.id);
            router.push("/agents");
          }
        }
        if (e.key === "a" || e.key === "A") {
          if (deal && hasPendingReply) {
            e.preventDefault();
            const pending = deal.messages
              .filter((m) => m.direction === "outbound" && !m.approvedByUser)
              .slice(-1)[0];
            if (pending) openApproveReply(pending.body);
          }
        }
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          const idx = deals.findIndex((d) => d.id === deal?.id);
          const next = deals[(idx + 1) % deals.length];
          if (next) selectDeal(next.id);
        }
      }
    },
    [open, deal, dispatching, hasPendingReply, deals, dispatchCouncil, openApproveReply, selectDeal, router, simulateClientReply]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Arrow keys + Enter inside palette
  const handlePaletteKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selectedIdx]?.action();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setQuery(""); setSelectedIdx(0); }}
        className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)] transition-colors text-xs text-[var(--color-text-muted)]"
        title="Command palette (⌘K)"
      >
        <Command className="w-3 h-3" />
        <span className="hidden sm:inline">⌘K</span>
      </button>

      {/* Palette modal */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--color-panel)] border border-[var(--color-border-strong)] shadow-2xl overflow-hidden"
              onKeyDown={handlePaletteKey}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
                <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-dim)]"
                />
                <kbd className="hidden sm:inline font-mono text-[9px] text-[var(--color-text-dim)] border border-[var(--color-border)] px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[360px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[var(--color-text-dim)]">
                    No results found.
                  </div>
                ) : (
                  <>
                    {/* Group by category */}
                    {Array.from(new Set(filtered.map((a) => a.category))).map((cat) => (
                      <div key={cat}>
                        <div className="px-4 pt-3 pb-1 font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]">
                          {cat}
                        </div>
                        {filtered
                          .filter((a) => a.category === cat)
                          .map((a) => {
                            const globalIdx = filtered.indexOf(a);
                            const Icon = a.icon;
                            return (
                              <button
                                key={a.id}
                                onClick={a.action}
                                onMouseEnter={() => setSelectedIdx(globalIdx)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                style={{
                                  background: globalIdx === selectedIdx ? "var(--color-panel-2)" : "transparent",
                                }}
                              >
                                <Icon className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                                <span className="flex-1 text-left truncate">{a.label}</span>
                                {a.shortcut && (
                                  <kbd className="font-mono text-[9px] text-[var(--color-text-dim)] border border-[var(--color-border)] px-1.5 py-0.5 shrink-0">
                                    {a.shortcut}
                                  </kbd>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono text-[9px] text-[var(--color-text-dim)]">
                  <span className="flex items-center gap-1">
                    <Keyboard className="w-3 h-3" /> D dispatch
                  </span>
                  <span>A approve</span>
                  <span>N next deal</span>
                </div>
                <div className="font-mono text-[9px] text-[var(--color-text-dim)]">
                  {filtered.length} results
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
