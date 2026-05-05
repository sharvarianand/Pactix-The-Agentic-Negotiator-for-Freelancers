import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const { body } = (await req.json()) as { body?: string };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the latest un-approved outbound draft on this deal AND check ownership
  const draft = await prisma.message.findFirst({
    where: { 
      dealId, 
      direction: "outbound", 
      approvedByUser: false,
      deal: { freelancerId: user.id } // Ownership check
    },
    orderBy: { sentAt: "desc" },
  });

  if (!draft) {
    return NextResponse.json({ error: "No pending draft found for this user/deal" }, { status: 404 });
  }

  const updated = await prisma.message.update({
    where: { id: draft.id },
    data: {
      body: body ?? draft.body,
      approvedByUser: true,
    },
  });

  return NextResponse.json({ message: updated });
}
