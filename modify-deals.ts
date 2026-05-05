import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Reset Lumen Analytics to original state
  const lumenClient = await prisma.client.findFirst({
    where: { company: "Lumen Analytics" }
  });

  if (lumenClient) {
    const deals = await prisma.deal.findMany({
      where: { clientId: lumenClient.id }
    });

    for (const deal of deals) {
      // Delete all agent traces to reset Pactix analysis
      await prisma.agentTrace.deleteMany({
        where: { dealId: deal.id }
      });

      // Keep only the first inbound message
      const messages = await prisma.message.findMany({
        where: { dealId: deal.id },
        orderBy: { sentAt: 'asc' }
      });

      if (messages.length > 1) {
        const idsToDelete = messages.slice(1).map(m => m.id);
        await prisma.message.deleteMany({
          where: { id: { in: idsToDelete } }
        });
      }

      // Reset deal status and fields
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: "new",
          agreedAmount: null,
          scope: null,
          winProbability: null
        }
      });
    }
    console.log("✓ Reset Lumen Analytics: Cleared analysis and extra messages.");
  }

  console.log("✓ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
