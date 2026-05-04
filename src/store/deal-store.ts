"use client";

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Serialized shapes — mirror the server, but with JSON-decoded fields
// ---------------------------------------------------------------------------
export interface ClientRow {
  id: string;
  company: string;
  contactEmail: string;
  researchCache: string | null;
}

export interface MessageRow {
  id: string;
  dealId: string;
  direction: "inbound" | "outbound";
  body: string;
  sentAt: string;
  approvedByUser: boolean;
}

export interface AgentTraceRow {
  id: string;
  dealId: string;
  agentName: string;
  round: number;
  reasoning: string;
  output: string;
  model: string;
  latencyMs: number;
  createdAt: string;
}

export interface InvoiceRow {
  id: string;
  dealId: string;
  kind: "deposit" | "final";
  stripePaymentLink: string;
  stripePaymentLinkId: string | null;
  amount: number;
  status: "pending" | "paid" | "expired" | "void";
}

export interface DealRow {
  id: string;
  clientId: string;
  status: string;
  briefText: string;
  agreedAmount: number | null;
  scope: string | null;
  winProbability: number | null;
  createdAt: string;
  closedAt: string | null;
  client: ClientRow;
  messages: MessageRow[];
  agentTraces: AgentTraceRow[];
  contract: { id: string; pdfUrl: string } | null;
  invoices: InvoiceRow[];
}

// ---------------------------------------------------------------------------
// Live agent state (transient — rebuilt each dispatch)
// ---------------------------------------------------------------------------
export type AgentStatus = "idle" | "thinking" | "done" | "error";

export interface LiveAgent {
  status: AgentStatus;
  streamText: string;
  output: unknown | null;
  error: string | null;
  latencyMs: number | null;
}

export const AGENT_ORDER = [
  "orchestrator",
  "scout",
  "prosecutor",
  "defense",
  "judge",
  "negotiator",
] as const;
export type LiveAgentName = (typeof AGENT_ORDER)[number];

function blankAgent(): LiveAgent {
  return {
    status: "idle",
    streamText: "",
    output: null,
    error: null,
    latencyMs: null,
  };
}

