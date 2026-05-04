import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/deals/:id/approve-reply
// Body: { body: string } — the (possibly user-edited) reply text
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const { body } = (await req.json()) as { body?: string };

  // Find the latest un-approved outbound draft on this deal.
  const draft = await prisma.message.findFirst({
    where: { dealId, direction: "outbound", approvedByUser: false },
    orderBy: { sentAt: "desc" },
  });

  if (!draft) {
    return NextResponse.json({ error: "No pending draft to approve" }, { status: 404 });
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
