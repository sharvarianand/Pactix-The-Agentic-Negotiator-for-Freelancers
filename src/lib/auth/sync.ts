import { prisma } from "@/lib/prisma";

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

export async function ensureFreelancerProfile(userId: string, email: string, name?: string) {
  // Check if freelancer already exists
  const existing = await prisma.freelancer.findUnique({
    where: { id: userId },
  });

  if (existing) return existing;

  // Create new freelancer with demo data
  const freelancerName = name || email.split("@")[0] || "New User";
  
  const freelancer = await prisma.freelancer.create({
    data: {
      id: userId,
      name: freelancerName,
      email: email,
      floorRateHourly: 120,
      currency: "USD",
      voiceStyleSamples: JSON.stringify(VOICE_SAMPLES),
    },
  });

  // Seed demo deals for this new user
  const client1 = await prisma.client.create({
    data: {
      company: "Lumen Analytics",
      contactEmail: `jordan_${userId.slice(0, 5)}@lumen.analytics`,
      researchCache: JSON.stringify(CLIENT_RESEARCH),
    },
  });

  await prisma.deal.create({
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

  const client2 = await prisma.client.create({
    data: {
      company: "Orbital Mechanics",
      contactEmail: `priya_${userId.slice(0, 5)}@orbital.so`,
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
        revisions: 5,
        timeline: "ASAP / Rush",
        depositPct: 0.2,
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
        ],
      },
    },
  });

  // Add initial traces for the orbital deal
  const traces = [
    { agentName: "orchestrator", round: 1, reasoning: "New inbound lead from Orbital Mechanics.", output: JSON.stringify({ classification: "new_lead", summary: "Dashboard redesign for $2000", detectedLanguage: "English" }) },
    { agentName: "scout", round: 1, reasoning: "Orbital Mechanics is well funded.", output: JSON.stringify({ companyProfile: "Funded startup", recentSpendSignals: [], riskFlags: [], leverageForFreelancer: "Strong" }) },
  ];

  for (const trace of traces) {
    await prisma.agentTrace.create({
      data: {
        dealId: orbitalDeal.id,
        agentName: trace.agentName,
        round: 1,
        reasoning: trace.reasoning,
        output: trace.output,
        latencyMs: 800,
        model: "gpt-4o",
      }
    });
  }

  return freelancer;
}
