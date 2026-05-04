// Pactix — deterministic mock LLM responses for development without an API key.
// Each agent has a scripted reasoning monologue + a realistic structured output.
// Keyed off the "Lumen Analytics quick logo tweak" hero demo.

import type { LLMRequest } from "./llm";
import type {
  DefenseOutput,
  JudgeOutput,
  NegotiatorOutput,
  OrchestratorOutput,
  ProsecutorOutput,
  ScoutOutput,
} from "./types";

interface MockResponse {
  reasoning: string;
  output: unknown;
}

/**
 * Decide which mock persona to use based on agent name + message context.
 * Supports round-2 behavior for counter-offers.
 */
export function getMockResponse(agentName: string, req: LLMRequest): MockResponse {
  const userLower = req.user.toLowerCase();
  const isCounterRound =
    userLower.includes("$400") ||
    userLower.includes("final offer") ||
    userLower.includes("round 2") ||
    userLower.includes("counter_offer");

  switch (agentName) {
    case "orchestrator":
      return orchestratorMock(isCounterRound);
    case "scout":
      return scoutMock();
    case "prosecutor":
      return prosecutorMock();
    case "defense":
      return defenseMock();
    case "judge":
      return isCounterRound ? judgeAcceptMock() : judgeCounterMock();
    case "negotiator":
      return isCounterRound ? negotiatorAcceptMock() : negotiatorCounterMock();
    default:
      return {
        reasoning: `Mock agent '${agentName}' had no scripted response.`,
        output: {},
      };
  }
}

// -----------------------------------------------------------------------------

function orchestratorMock(isCounter: boolean): MockResponse {
  if (isCounter) {
    return {
      reasoning:
        "Client replied with a counter of $400 and single revision. Classifying as counter_offer. Will re-dispatch Prosecutor and Defense with the full thread; Scout can be skipped since we already cached Lumen's profile in round 1.",
      output: {
        classification: "counter_offer",
        summary:
          "Client countered at $400 with one revision. Above freelancer floor but scope needs locking.",
        detectedLanguage: "English",
      } satisfies OrchestratorOutput,
    };
  }
  return {
    reasoning:
      "New inbound from Jordan at Lumen Analytics. Classifying as new_lead. Brief is underspecified ('quick logo tweak' with tight budget and rush deadline). Dispatching Scout, Prosecutor, and Defense in parallel.",
    output: {
      classification: "new_lead",
      summary:
        "New lead: Lumen Analytics logo tweak. $150 budget, Friday deadline. Scope ambiguous.",
      detectedLanguage: "English",
    } satisfies OrchestratorOutput,
  };
}

function scoutMock(): MockResponse {
  return {
    reasoning: `Pulling cached research on Lumen Analytics...
Series A, $8.4M raise six months ago (Redpoint-led). ~40 employees, SF-based.
Spend signals: Mercer & Co retainer ($18k mentioned publicly), SaaStr 2026 Gold sponsor (~$15k), recent posts about "investing in brand."
Hiring Senior Product Designers at $140-180k.
This is not a cash-constrained company. Their "tight budget" framing is standard Series A negotiation — they test freelancers with low anchors. Real willingness-to-pay is 5-10x stated budget on design work.`,
    output: {
      companyProfile:
        "Lumen Analytics — Series A SaaS, ~40 employees, SF. Raised $8.4M six months ago (Redpoint-led). Strong PMF signals, aggressive GTM hiring.",
      recentSpendSignals: [
        "Design agency retainer disclosed at $18k (Mercer & Co case study)",
        "SaaStr 2026 Gold sponsor (~$15k)",
        "Hiring Senior Product Designers $140-180k range",
        "Three LinkedIn posts about 'brand investment' in last 60 days",
      ],
      riskFlags: [
        "Low-anchor opening is a deliberate negotiation tactic",
        "'Quick tweak' language with no reference files suggests scope will expand",
        "Friday deadline applied without prior relationship = rush premium justified",
      ],
      leverageForFreelancer:
        "Client has budget and knows it. Anchor high — they expect a counter. Walking away costs them more than paying you well.",
    } satisfies ScoutOutput,
  };
}

function prosecutorMock(): MockResponse {
  return {
    reasoning: `Reading the brief with a skeptic's eye...
Three red flags jump out immediately.
One: "quick logo tweak" is entirely undefined — no reference files, no decision on mark vs type vs color system. This is textbook scope ambiguity.
Two: 72-hour deadline on first contact = rush work. Industry standard is a 40-50% rush premium. Client didn't mention this; they're hoping you won't either.
Three: no revision limit stated. Without a cap, "a few more tries" becomes 8 hours of unpaid labor.
Also: $150 is below floor. At Maya's $120/hr rate, that's 1.25 hours of work — which is not a logo project, that's a quick consultation.
Severity: HIGH. Do not accept without hard scope lock.`,
    output: {
      scopeRisks: [
        "'Logo tweak' is completely undefined — no deliverable boundary",
        "No revision limit stated; unbounded revision cycles likely",
        "No brand-guide or reference materials provided",
      ],
      timelineRisks: [
        "72-hour turnaround on first contact justifies 40-50% rush premium",
        "Friday deadline with no context = no room for client review cycles",
      ],
      pricingRisks: [
        "$150 is ~1.25hr at floor rate — below minimum project threshold",
        "No mention of deposit or payment terms",
      ],
      severity: "high",
    } satisfies ProsecutorOutput,
  };
}

