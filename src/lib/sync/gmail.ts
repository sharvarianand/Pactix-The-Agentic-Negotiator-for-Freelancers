import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";

export async function syncGmailForUser(freelancerId: string) {
  const account = await prisma.connectedAccount.findUnique({
    where: { freelancerId_provider: { freelancerId, provider: "google" } },
  });

  if (!account || !account.refreshToken) return;

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiresAt?.getTime(),
  });

  // Refresh token if expired
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessToken: tokens.access_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    }
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // List recent messages
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
    q: "label:INBOX",
  });

  const messages = res.data.messages || [];

  for (const msg of messages) {
    if (!msg.id) continue;

    // Check if we've already processed this message
    // For now, we'll just check if a Message with this ID or similar exists
    // In a real app, we'd store the gmail_message_id

    const details = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const headers = details.data.payload?.headers;
    const subject = headers?.find(h => h.name === "Subject")?.value || "No Subject";
    const from = headers?.find(h => h.name === "From")?.value || "";
    const date = headers?.find(h => h.name === "Date")?.value || new Date().toISOString();
    
    // Get body
    let body = "";
    const parts = details.data.payload?.parts || [];
    if (details.data.payload?.body?.data) {
      body = Buffer.from(details.data.payload.body.data, "base64").toString();
    } else {
      const textPart = parts.find(p => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString();
      }
    }

    // Logic to determine if it's a new deal
    // Simple heuristic for now: contains keywords or is a project brief
    const looksLikeDeal = body.toLowerCase().includes("project") || 
                         body.toLowerCase().includes("budget") || 
                         body.toLowerCase().includes("proposal");

    if (looksLikeDeal) {
      // Find or create client
      const contactEmail = from.match(/<(.+)>/)?.[1] || from;
      const client = await prisma.client.upsert({
        where: { contactEmail },
        update: {},
        create: {
          contactEmail,
          company: from.split("<")[0].trim() || "Unknown",
        },
      });

      // Create deal if not exists
      const existingDeal = await prisma.deal.findFirst({
        where: {
          clientId: client.id,
          freelancerId,
          status: "new",
        },
      });

      if (!existingDeal) {
        await prisma.deal.create({
          data: {
            freelancerId,
            clientId: client.id,
            status: "new",
            briefText: body,
            messages: {
              create: {
                direction: "inbound",
                body: body,
                sentAt: new Date(date),
              },
            },
          },
        });
      }
    }
  }
}
