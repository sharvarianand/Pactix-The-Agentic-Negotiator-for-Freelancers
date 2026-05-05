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

  const system = `You are the Pactix Negotiator agent. Refine the following draft based on the user's instructions.
Preserve the core deal facts (numbers, dates, items) unless the user explicitly asks to change them.
The instructions may be in any language; respond in the same language as the original draft unless asked otherwise.
Sign the email "${deal.freelancer.name}".
Output strict JSON: { "refinedBody": "..." }`;

  const user = `Original draft:\n\n${currentDraft}\n\nUser instructions:\n\n${instructions}`;

  let finalOut: { refinedBody?: string } = {};
  for await (const chunk of streamJSON({
    system,
    user,
    temperature: 0.7,
    agentName: "negotiator-refine",
    schemaHint: '{"refinedBody": "string"}',
  })) {
    if (chunk.type === "done") finalOut = chunk.data as { refinedBody?: string };
    else if (chunk.type === "error")
      return Response.json({ error: chunk.error || "refinement failed" }, { status: 500 });
  }

  return Response.json({ refinedBody: finalOut.refinedBody ?? currentDraft });
}
