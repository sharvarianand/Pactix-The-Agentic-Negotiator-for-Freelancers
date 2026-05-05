import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Move Lumen Analytics back to "new"
  const lumenClient = await prisma.client.findFirst({
    where: { company: "Lumen Analytics" }
  });

  if (lumenClient) {
    await prisma.deal.updateMany({
      where: { clientId: lumenClient.id },
      data: { status: "new" }
    });
    console.log("✓ Moved Lumen Analytics back to 'new' state");
  }

  // 2. Add a new client and deal
  const freelancer = await prisma.freelancer.findFirst();
  if (!freelancer) {
    console.error("No freelancer found. Run seed first.");
    return;
  }

  const newClient = await prisma.client.upsert({
    where: { contactEmail: "sarah@stellar.systems" },
    update: {},
    create: {
      company: "Stellar Systems",
      contactEmail: "sarah@stellar.systems",
    }
  });

  await prisma.deal.create({
    data: {
      freelancerId: freelancer.id,
      clientId: newClient.id,
      status: "new",
      briefText: "Hi Maya, I saw your work on the Orbital redesign. We need something similar for our fleet management dashboard. Our budget is around $3,500. Can we chat?",
      messages: {
        create: {
          direction: "inbound",
          body: "Hi Maya, I saw your work on the Orbital redesign. We need something similar for our fleet management dashboard. Our budget is around $3,500. Can we chat?",
          approvedByUser: true,
        }
      }
    }
  });

  console.log("✓ Added new client: Stellar Systems");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
