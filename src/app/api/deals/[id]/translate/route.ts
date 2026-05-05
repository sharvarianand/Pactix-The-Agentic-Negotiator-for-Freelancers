import { prisma } from "@/lib/prisma";
import { streamJSON } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const { currentDraft } = (await req.json()) as {
    currentDraft: string;
  };

  const system = `You are a professional translator. Translate the following text into English. 
Maintain the original tone and preserve all numbers, dates, and names exactly. 
If the text is already in English, return it as is.
Output strict JSON: { "translation": "..." }`;

  const user = `Text to translate:\n\n${currentDraft}`;

  let finalOut: { translation?: string } = {};
  for await (const chunk of streamJSON({
    system,
    user,
    temperature: 0.3,
    agentName: "translator",
    schemaHint: '{"translation": "string"}',
  })) {
    if (chunk.type === "done") finalOut = chunk.data as { translation?: string };
    else if (chunk.type === "error")
      return Response.json({ error: chunk.error || "translation failed" }, { status: 500 });
  }

  return Response.json({ translation: finalOut.translation ?? currentDraft });
}
