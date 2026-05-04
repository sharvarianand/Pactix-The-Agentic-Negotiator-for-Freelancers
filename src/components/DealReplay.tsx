"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, X, Clock, Zap, Sword, Shield, Gavel, Search, Compass, Mic } from "lucide-react";
import { useDealStore, type AgentTraceRow } from "@/store/deal-store";

const AGENT_META: Record<string, { icon: typeof Sword; color: string; label: string }> = {
  orchestrator: { icon: Compass, color: "#737373", label: "Orchestrator" },
  scout:        { icon: Search,  color: "#737373", label: "Scout" },
  prosecutor:   { icon: Sword,   color: "#ff1a00", label: "Prosecutor" },
  defense:      { icon: Shield,  color: "#0a0a0a", label: "Defense" },
  judge:        { icon: Gavel,   color: "#b8960c", label: "Judge" },
  negotiator:   { icon: Mic,     color: "#ff1a00", label: "Negotiator" },
};

export function DealReplay() {
  const deal = useDealStore((s) => s.deals.find((d) => d.id === s.selectedDealId));
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(4);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const traces = deal?.agentTraces
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [];

  const startPlay = useCallback(() => {
    if (traces.length === 0) return;
    setPlaying(true);
  }, [traces.length]);

  const stopPlay = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (playing && traces.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= traces.length - 1) {
            stopPlay();
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, traces.length, stopPlay]);

  const reset = () => {
    stopPlay();
    setCurrentIdx(0);
  };

  if (!deal || traces.length === 0) return null;

  const visibleTraces = traces.slice(0, currentIdx + 1);
  const progress = traces.length > 0 ? ((currentIdx + 1) / traces.length) * 100 : 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <Play className="w-3 h-3" fill="currentColor" />
        Replay deal
      </button>

      {/* Replay modal */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#0a0a0a] text-white border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-widest uppercase text-white/40">
                    Deal Replay · {deal.client.company}
                  </div>
                  <div
                    style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}
                  >
                    Agent trace playback
                  </div>
                </div>
                <button
                  onClick={() => { setOpen(false); stopPlay(); }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress scrubber */}
              <div className="px-5 py-3 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => (playing ? stopPlay() : startPlay())}
                    className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    {playing ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" fill="currentColor" />
                    )}
                  </button>
                  <button
                    onClick={reset}
                    className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentIdx(Math.min(currentIdx + 1, traces.length - 1))}
                    className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  {/* Speed control */}
                  <div className="flex items-center gap-1 ml-2">
                    {[1, 2, 4, 8].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className="font-mono text-[9px] px-2 py-1 transition-colors"
                        style={{
                          background: speed === s ? "#ff1a00" : "transparent",
                          color: speed === s ? "#000" : "rgba(255,255,255,0.4)",
                          border: `1px solid ${speed === s ? "#ff1a00" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>

                  <div className="ml-auto font-mono text-[9px] text-white/30">
                    {currentIdx + 1} / {traces.length} traces
                  </div>
                </div>

                {/* Scrubber bar */}
                <div
                  className="h-2 bg-white/5 cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    setCurrentIdx(Math.round(pct * (traces.length - 1)));
                  }}
                >
                  <motion.div
                    className="h-full bg-[#ff1a00]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                  {/* Round markers */}
                  {traces.map((t, i) => {
                    const pct = traces.length > 1 ? (i / (traces.length - 1)) * 100 : 50;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-[1px]"
                        style={{
                          left: `${pct}%`,
                          background: i <= currentIdx ? "#ff1a00" : "rgba(255,255,255,0.1)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Traces */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {visibleTraces.map((trace, i) => {
                  const meta = AGENT_META[trace.agentName] || AGENT_META.orchestrator;
                  const Icon = meta.icon;
                  const isLatest = i === visibleTraces.length - 1;

                  let parsedOutput: { decision?: string; recommendedCounter?: number } = {};
                  try { parsedOutput = JSON.parse(trace.output) as { decision?: string; recommendedCounter?: number }; } catch {}

                  return (
                    <motion.div
                      key={trace.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isLatest ? 1 : 0.6, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border px-4 py-3"
                      style={{
                        borderColor: isLatest ? meta.color : "rgba(255,255,255,0.06)",
                        background: isLatest ? `${meta.color}08` : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                        <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: meta.color }}>
                          {meta.label} · R{trace.round}
                        </span>
                        <span className="ml-auto flex items-center gap-1 font-mono text-[9px] text-white/30">
                          <Clock className="w-2.5 h-2.5" />
                          {trace.latencyMs}ms
                        </span>
                      </div>
                      {isLatest && (
                        <div className="font-mono text-[11px] text-white/50 leading-relaxed line-clamp-3 mt-1">
                          {trace.reasoning.slice(0, 200)}{trace.reasoning.length > 200 ? "…" : ""}
                        </div>
                      )}
                      {isLatest && trace.agentName === "judge" && parsedOutput.decision && (
                        <div className="mt-2 flex items-center gap-2 font-mono text-[10px]">
                          <span className="px-2 py-0.5" style={{
                            background: parsedOutput.decision === "accept" ? "rgba(22,163,74,0.2)" : parsedOutput.decision === "counter" ? "rgba(184,150,12,0.2)" : "rgba(255,26,0,0.2)",
                            color: parsedOutput.decision === "accept" ? "#16a34a" : parsedOutput.decision === "counter" ? "#b8960c" : "#ff1a00",
                          }}>
                            {String(parsedOutput.decision).toUpperCase()}
                          </span>
                          {parsedOutput.recommendedCounter && (
                            <span className="text-white/50">${String(parsedOutput.recommendedCounter)}</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
