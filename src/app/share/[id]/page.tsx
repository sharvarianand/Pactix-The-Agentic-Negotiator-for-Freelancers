import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicShareViewer } from "@/components/PublicShareViewer";
import { PactixLogo } from "@/components/shell/Logo";

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      client: true,
      agentTraces: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!deal) {
    return notFound();
  }

  // Convert to plain objects to pass to Client Component
  const plainDeal = {
    ...deal,
    createdAt: deal.createdAt.toISOString(),
    closedAt: deal.closedAt?.toISOString() || null,
    client: { ...deal.client },
    agentTraces: deal.agentTraces.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header className="h-14 px-6 border-b border-[var(--color-border)] bg-[var(--color-panel)] flex items-center justify-between">
        <PactixLogo href="/" size="sm" />
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
          Public Replay Link
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="mb-6 text-center">
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", letterSpacing: "-0.02em" }}>
              Deal Deliberation
            </h1>
            <p className="text-[var(--color-text-muted)]">
              Agent trace replay for <span className="font-medium text-[var(--color-text)]">{deal.client.company}</span>
            </p>
          </div>

          <PublicShareViewer deal={plainDeal} />
        </div>
      </main>
    </div>
  );
}
