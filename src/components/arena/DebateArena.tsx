"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Gavel, Zap, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { useDealStore, type LiveAgentName } from "@/store/deal-store";

interface DebateMessage {
  id: string;
  agent: "prosecutor" | "defense" | "judge";
  text: string;
  timestamp: number;
}

function AgentAvatar({ agent, size = "md" }: { agent: string; size?: "sm" | "md" }) {
  const config: Record<string, { icon: typeof Sword; bg: string; border: string }> = {
    prosecutor: { icon: Sword, bg: "rgba(255,26,0,0.1)", border: "#ff1a00" },
    defense: { icon: Shield, bg: "rgba(10,10,10,0.08)", border: "#0a0a0a" },
    judge: { icon: Gavel, bg: "rgba(184,150,12,0.1)", border: "#b8960c" },
  };
  const c = config[agent] || config.judge;
  const Icon = c.icon;
  const s = size === "sm" ? "w-7 h-7" : "w-10 h-10";
  const iconS = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div
      className={`${s} shrink-0 flex items-center justify-center`}
      style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
    >
      <Icon className={iconS} style={{ color: c.border }} />
    </div>
  );
}

function DebateBubble({ msg, index }: { msg: DebateMessage; index: number }) {
  const isLeft = msg.agent === "prosecutor";
  const isJudge = msg.agent === "judge";

  if (isJudge) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col items-center gap-3 py-6 px-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <Gavel className="w-5 h-5 text-[#b8960c]" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-[#b8960c]">
            Judge's Verdict
          </span>
        </div>
        <div
          className="w-full max-w-lg border-2 border-[#b8960c]/40 bg-[#b8960c]/5 px-5 py-4"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
        >
          <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -20 : 20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={`flex gap-3 max-w-[75%] ${isLeft ? "self-start" : "self-end flex-row-reverse"}`}
    >
      <AgentAvatar agent={msg.agent} size="sm" />
      <div>
        <div className={`font-mono text-[8px] tracking-widest uppercase mb-1 ${isLeft ? "text-[#ff1a00]/60" : "text-white/30"}`}>
          {msg.agent}
        </div>
        <div
          className="px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap"
          style={{
            background: isLeft ? "rgba(255,26,0,0.08)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${isLeft ? "rgba(255,26,0,0.25)" : "rgba(255,255,255,0.1)"}`,
            color: isLeft ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.75)",
          }}
        >
          {msg.text}
        </div>
      </div>
    </motion.div>
  );
}

export function DebateArena() {
  const live = useDealStore((s) => s.live);
  const dispatching = useDealStore((s) => s.dispatching);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const prevStreamRef = useRef<Record<string, string>>({});

  // Extract debate messages from live agent stream text
  useEffect(() => {
    const agents: Array<"prosecutor" | "defense" | "judge"> = ["prosecutor", "defense", "judge"];
    const newMessages: DebateMessage[] = [];

    for (const agent of agents) {
      const agentState = live[agent];
      const currentText = agentState.streamText || "";
      const prevText = prevStreamRef.current[agent] || "";

      if (currentText.length > prevText.length) {
        const newText = currentText.slice(prevText.length).trim();
        if (newText.length > 5) {
          // Split long texts into sentence-sized chunks for debate effect
          const sentences = newText.match(/[^.!?]+[.!?]+/g) || [newText];
          for (const sentence of sentences) {
            if (sentence.trim().length > 3) {
              newMessages.push({
                id: `${agent}-${Date.now()}-${Math.random()}`,
                agent,
                text: sentence.trim(),
                timestamp: Date.now(),
              });
            }
          }
        }
      }
      prevStreamRef.current[agent] = currentText;
    }

    if (newMessages.length > 0) {
      setMessages((prev) => [...prev, ...newMessages]);
    }
  }, [live.prosecutor.streamText, live.defense.streamText, live.judge.streamText]);

  // Reset messages when dispatch starts
  useEffect(() => {
    if (dispatching) {
      setMessages([]);
      prevStreamRef.current = {};
    }
  }, [dispatching]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const prosecutorStatus = live.prosecutor.status;
  const defenseStatus = live.defense.status;
  const judgeStatus = live.judge.status;
  const isDebating = prosecutorStatus === "thinking" || defenseStatus === "thinking" || judgeStatus === "thinking";
  const debateComplete = prosecutorStatus === "done" && defenseStatus === "done";

  if (!dispatching && messages.length === 0) return null;

  return (
    <div className="border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-3 flex items-center justify-between border-b border-white/10 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Scale className="w-4 h-4 text-[#ff1a00]" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-white/60">
            The Arena — Live Debate
          </span>
          {isDebating && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-1"
            >
              <div className="w-1.5 h-1.5 bg-[#ff1a00] rounded-full" />
              <span className="font-mono text-[8px] text-[#ff1a00] tracking-widest">LIVE</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-white/30">
            {messages.length} exchanges
          </span>
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-white/30" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Combatants header */}
            <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AgentAvatar agent="prosecutor" size="sm" />
                <div>
                  <div className="font-mono text-[9px] tracking-widest uppercase text-[#ff1a00]">
                    Prosecutor
                  </div>
                  <div className="font-mono text-[7px] text-white/30">The Hawk</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="font-mono text-[9px] tracking-widest uppercase text-white/20">
                  VS
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="text-right">
                  <div className="font-mono text-[9px] tracking-widest uppercase text-white/60">
                    Defense
                  </div>
                  <div className="font-mono text-[7px] text-white/30">The Diplomat</div>
                </div>
                <AgentAvatar agent="defense" size="sm" />
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="max-h-[320px] overflow-y-auto px-5 py-4 flex flex-col gap-3"
            >
              {messages.length === 0 && isDebating && (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#ff1a00]" />
                    <span className="font-mono text-[10px] text-white/40 tracking-widest">
                      Agents entering the arena...
                    </span>
                  </motion.div>
                </div>
              )}
              {messages.map((msg, i) => (
                <DebateBubble key={msg.id} msg={msg} index={i} />
              ))}
            </div>

            {/* Verdict indicator */}
            {debateComplete && judgeStatus !== "done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 py-3 border-t border-white/5 flex items-center justify-center gap-2"
              >
                <motion.div
                  animate={{ rotate: [0, -15, 15, -15, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Gavel className="w-4 h-4 text-[#b8960c]" />
                </motion.div>
                <span className="font-mono text-[9px] tracking-widest uppercase text-[#b8960c]">
                  Judge is deliberating...
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
