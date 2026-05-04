import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateContractPdf } from "@/lib/contract";
import { createPaymentLink } from "@/lib/payment";
import type { DealScope } from "@/lib/types";

// POST /api/deals/:id/close
// Generates SOW PDF + Stripe deposit payment link, attaches both to the latest
// outbound draft, and marks the deal as closed.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { freelancer: true, client: true },
  });

  if (!deal.scope || !deal.agreedAmount) {
    return NextResponse.json(
      { error: "Deal has no locked scope or agreed amount" },
      { status: 400 }
    );
  }

  const scope: DealScope = JSON.parse(deal.scope);

  // 1. Generate SOW PDF
  const pdfUrl = await generateContractPdf({
    dealId: deal.id,
    freelancerName: deal.freelancer.name,
    freelancerEmail: deal.freelancer.email,
    clientCompany: deal.client.company,
    clientEmail: deal.client.contactEmail,
    scope,
    currency: deal.freelancer.currency,
  });

  const contract = await prisma.contract.upsert({
    where: { dealId: deal.id },
    create: {
      dealId: deal.id,
      pdfUrl,
      scopeSnapshot: JSON.stringify(scope),
    },
    update: { pdfUrl, scopeSnapshot: JSON.stringify(scope) },
  });

  // 2. Create Stripe deposit payment link
  const depositAmount = scope.amount * scope.depositPct;
  const link = await createPaymentLink({
    dealId: deal.id,
    clientCompany: deal.client.company,
    amount: depositAmount,
    currency: deal.freelancer.currency,
    description: "Project deposit",
  });

  const invoice = await prisma.invoice.create({
    data: {
      dealId: deal.id,
      kind: "deposit",
      stripePaymentLink: link.url,
      stripePaymentLinkId: link.id,
      amount: depositAmount,
      status: "pending",
    },
  });

  // 3. Mark deal closed
  await prisma.deal.update({
    where: { id: deal.id },
    data: { status: "closed", closedAt: new Date() },
  });

  return NextResponse.json({
    contract,
    invoice,
    mocked: link.mocked,
  });
}
