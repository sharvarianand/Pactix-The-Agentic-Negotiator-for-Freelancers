import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Five past sent emails — used as voice-cloning exemplars for the Negotiator agent.
const VOICE_SAMPLES: string[] = [
  `Hey Priya,

Thanks for the kind words on the last batch. I can definitely pick this up next week — looking at about 4-5 days of design time for the full flow. My rate for this kind of scope lands around $2,200, two rounds of revisions included.

Quick heads up: if the copy isn't locked before we start, each additional revision cycle adds 1-2 days and a bit to the total. Let me know what works and I'll send a one-pager over.

Cheers,
Maya`,

  `Hi Dan,

Appreciate you thinking of me. That said, a 3-day turnaround on something this scoped is going to mean a rush premium — I'd typically quote this at $1,800 but with the timeline it'd be $2,400. If we can push to next Friday I can keep it at the standard rate.

Either way, I'd want the brief tightened on deliverables before we kick off — otherwise we both end up frustrated. Let me know which direction.

Maya`,

  `Hey Alex,

Quick one — the current scope says "a few tweaks to the logo" but the reference files you sent are more like a full refresh (new mark, new type, new color system). That's genuinely different work and I want to flag it now rather than after.

Happy to do the refresh at $1,500 with one revision round, or the actual tweaks (keep mark, adjust type weight) at $450. Which is closer to what you had in mind?

Maya`,

  `Hi Sam,

Loved the brand direction in the deck. For a project this size I'd normally start at $3,500 — includes logo, type system, two applications, and a basic style guide. Deposit is 50% to hold the slot.

I have capacity starting the 14th. Want me to send a SOW?

Maya`,

  `Hey Ren,

Thanks for the quick reply. $400 works for me on the condition that it's the single round of revisions we discussed — anything past that bumps to my hourly ($120). Also going to need 50% upfront via Stripe before I kick off.

I'll send the contract and deposit link tomorrow morning if that sounds good.

Maya`,
];

// The "hero" demo email — a classic scope-creep trap.
const DEMO_INBOUND = `Hey!

Found your portfolio through a friend — really like your stuff. We're a small SaaS team (about 40 people) and I was hoping you could do a quick logo tweak for us. Nothing major, just freshen it up a bit.

Budget is pretty tight on this one — maybe around $150? And we'd need it by Friday if at all possible.

Let me know!

Thanks,
Jordan Cho
Head of Growth, Lumen Analytics`;

// Scout's pre-cached research on the demo client (demo performance, not real scraping).
const CLIENT_RESEARCH = {
  companyProfile:
    "Lumen Analytics — Series A SaaS, ~40 employees, San Francisco. Raised $8.4M six months ago (led by Redpoint). Product-market fit signals strong; aggressive hiring in GTM.",
  recentSpendSignals: [
    "Public case study with design agency Mercer & Co. ($18k retainer mentioned)",
    "Three LinkedIn posts about 'investing in brand' in last 60 days",
    "Open roles include Senior Product Designer ($140k-$180k range)",
    "Conference sponsor at SaaStr 2026 (Gold tier — ~$15k)",
  ],
  riskFlags: [
    "Low-ball opening (typical for Series A growth teams testing freelancers)",
    "'Quick tweak' framing with reference files suggests real scope is larger",
    "Friday deadline with no prior context = rush premium justified",
  ],
  leverageForFreelancer:
    "Client has budget. 'Tight budget' is a negotiation tactic, not a constraint. Anchor high — they expect to negotiate up.",
  cachedAt: new Date().toISOString(),
};

async function main() {
  // Clean slate for repeatable seeding during hackathon dev
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

  const client = await prisma.client.create({
    data: {
      company: "Lumen Analytics",
      contactEmail: "jordan@lumen.analytics",
      researchCache: JSON.stringify(CLIENT_RESEARCH),
    },
  });

  // The hero demo deal — "Send to Pactix" target.
  const demoDeal = await prisma.deal.create({
    data: {
      freelancerId: freelancer.id,
      clientId: client.id,
      status: "new",
      briefText: DEMO_INBOUND,
      messages: {
        create: {
          direction: "inbound",
          body: DEMO_INBOUND,
          approvedByUser: true,
        },
      },
    },
  });

  // A second background deal for visual density in the inbox.
  const bgClient = await prisma.client.create({
    data: {
      company: "Orbital Mechanics",
      contactEmail: "priya@orbital.so",
    },
  });

  await prisma.deal.create({
    data: {
      freelancerId: freelancer.id,
      clientId: bgClient.id,
      status: "closed",
      briefText: "Thanks Maya — that was perfect. Invoice is paid, looking forward to round 2 next month.",
      agreedAmount: 2200,
      scope: JSON.stringify({
        deliverables: ["Onboarding flow screens", "Empty states"],
        revisions: 2,
        timeline: "5 business days",
        depositPct: 0.5,
        amount: 2200,
      }),
      closedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      messages: {
        create: {
          direction: "inbound",
          body: "Thanks Maya — that was perfect. Invoice is paid, looking forward to round 2 next month.",
          approvedByUser: true,
        },
      },
    },
  });

  console.log("✓ Seed complete");
  console.log(`  Freelancer: ${freelancer.name} (${freelancer.id})`);
  console.log(`  Hero demo deal: ${demoDeal.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
