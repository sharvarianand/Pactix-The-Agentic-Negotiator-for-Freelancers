// Pactix — Stripe payment link generator.
// Falls back to a mock link if STRIPE_SECRET_KEY is not set so the demo still runs.

import Stripe from "stripe";

export interface PaymentLinkInput {
  dealId: string;
  clientCompany: string;
  amount: number; // in whole currency units (e.g. dollars)
  currency: string; // e.g. 'USD'
  description: string;
}

export interface PaymentLinkResult {
  url: string;
  id: string;
  mocked: boolean;
}

export async function createPaymentLink(
  input: PaymentLinkInput
): Promise<PaymentLinkResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return {
      url: `https://buy.stripe.com/test_mock_${input.dealId.slice(0, 8)}`,
      id: `plink_mock_${input.dealId.slice(0, 8)}`,
      mocked: true,
    };
  }

  const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });

  // Create a one-off product + price inline, then a payment link pointing at it.
  const product = await stripe.products.create({
    name: `${input.clientCompany} — ${input.description}`,
    metadata: { dealId: input.dealId },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(input.amount * 100),
    currency: input.currency.toLowerCase(),
  });

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { dealId: input.dealId },
  });

  return { url: link.url, id: link.id, mocked: false };
}

export async function checkPaymentLinkStatus(
  paymentLinkId: string
): Promise<"pending" | "paid" | "void"> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || paymentLinkId.startsWith("plink_mock_")) return "pending";

  const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });

  // Check sessions linked to this payment link for a completed payment.
  const sessions = await stripe.checkout.sessions.list({
    payment_link: paymentLinkId,
    limit: 5,
  });

  if (sessions.data.some((s) => s.payment_status === "paid")) return "paid";
  return "pending";
}
