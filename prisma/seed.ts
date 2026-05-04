import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VOICE_SAMPLES: string[] = [
  `Hey Priya, Thanks for the kind words on the last batch. I can definitely pick this up next week — looking at about 4-5 days of design time for the full flow. My rate for this kind of scope lands around $2,200, two rounds of revisions included. Quick heads up: if the copy isn't locked before we start, each additional revision cycle adds 1-2 days and a bit to the total. Let me know what works and I'll send a one-pager over. Cheers, Maya`,
  `Hi Dan, Appreciate you thinking of me. That said, a 3-day turnaround on something this scoped is going to mean a rush premium — I'd typically quote this at $1,800 but with the timeline it'd be $2,400. If we can push to next Friday I can keep it at the standard rate. Either way, I'd want the brief tightened on deliverables before we kick off — otherwise we both end up frustrated. Let me know which direction. Maya`,
  `Hey Alex, Quick one — the current scope says "a few tweaks to the logo" but the reference files you sent are more like a full refresh. That's genuinely different work and I want to flag it now rather than after. Happy to do the refresh at $1,500 with one revision round, or the actual tweaks at $450. Which is closer to what you had in mind? Maya`,
];

const FRENCH_DEMO_INBOUND = `Salut Maya!

J'ai trouvé ton portfolio grâce à un ami. Nous sommes une petite équipe SaaS (environ 40 personnes) et j'espérais que tu pourrais faire une petite modification de notre logo. Rien de majeur, juste le rafraîchir un peu.

Notre budget est assez serré sur ce coup — peut-être autour de 150 $ ? Et nous en aurions besoin pour vendredi si possible.

Fais-moi savoir !

Merci,
Jordan Cho
Responsable de la Croissance, Lumen Analytics`;

const CLIENT_RESEARCH = {
  companyProfile:
    "Lumen Analytics — Series A SaaS, ~40 employees, San Francisco. Raised $8.4M six months ago (led by Redpoint). Product-market fit signals strong; aggressive hiring in GTM.",
  recentSpendSignals: [
    "Public case study with design agency Mercer & Co. ($18k retainer mentioned)",
    "Three LinkedIn posts about 'investing in brand' in last 60 days",
    "Conference sponsor at SaaStr 2026 (Gold tier — ~$15k)",
  ],
  riskFlags: [
    "Low-ball opening (typical for Series A growth teams testing freelancers)",
    "'Quick tweak' framing with reference files suggests real scope is larger",
  ],
  leverageForFreelancer:
    "Client has budget. 'Tight budget' is a negotiation tactic, not a constraint. Anchor high — they expect to negotiate up.",
  cachedAt: new Date().toISOString(),
};

