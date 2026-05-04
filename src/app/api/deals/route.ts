import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      messages: { orderBy: { sentAt: "asc" } },
      agentTraces: { orderBy: { createdAt: "asc" } },
      contract: true,
      invoices: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({ deals });
}
