import { prisma } from "@/lib/prisma";
import { streamJSON } from "@/lib/llm";

export const runtime = "nodejs";

const TONE_PRIMERS: Record<string, string> = {
  friendly:
    "Warm, collegial, slightly informal. Soften any pushback. Use first names. Lead with appreciation.",
  professional:
    "Neutral, polished, businesslike. Plain prose, no filler. Direct but not curt.",
  firm:
    "Confident, declarative. Anchor your number first. No hedging language. Short sentences.",
  assertive:
    "Take a strong position. Use 'I require' and 'my rate is' phrasing. Mention scarcity or alternative work briefly.",
  hardball:
    "Take-it-or-leave-it tone. State terms as non-negotiable. Polite but unmovable. End with a clear deadline.",
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const { tone, currentDraft } = (await req.json()) as {
    tone: string;
    currentDraft: string;
  };

  const primer = TONE_PRIMERS[tone] ?? TONE_PRIMERS.professional;

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { freelancer: true, client: true },
  });

  const system = `You are the Pactix Negotiator agent. Re-write the freelancer's draft reply in a different tone.
Preserve every concrete number, deliverable, deadline and decision exactly. Only change voice/word-choice/sentence cadence.
Tone target: ${tone.toUpperCase()} — ${primer}
Sign the email "${deal.freelancer.name}".
Output strict JSON: { "replyBody": "..." }`;

  const user = `Original draft to rewrite (preserve all facts and numbers):\n\n${currentDraft}`;

  let finalOut: { replyBody?: string } = {};
  for await (const chunk of streamJSON({
    system,
    user,
    temperature: 0.7,
    agentName: "negotiator-regen",
    schemaHint: '{"replyBody": "string"}',
  })) {
    if (chunk.type === "done") finalOut = chunk.data as { replyBody?: string };
    else if (chunk.type === "error")
      return Response.json({ error: chunk.error || "regen failed" }, { status: 500 });
  }

  return Response.json({ replyBody: finalOut.replyBody ?? currentDraft });
}