function blankLiveState(): Record<LiveAgentName, LiveAgent> {
  return Object.fromEntries(AGENT_ORDER.map((n) => [n, blankAgent()])) as Record<
    LiveAgentName,
    LiveAgent
  >;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
interface State {
  deals: DealRow[];
  selectedDealId: string | null;
  live: Record<LiveAgentName, LiveAgent>;
  dispatching: boolean;

  // UI modal state
  approveReplyOpen: boolean;
  approveReplyDraft: string;
  approveClosingOpen: boolean;
  closingResult: { pdfUrl: string; invoiceId: string; stripeUrl: string } | null;

  // Actions
  loadDeals: () => Promise<void>;
  selectDeal: (id: string) => void;
  dispatchCouncil: (dealId: string) => Promise<void>;
  approveReply: (dealId: string, body: string) => Promise<void>;
  simulateClientReply: (dealId: string) => Promise<void>;
  closeDeal: (dealId: string) => Promise<void>;
  markInvoicePaid: (invoiceId: string) => Promise<void>;
  resetLive: () => void;
  setApproveReplyOpen: (open: boolean) => void;
  setApproveClosingOpen: (open: boolean) => void;
  openApproveReply: (draft: string) => void;
}

export const useDealStore = create<State>((set, get) => ({
  deals: [],
  selectedDealId: null,
  live: blankLiveState(),
  dispatching: false,

  approveReplyOpen: false,
  approveReplyDraft: "",
  approveClosingOpen: false,
  closingResult: null,

  resetLive: () => set({ live: blankLiveState() }),

  setApproveReplyOpen: (open) => set({ approveReplyOpen: open }),
  setApproveClosingOpen: (open) => set({ approveClosingOpen: open }),
  openApproveReply: (draft) => set({ approveReplyOpen: true, approveReplyDraft: draft }),

  loadDeals: async () => {
    const res = await fetch("/api/deals");
    const data = await res.json();
    set((s) => ({
      deals: data.deals,
      selectedDealId: s.selectedDealId ?? data.deals[0]?.id ?? null,
    }));
  },

  selectDeal: (id) => {
    set({ selectedDealId: id, live: blankLiveState() });
  },

  dispatchCouncil: async (dealId) => {
    set({ dispatching: true, live: blankLiveState(), closingResult: null });

    try {
      const res = await fetch(`/api/deals/${dealId}/dispatch`, { method: "POST" });
      if (!res.ok || !res.body) throw new Error(`Dispatch HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload) continue;

          let ev;
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          applyEvent(set, get, ev);
        }
      }
    } catch (e) {
      console.error("dispatch error:", e);
    } finally {
      set({ dispatching: false });
      // Open reply modal if negotiator finished successfully
      const neg = get().live.negotiator;
      if (neg.status === "done" && neg.output) {
        const body = (neg.output as { replyBody?: string }).replyBody || "";
        set({ approveReplyOpen: true, approveReplyDraft: body });
      }
      await get().loadDeals();
    }
  },

  approveReply: async (dealId, body) => {
    await fetch(`/api/deals/${dealId}/approve-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    set({ approveReplyOpen: false });
    await get().loadDeals();
  },

  simulateClientReply: async (dealId) => {
    await fetch(`/api/deals/${dealId}/simulate-reply`, { method: "POST" });
    await get().loadDeals();
  },

  closeDeal: async (dealId) => {
    const res = await fetch(`/api/deals/${dealId}/close`, { method: "POST" });
    const data = await res.json();
    if (data.contract && data.invoice) {
      set({
        approveClosingOpen: true,
        closingResult: {
          pdfUrl: data.contract.pdfUrl,
          invoiceId: data.invoice.id,
          stripeUrl: data.invoice.stripePaymentLink,
        },
      });
      await get().loadDeals();
    }
  },

  markInvoicePaid: async (invoiceId) => {
    await fetch(`/api/invoices/${invoiceId}/status`, { method: "POST" });
    await get().loadDeals();
  },
}));

// ---------------------------------------------------------------------------
// SSE event application
// ---------------------------------------------------------------------------
type Setter = (fn: (s: State) => Partial<State>) => void;
type Getter = () => State;

interface AgentStartEvt { kind: "agent_start"; agent: string; round: number }
interface AgentTokenEvt { kind: "agent_token"; agent: string; text: string }
interface AgentDoneEvt  { kind: "agent_done"; agent: string; output: unknown; latencyMs: number; model: string }
interface AgentErrorEvt { kind: "agent_error"; agent: string; error: string }
interface CouncilDoneEvt { kind: "council_done"; result: unknown }
type AnyEvt = AgentStartEvt | AgentTokenEvt | AgentDoneEvt | AgentErrorEvt | CouncilDoneEvt;

function applyEvent(set: Setter, _get: Getter, ev: AnyEvt) {
  if (ev.kind === "council_done") return;

  const name = ev.agent as LiveAgentName;
  if (!AGENT_ORDER.includes(name)) return;

  if (ev.kind === "agent_start") {
    set((s) => ({
      live: { ...s.live, [name]: { ...blankAgent(), status: "thinking" } },
    }));
  } else if (ev.kind === "agent_token") {
    set((s) => ({
      live: {
        ...s.live,
        [name]: { ...s.live[name], streamText: s.live[name].streamText + ev.text },
      },
    }));
  } else if (ev.kind === "agent_done") {
    set((s) => ({
      live: {
        ...s.live,
        [name]: {
          ...s.live[name],
          status: "done",
          output: ev.output,
          latencyMs: ev.latencyMs,
        },
      },
    }));
  } else if (ev.kind === "agent_error") {
    set((s) => ({
      live: {
        ...s.live,
        [name]: { ...s.live[name], status: "error", error: ev.error },
      },
    }));
  }
}