function defenseMock(): MockResponse {
  return {
    reasoning: `Advocating for Maya's position...
Past similar projects: Lumen-size logo refreshes averaged $450-600 in Maya's deal history. That's the comparable.
Leverage points: (1) Maya's portfolio has proven Series A case studies — Lumen came through a friend referral, they already trust the work. (2) Friday deadline is their problem, not ours — rush premium applies. (3) Scope ambiguity means we get to define it, not them.
Anchor: Start at $600 with 2 revisions capped. This gives room to negotiate down to our true target of ~$500. Walk-away floor: $350 (floor rate × 3 hours minimum project).`,
    output: {
      anchorAmount: 600,
      leveragePoints: [
        "Past Lumen-peers paid $450-600 for similar scope — we have comparables",
        "Friend referral = trust already established, lowers acquisition friction",
        "72-hour rush justifies 30-40% premium on top of base rate",
        "Scope ambiguity = we define the deliverable, not client",
      ],
      walkAwayFloor: 350,
    } satisfies DefenseOutput,
  };
}

function judgeCounterMock(): MockResponse {
  return {
    reasoning: `Weighing both sides...
Prosecutor raises valid scope and rush concerns — all need to be baked into the counter. Defense's $600 anchor is aggressive but defensible given comparables.
Final ruling: counter at $550 (splits the anchor vs. expected client target), 2 revisions capped, Friday delivery held, 50% deposit required before work starts. Win probability 71% based on Lumen's profile — they have the budget and came via referral.
If they push back below $400, we walk.`,
    output: {
      decision: "counter",
      recommendedCounter: 550,
      revisionsCap: 2,
      timeline: "Delivered by Friday EOD PST",
      depositPct: 0.5,
      winProbability: 0.71,
      rationale:
        "Counter anchors above comparable midpoint ($450-600 range). Hard-locks scope to prevent creep. 50% deposit de-risks rush timeline. Client profile (Series A, referral, budget signals) supports 70%+ acceptance.",
    } satisfies JudgeOutput,
  };
}

function judgeAcceptMock(): MockResponse {
  return {
    reasoning: `Client countered at $400 with one revision. $400 is above our $350 walk-away floor and the revision reduction is reasonable. Accepting with locked scope and 50% deposit. Win recorded.`,
    output: {
      decision: "accept",
      recommendedCounter: 400,
      revisionsCap: 1,
      timeline: "Delivered by Friday EOD PST",
      depositPct: 0.5,
      winProbability: 1.0,
      rationale:
        "Above floor, scope locked, single revision acceptable given reduced amount. Close and move to contract.",
    } satisfies JudgeOutput,
  };
}

function negotiatorCounterMock(): MockResponse {
  return {
    reasoning:
      "Drafting in Maya's voice — warm open, direct on scope, specific on price and terms. Keeping it short.",
    output: {
      replyBody: `Hey Jordan,

Thanks for reaching out — appreciate the referral and happy to take a look.

Quick heads up on scope: "logo tweak" can mean anything from a type-weight adjustment to a full mark refresh, and the Friday deadline means we can't iterate our way to the answer. I'd want to pin the deliverable down before we start.

For the work as I'd scope it — mark + type refinement, one applied mockup, two rounds of revisions, delivered by Friday EOD PST — I'd quote $550, with 50% upfront to hold the slot.

If that works, I'll send a short SOW and the deposit link this afternoon. If the budget truly can't move, let me know what you actually need and I'll tell you honestly whether I can do it for less without shortchanging the result.

Cheers,
Maya`,
      tonalNotes:
        "Opens warm, establishes authority on scope, anchors at $550 with clear conditions, leaves graceful off-ramp.",
    } satisfies NegotiatorOutput,
  };
}

function negotiatorAcceptMock(): MockResponse {
  return {
    reasoning:
      "Accepting the $400 counter with one revision. Staying Maya's voice — direct, no over-gratitude, locking terms in writing.",
    output: {
      replyBody: `Hey Jordan,

$400 with one revision works — on the condition that the scope is mark + type refinement with one applied mockup, delivered by Friday EOD PST. Anything beyond that is out of scope and billed at my hourly ($120).

Sending the SOW and the 50% deposit link now. Once the deposit lands I'll kick off.

Maya`,
      tonalNotes:
        "Short, firm, locks terms. Protects against scope creep by explicitly stating what falls outside.",
    } satisfies NegotiatorOutput,
  };
}
