// Pactix — Council orchestration.
// Runs Orchestrator → (Scout ∥ Prosecutor ∥ Defense) → Judge → Negotiator,
// streaming every agent's reasoning to a single SSE channel.

import { prisma } from "@/lib/prisma";
import { streamJSON } from "@/lib/llm";
import type {
  DefenseOutput,
  JudgeOutput,
  NegotiatorOutput,
  OrchestratorOutput,
  ProsecutorOutput,
  ScoutOutput,
} from "@/lib/types";
import {
  type AgentContext,
  defensePrompt,
  judgePrompt,
  negotiatorPrompt,
  orchestratorPrompt,
  prosecutorPrompt,
  scoutPrompt,
} from "@/prompts";

// -----------------------------------------------------------------------------
// Event types emitted to SSE clients
// -----------------------------------------------------------------------------
export type CouncilEvent =
  | { kind: "agent_start"; agent: string; round: number }
  | { kind: "agent_token"; agent: string; text: string }
  | { kind: "agent_done"; agent: string; output: unknown; latencyMs: number; model: string }
  | { kind: "agent_error"; agent: string; error: string }
  | { kind: "council_done"; result: CouncilResult };

export interface CouncilResult {
  dealId: string;
  round: number;
  orchestrator: OrchestratorOutput;
  scout?: ScoutOutput;
  prosecutor?: ProsecutorOutput;
  defense?: DefenseOutput;
  judge: JudgeOutput;
  negotiator: NegotiatorOutput;
}

type Emit = (ev: CouncilEvent) => void;

// -----------------------------------------------------------------------------
// Load the full context needed by every agent from the database.
// -----------------------------------------------------------------------------
async function loadContext(dealId: string, round: number): Promise<AgentContext> {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      freelancer: true,
      client: true,
      messages: { orderBy: { sentAt: "asc" } },
    },
  });

  const voiceStyleSamples: string[] = deal.freelancer.voiceStyleSamples
    ? JSON.parse(deal.freelancer.voiceStyleSamples)
    : [];

  return {
    freelancer: {
      name: deal.freelancer.name,
      floorRateHourly: deal.freelancer.floorRateHourly,
      currency: deal.freelancer.currency,
      voiceStyleSamples,
    },
    client: {
      company: deal.client.company,
      contactEmail: deal.client.contactEmail,
      researchCache: deal.client.researchCache,
    },
    deal: {
      briefText: deal.briefText,
      messageHistory: deal.messages.map((m: { direction: string; body: string }) => ({
        direction: m.direction as "inbound" | "outbound",
        body: m.body,
      })),
      round,
    },
  };
}

// -----------------------------------------------------------------------------
// Run a single agent — stream tokens, persist trace, return typed output.
// -----------------------------------------------------------------------------
async function runAgent<T>(
  agentName: string,
  dealId: string,
  round: number,
  prompt: { system: string; user: string; schemaHint?: string; temperature?: number },
  emit: Emit
): Promise<T> {
  emit({ kind: "agent_start", agent: agentName, round });

  let reasoning = "";
  let output: unknown = null;
  let model = "unknown";
  let latencyMs = 0;
  let errored: string | null = null;

  for await (const chunk of streamJSON({
    system: prompt.system,
    user: prompt.user,
    schemaHint: prompt.schemaHint,
    temperature: prompt.temperature,
    agentName,
  })) {
    if (chunk.type === "reasoning" && chunk.text) {
      reasoning += chunk.text;
      emit({ kind: "agent_token", agent: agentName, text: chunk.text });
    } else if (chunk.type === "done") {
      output = chunk.data;
      model = chunk.model || "unknown";
      latencyMs = chunk.latencyMs || 0;
    } else if (chunk.type === "error") {
      errored = chunk.error || "unknown error";
      latencyMs = chunk.latencyMs || 0;
    }
  }

  if (errored || !output) {
    emit({ kind: "agent_error", agent: agentName, error: errored || "no output" });
    throw new Error(`${agentName} failed: ${errored || "no output"}`);
  }

  // Persist the trace. The reasoning is the streamed text; for JSON-mode providers
  // it IS the JSON — we still persist it verbatim for audit, plus the parsed output.
  await prisma.agentTrace.create({
    data: {
      dealId,
      agentName,
      round,
      reasoning,
      output: JSON.stringify(output),
      model,
      latencyMs,
    },
  });

  emit({ kind: "agent_done", agent: agentName, output, latencyMs, model });
  return output as T;
}

// -----------------------------------------------------------------------------
// Run the whole council for one round.
// -----------------------------------------------------------------------------
export async function runCouncil(
  dealId: string,
  round: number,
  emit: Emit
): Promise<CouncilResult> {
  const ctx = await loadContext(dealId, round);

  // 1. Orchestrator — classify
  const orchestrator = await runAgent<OrchestratorOutput>(
    "orchestrator",
    dealId,
    round,
    orchestratorPrompt(ctx),
    emit
  );

  // 2. Scout + Prosecutor + Defense in parallel.
  // Scout can be skipped on round > 1 if research is already cached.
  const hasCachedResearch = !!ctx.client.researchCache;
  const scoutPromise: Promise<ScoutOutput | undefined> =
    round > 1 && hasCachedResearch
      ? Promise.resolve(undefined)
      : runAgent<ScoutOutput>("scout", dealId, round, scoutPrompt(ctx), emit);

  const prosecutorPromise = runAgent<ProsecutorOutput>(
    "prosecutor",
    dealId,
    round,
    prosecutorPrompt(ctx),
    emit
  );
  const defensePromise = runAgent<DefenseOutput>(
    "defense",
    dealId,
    round,
    defensePrompt(ctx),
    emit
  );

  const [scout, prosecutor, defense] = await Promise.all([
    scoutPromise,
    prosecutorPromise,
    defensePromise,
  ]);

  // 3. Judge — weighs all three
  const judge = await runAgent<JudgeOutput>(
    "judge",
    dealId,
    round,
    judgePrompt({ ...ctx, scout, prosecutor, defense }),
    emit
  );

  // 4. Negotiator — voice-cloned reply enacting Judge's decision
  const negotiator = await runAgent<NegotiatorOutput>(
    "negotiator",
    dealId,
    round,
    negotiatorPrompt({ ...ctx, orchestrator, judge }),
    emit
  );

  // Persist the draft reply as an unsent outbound message.
  // Approval flips `approvedByUser=true` and sends it.
  await prisma.message.create({
    data: {
      dealId,
      direction: "outbound",
      body: negotiator.replyBody,
      approvedByUser: false,
    },
  });

  // Update deal state based on Judge's decision.
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status:
        judge.decision === "accept"
          ? "accepted"
          : judge.decision === "reject"
          ? "lost"
          : "negotiating",
      winProbability: judge.winProbability,
      agreedAmount:
        judge.decision === "accept" || judge.decision === "counter"
          ? judge.recommendedCounter
          : null,
      scope:
        judge.decision === "accept"
          ? JSON.stringify({
              deliverables: ["(Locked from client acceptance)"],
              revisions: judge.revisionsCap,
              timeline: judge.timeline,
              depositPct: judge.depositPct,
              amount: judge.recommendedCounter,
            })
          : undefined,
    },
  });

  const result: CouncilResult = {
    dealId,
    round,
    orchestrator,
    scout,
    prosecutor,
    defense,
    judge,
    negotiator,
  };

  emit({ kind: "council_done", result });
  return result;
}
