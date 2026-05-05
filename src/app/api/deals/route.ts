import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let deals = await prisma.deal.findMany({
      where: { freelancerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        messages: { orderBy: { sentAt: "asc" } },
        agentTraces: { orderBy: { createdAt: "asc" } },
        contract: true,
        invoices: { orderBy: { createdAt: "asc" } },
      },
    });

    // Fail-safe: If no deals, trigger seeding and refetch
    if (deals.length === 0) {
      const { ensureFreelancerProfile } = await import("@/lib/auth/sync");
      await ensureFreelancerProfile(user.id, user.email!, user.user_metadata.full_name);
      
      deals = await prisma.deal.findMany({
        where: { freelancerId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
          messages: { orderBy: { sentAt: "asc" } },
          agentTraces: { orderBy: { createdAt: "asc" } },
          contract: true,
          invoices: { orderBy: { createdAt: "asc" } },
        },
      });
    }

    return NextResponse.json({ deals });
  } catch (error: any) {
    console.error("API Deals Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