async function main() {
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.agentTrace.deleteMany();
  await prisma.message.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.client.deleteMany();
  await prisma.freelancer.deleteMany();

  const freelancer = await prisma.freelancer.create({
    data: {
      name: "Maya Chen",
      email: "maya@mayachen.design",
      floorRateHourly: 120,
      currency: "USD",
      voiceStyleSamples: JSON.stringify(VOICE_SAMPLES),
    },
  });

  const client1 = await prisma.client.create({
    data: {
      company: "Lumen Analytics",
      contactEmail: "jordan@lumen.analytics",
      researchCache: JSON.stringify(CLIENT_RESEARCH),
    },
  });

  // Deal 1: Hero demo (French, shows auto-detect + voice dictation on pending reply)
  const demoDeal = await prisma.deal.create({
    data: {
      freelancerId: freelancer.id,
      clientId: client1.id,
      status: "new",
      briefText: FRENCH_DEMO_INBOUND,
      messages: {
        create: {
          direction: "inbound",
          body: FRENCH_DEMO_INBOUND,
          approvedByUser: true,
        },
      },
    },
  });

  // Deal 2: Orbital Mechanics (Shows Deal Replay, Monte Carlo, Redline Agent)
  const client2 = await prisma.client.create({
    data: {
      company: "Orbital Mechanics",
      contactEmail: "priya@orbital.so",
    },
  });

  const orbitalDeal = await prisma.deal.create({
    data: {
      freelancerId: freelancer.id,
      clientId: client2.id,
      status: "negotiating",
      briefText: "Looking for a complete redesign of our dashboard. Budget is $2,000.",
      agreedAmount: 2000,
      winProbability: 0.85,
      scope: JSON.stringify({
        deliverables: ["Dashboard UI", "Settings pages", "Analytics charts"],
        revisions: 5, // Bad clause: too many revisions
        timeline: "ASAP / Rush", // Bad clause: rush without premium mentioned clearly
        depositPct: 0.2, // Bad clause: 20% deposit is too low
        amount: 2000,
      }),
      messages: {
        create: [
          {
            direction: "inbound",
            body: "Looking for a complete redesign of our dashboard. Budget is $2,000.",
            approvedByUser: true,
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          },
          {
            direction: "outbound",
            body: "I can do this for $2,500 with 2 revisions. Does that work?",
            approvedByUser: true,
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
          {
            direction: "inbound",
            body: "Let's do $2,000 but I need 5 revisions to be safe, and we need it ASAP. We'll pay 20% upfront.",
            approvedByUser: true,
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          }
        ],
      },
    },
  });

  // Add some fake traces for Orbital so Replay works
  const traces = [
    { agentName: "orchestrator", round: 1, reasoning: "New inbound lead from Orbital Mechanics.", output: JSON.stringify({ classification: "new_lead", summary: "Dashboard redesign for $2000", detectedLanguage: "English" }) },
    { agentName: "scout", round: 1, reasoning: "Orbital Mechanics is well funded.", output: JSON.stringify({ companyProfile: "Funded startup", recentSpendSignals: [], riskFlags: [], leverageForFreelancer: "Strong" }) },
    { agentName: "prosecutor", round: 1, reasoning: "Budget is okay but revisions are too high.", output: JSON.stringify({ scopeRisks: ["Unlimited revisions"], timelineRisks: ["ASAP"], pricingRisks: ["Low deposit"], severity: "major" }) },
    { agentName: "defense", round: 1, reasoning: "We can push back on revisions.", output: JSON.stringify({ anchorAmount: 2500, leveragePoints: ["Good portfolio fit"], walkAwayFloor: 1500 }) },
    { agentName: "judge", round: 1, reasoning: "Counter at $2500.", output: JSON.stringify({ decision: "counter", recommendedCounter: 2500, revisionsCap: 2, timeline: "2 weeks", depositPct: 0.5, winProbability: 0.6, rationale: "Anchor high." }) },
    
    // Round 2
    { agentName: "orchestrator", round: 2, reasoning: "Client countered with $2000 and 5 revisions, 20% deposit.", output: JSON.stringify({ classification: "counter_offer", summary: "Client countered at $2000, 5 revisions, 20% deposit.", detectedLanguage: "English" }) },
    { agentName: "prosecutor", round: 2, reasoning: "5 revisions is unacceptable. 20% deposit is too risky.", output: JSON.stringify({ scopeRisks: ["5 revisions is scope creep"], timelineRisks: ["ASAP requires rush fee"], pricingRisks: ["20% deposit exposes us"], severity: "critical" }) },
    { agentName: "defense", round: 2, reasoning: "$2000 is still above floor. We should accept the money but fix the terms.", output: JSON.stringify({ anchorAmount: 2200, leveragePoints: ["They want it ASAP"], walkAwayFloor: 1800 }) },
    { agentName: "judge", round: 2, reasoning: "Accepting $2000 but pushing back on the bad terms.", output: JSON.stringify({ decision: "counter", recommendedCounter: 2000, revisionsCap: 2, timeline: "Rush timeline accepted", depositPct: 0.5, winProbability: 0.85, rationale: "Accept the $2000 but enforce 50% deposit and 2 revisions." }) }
  ];

  for (let i = 0; i < traces.length; i++) {
    await prisma.agentTrace.create({
      data: {
        dealId: orbitalDeal.id,
        agentName: traces[i].agentName,
        round: traces[i].round,
        reasoning: traces[i].reasoning,
        output: traces[i].output,
        latencyMs: 800 + Math.floor(Math.random() * 500),
        model: "mock-model-1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + i * 1000 * 60),
      }
    });
  }

  console.log("✓ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
