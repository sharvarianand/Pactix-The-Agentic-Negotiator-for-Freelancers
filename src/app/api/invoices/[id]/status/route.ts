import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPaymentLinkStatus } from "@/lib/payment";

// GET /api/invoices/:id/status — polls Stripe, updates DB if changed.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (invoice.status === "paid") return NextResponse.json({ invoice });

  if (invoice.stripePaymentLinkId) {
    const live = await checkPaymentLinkStatus(invoice.stripePaymentLinkId);
    if (live === "paid" && invoice.status !== "paid") {
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "paid", paidAt: new Date() },
      });
      return NextResponse.json({ invoice: updated });
    }
  }

  return NextResponse.json({ invoice });
}

// POST /api/invoices/:id/status — demo override: mark paid immediately.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "paid", paidAt: new Date() },
  });
  return NextResponse.json({ invoice: updated });
}
