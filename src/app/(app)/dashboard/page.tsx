"use client";

import { useEffect } from "react";
import { Inbox } from "@/components/Inbox";
import { EmailDetail } from "@/components/EmailDetail";
import { AgentCouncil } from "@/components/AgentCouncil";
import { useDealStore } from "@/store/deal-store";

export default function Home() {
  const loadDeals = useDealStore((s) => s.loadDeals);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Three-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        <Inbox />
        <EmailDetail />
        <AgentCouncil />
      </div>
    </div>
  );
}
