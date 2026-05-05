import { prisma } from "@/lib/prisma";
import { runCouncil, type CouncilEvent } from "@/agents/council";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/deals/:id/dispatch
// Streams Server-Sent Events as the council deliberates.
// Each event is a JSON blob of type CouncilEvent.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check ownership
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { freelancerId: true },
  });

  if (!deal || deal.freelancerId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Determine the round: count prior orchestrator traces + 1.
  const priorRounds = await prisma.agentTrace.count({
    where: { dealId, agentName: "orchestrator" },
  });
  const round = priorRounds + 1;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (ev: CouncilEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(ev)}\n\n`)
          );
        } catch {
          /* client may have disconnected */
        }
      };

      try {
        await runCouncil(dealId, round, emit);
      } catch (e) {
        emit({
          kind: "agent_error",
          agent: "council",
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
