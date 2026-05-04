// Pactix — domain types mirroring the Prisma schema enums + agent I/O contracts.
// SQLite can't store native enums, so we enforce these at the app layer.

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export const DEAL_STATUSES = [
  "new",
  "negotiating",
  "accepted",
  "rejected",
  "closed",
  "lost",
] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const AGENT_NAMES = [
  "orchestrator",
  "scout",
  "prosecutor",
  "defense",
  "judge",
  "negotiator",
  "contract",
  "payment",
] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const INVOICE_KINDS = ["deposit", "final"] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export const INVOICE_STATUSES = ["pending", "paid", "expired", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const ORCHESTRATOR_CLASSIFICATIONS = [
  "new_lead",
  "counter_offer",
  "scope_change",
  "payment_followup",
  "non_deal",
] as const;
export type OrchestratorClassification =
  (typeof ORCHESTRATOR_CLASSIFICATIONS)[number];

// -----------------------------------------------------------------------------
// Agent I/O shapes (strongly typed outputs for each agent)
// -----------------------------------------------------------------------------
export interface OrchestratorOutput {
  classification: OrchestratorClassification;
  summary: string;
  detectedLanguage: string;
}

export interface ScoutOutput {
  companyProfile: string;
  recentSpendSignals: string[];
  riskFlags: string[];
  leverageForFreelancer: string;
}

export interface ProsecutorOutput {
  scopeRisks: string[];
  timelineRisks: string[];
  pricingRisks: string[];
  severity: "low" | "medium" | "high";
}

export interface DefenseOutput {
  anchorAmount: number;
  leveragePoints: string[];
  walkAwayFloor: number;
}

export interface JudgeOutput {
  decision: "counter" | "accept" | "reject";
  recommendedCounter?: number;
  revisionsCap: number;
  timeline: string;
  depositPct: number;
  winProbability: number;
  rationale: string;
}

export interface NegotiatorOutput {
  replyBody: string;
  tonalNotes: string;
}

export interface DealScope {
  deliverables: string[];
  revisions: number;
  timeline: string;
  depositPct: number;
  amount: number;
}

// -----------------------------------------------------------------------------
// Scout research cache shape (stored on Client.researchCache)
// -----------------------------------------------------------------------------
export interface ClientResearchCache {
  companyProfile: string;
  recentSpendSignals: string[];
  riskFlags: string[];
  leverageForFreelancer: string;
  cachedAt: string; // ISO
}
