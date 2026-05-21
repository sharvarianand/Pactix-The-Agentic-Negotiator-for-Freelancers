import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { sendGmailReply } from "@/lib/sync/gmail";

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

  // Load deal (with client + last inbound for thread context)
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, freelancerId: user.id },
    include: {
      client: true,
      messages: { orderBy: { sentAt: "asc" } },
    },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Find the latest un-approved outbound draft on this deal
  const draft = deal.messages
    .slice()
    .reverse()
    .find((m) => m.direction === "outbound" && !m.approvedByUser);

  if (!draft) {
    return NextResponse.json(
      { error: "No pending draft found for this deal" },
      { status: 404 }
    );
  }

  const finalBody = body ?? draft.body;

  // If this deal originated from Gmail, send the reply via the Gmail API
  let gmailStatus: { sent: boolean; error?: string } = { sent: false };
  let gmailMessageId: string | undefined;
  let gmailThreadId: string | null | undefined = deal.gmailThreadId;

  if (deal.gmailThreadId) {
    const lastInbound = deal.messages
      .filter((m) => m.direction === "inbound")
      .slice(-1)[0];
    const subject = lastInbound?.subject || `Deal with ${deal.client.company}`;

    const send = await sendGmailReply({
      freelancerId: user.id,
      to: deal.client.contactEmail,
      subject,
      body: finalBody,
      threadId: deal.gmailThreadId,
      inReplyTo: lastInbound?.gmailMessageId,
    });

    gmailStatus = { sent: send.sent, error: send.error };
    gmailMessageId = send.gmailMessageId;
    gmailThreadId = send.gmailThreadId ?? deal.gmailThreadId;
  }

  // Persist approval + any Gmail IDs returned
  const updated = await prisma.message.update({
    where: { id: draft.id },
    data: {
      body: finalBody,
      approvedByUser: true,
      gmailMessageId: gmailMessageId ?? draft.gmailMessageId,
      gmailThreadId: gmailThreadId ?? draft.gmailThreadId,
    },
  });

  return NextResponse.json({
    message: updated,
    gmail: deal.gmailThreadId
      ? gmailStatus
      : { sent: false, error: "Not a Gmail-sourced deal" },
  });
}
