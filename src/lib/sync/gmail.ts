import { google, type gmail_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { getGoogleOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------
async function getAuthedClient(freelancerId: string): Promise<OAuth2Client | null> {
  const account = await prisma.connectedAccount.findUnique({
    where: { freelancerId_provider: { freelancerId, provider: "google" } },
  });
  if (!account) return null;

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.expiresAt?.getTime(),
  });

  // Persist refreshed tokens back to DB
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

  return oauth2Client;
}

// ---------------------------------------------------------------------------
// Body extraction — walks multipart MIME tree, prefers text/plain, falls back to HTML
// ---------------------------------------------------------------------------
function decode(b64url: string): string {
  return Buffer.from(b64url.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  // Walk parts recursively; collect text/plain first, then text/html as fallback
  let plain = "";
  let html = "";

  function walk(part: gmail_v1.Schema$MessagePart) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      plain += decode(part.body.data) + "\n";
    } else if (part.mimeType === "text/html" && part.body?.data) {
      html += decode(part.body.data) + "\n";
    }
    for (const p of part.parts ?? []) walk(p);
  }
  walk(payload);

  if (plain.trim()) return plain.trim();
  if (html.trim()) {
    // Strip tags as a basic fallback
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFrom(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/"/g, "").trim() || m[2], email: m[2] };
  return { name: from || "Unknown", email: from.trim() };
}

// Heuristic — treats anything that looks like a freelance / project inquiry as a deal
function looksLikeDeal(subject: string, body: string): boolean {
  const text = (subject + " " + body).toLowerCase();
  const keywords = [
    "project", "budget", "proposal", "quote", "freelance", "scope",
    "hire", "rate", "timeline", "deliverable", "engagement", "contract",
    "work with you", "looking for", "redesign", "build", "develop",
  ];
  return keywords.some((k) => text.includes(k));
}

// ---------------------------------------------------------------------------
// Public: sync inbox — returns count of new deals + new messages
// ---------------------------------------------------------------------------
export interface SyncResult {
  scanned: number;
  newDeals: number;
  newMessages: number;
  skipped: number;
  errors: string[];
}

export async function syncGmailForUser(freelancerId: string): Promise<SyncResult> {
  const result: SyncResult = {
    scanned: 0,
    newDeals: 0,
    newMessages: 0,
    skipped: 0,
    errors: [],
  };

  const auth = await getAuthedClient(freelancerId);
  if (!auth) {
    result.errors.push("Gmail not connected for this user");
    return result;
  }

  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: 20,
    q: "in:inbox newer_than:30d",
  });

  const messages = listRes.data.messages ?? [];
  result.scanned = messages.length;

  for (const msg of messages) {
    if (!msg.id) continue;

    // Skip if already imported
    const existing = await prisma.message.findUnique({
      where: { gmailMessageId: msg.id },
    });
    if (existing) {
      result.skipped++;
      continue;
    }

    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = detail.data.payload?.headers ?? undefined;
      const subject = getHeader(headers, "Subject") || "(no subject)";
      const fromRaw = getHeader(headers, "From");
      const dateRaw = getHeader(headers, "Date");
      const threadId = detail.data.threadId ?? null;
      const body = extractBody(detail.data.payload ?? undefined);

      if (!body || !fromRaw) {
        result.skipped++;
        continue;
      }

      const { name: fromName, email: fromEmail } = parseFrom(fromRaw);
      const sentAt = dateRaw ? new Date(dateRaw) : new Date();

      // If this email is already part of an existing deal thread, just append it
      if (threadId) {
        const existingDeal = await prisma.deal.findFirst({
          where: { gmailThreadId: threadId, freelancerId },
        });
        if (existingDeal) {
          await prisma.message.create({
            data: {
              dealId: existingDeal.id,
              direction: "inbound",
              subject,
              body,
              sentAt,
              gmailMessageId: msg.id,
              gmailThreadId: threadId,
            },
          });
          result.newMessages++;
          continue;
        }
      }

      // Heuristic gate before creating a new deal
      if (!looksLikeDeal(subject, body)) {
        result.skipped++;
        continue;
      }

      const client = await prisma.client.upsert({
        where: { contactEmail: fromEmail },
        update: {},
        create: {
          contactEmail: fromEmail,
          company: fromName,
        },
      });

      await prisma.deal.create({
        data: {
          freelancerId,
          clientId: client.id,
          status: "new",
          briefText: body.slice(0, 4000),
          gmailThreadId: threadId,
          messages: {
            create: {
              direction: "inbound",
              subject,
              body,
              sentAt,
              gmailMessageId: msg.id,
              gmailThreadId: threadId,
            },
          },
        },
      });
      result.newDeals++;
    } catch (e) {
      result.errors.push(
        `msg ${msg.id}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public: send reply via Gmail — threads on existing gmailThreadId when set
// ---------------------------------------------------------------------------
function toBase64Url(s: string): string {
  return Buffer.from(s, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export interface SendReplyInput {
  freelancerId: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string | null;
  inReplyTo?: string | null;
}

export interface SendReplyResult {
  sent: boolean;
  gmailMessageId?: string;
  gmailThreadId?: string;
  error?: string;
}

export async function sendGmailReply(input: SendReplyInput): Promise<SendReplyResult> {
  const auth = await getAuthedClient(input.freelancerId);
  if (!auth) return { sent: false, error: "Gmail not connected" };

  const gmail = google.gmail({ version: "v1", auth });

  const subjectLine = input.subject.toLowerCase().startsWith("re:")
    ? input.subject
    : `Re: ${input.subject}`;

  const headers: string[] = [
    `To: ${input.to}`,
    `Subject: ${subjectLine}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ];
  if (input.inReplyTo) {
    headers.push(`In-Reply-To: <${input.inReplyTo}>`);
    headers.push(`References: <${input.inReplyTo}>`);
  }

  const raw = toBase64Url(headers.join("\r\n") + "\r\n\r\n" + input.body);

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
        threadId: input.threadId ?? undefined,
      },
    });
    return {
      sent: true,
      gmailMessageId: res.data.id ?? undefined,
      gmailThreadId: res.data.threadId ?? undefined,
    };
  } catch (e) {
    return {
      sent: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

