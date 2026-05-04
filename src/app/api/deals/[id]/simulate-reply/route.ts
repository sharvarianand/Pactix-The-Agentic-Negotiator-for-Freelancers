import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/deals/:id/simulate-reply
// Dev-only: injects a hardcoded client counter-offer to trigger round 2.
// Body (optional): { body: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const json = (await req.json().catch(() => ({}))) as { body?: string };

  const defaultCounter = `Hey Maya,

Appreciate the detailed response. We talked it over internally and we're willing to do $400 with one revision — that's our final offer on this round. Scope as you described (mark + type refinement, one applied mockup) is fine.

If that works, send the contract and the deposit link and we'll get moving.

Jordan`;

  const msg = await prisma.message.create({
    data: {
      dealId,
      direction: "inbound",
      body: json.body || defaultCounter,
      approvedByUser: true,
    },
  });

  return NextResponse.json({ message: msg });
}
