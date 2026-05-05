import { prisma } from "@/lib/prisma";
import { streamJSON } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const { currentDraft, instructions } = (await req.json()) as {
    currentDraft: string;
    instructions: string;
  };

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { freelancer: true, client: true },
  });

  const system = `You are the Pactix Negotiator agent. Apply the user's natural language instructions to the draft reply.
Preserve the core facts, numbers, and tone of the original draft unless the instructions specifically ask to change them.
The instructions might be in a different language; interpret them and apply the changes to the draft (which should remain in its original language or as directed).
Sign the email "${deal.freelancer.name}".
Output strict JSON: { "replyBody": "..." }`;

  const user = `Original draft:\n\n${currentDraft}\n\nUser instructions:\n\n${instructions}`;

  let finalOut: { replyBody?: string } = {};
  for await (const chunk of streamJSON({
    system,
    user,
    temperature: 0.5,
    agentName: "negotiator-edit",
    schemaHint: '{"replyBody": "string"}',
  })) {
    if (chunk.type === "done") finalOut = chunk.data as { replyBody?: string };
    else if (chunk.type === "error")
      return Response.json({ error: chunk.error || "edit failed" }, { status: 500 });
  }

  return Response.json({ replyBody: finalOut.replyBody ?? currentDraft });
}
