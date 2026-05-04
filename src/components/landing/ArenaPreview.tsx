"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type Speaker = "prosecutor" | "defense" | "judge";

const ROUNDS: Array<{ speaker: Speaker; line: string }> = [
  { speaker: "prosecutor", line: "Lumen Analytics runs $40M ARR. $150 is an insult to your rate card." },
  { speaker: "defense",    line: "First engagement matters. Don't torpedo the relationship on round one." },
  { speaker: "prosecutor", line: "Floor: $850. Target: $1,200. Friday deadline means +15% rush." },
  { speaker: "defense",    line: "Cap revisions at one. That's your real protection, not price." },
  { speaker: "judge",      line: "Verdict: $1,200 · one revision · rush clause attached. Approve to draft." },
];

export function ArenaPreview() {
  const [step, setStep] = useState(0);
  const [isVerdict, setIsVerdict] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % ROUNDS.length;
        setIsVerdict(ROUNDS[next].speaker === "judge");
        return next;
      });
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const current = ROUNDS[step];

  return (
    <section id="arena" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-[1400px] px-6 py-20">
        {/* section header */}
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="col-span-12 lg:col-span-2">
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
              003 — The Arena
            </div>
          </div>
          <div className="col-span-12 lg:col-span-10">
            <h2
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 1, letterSpacing: "-0.03em" }}
            >
              The council{" "}
              <span style={{ fontStyle: "italic" }} className="text-[var(--color-text-muted)]">
                argues.
              </span>{" "}
              You watch.
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] text-sm max-w-xl leading-relaxed">
              Every deal triggers an adversarial deliberation between Prosecutor and Defense.
              The Judge delivers a binding verdict. Streamed live in your dashboard.
            </p>
          </div>
        </div>

        {/* FIGHT CARD */}
        <div
          className={`relative border overflow-hidden transition-all duration-500 ${
            isVerdict
              ? "border-[var(--color-judge)]"
              : "border-[var(--color-border-strong)]"
          }`}
        >
          {/* top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel-2)]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[var(--color-signal)] signal-pulse" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                ARENA · ROUND {String(step + 1).padStart(2, "0")} / {ROUNDS.length}
              </span>
            </div>
            <div className="flex gap-1">
              {ROUNDS.map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-0.5 transition-all duration-300"
                  style={{
                    background:
                      i < step
                        ? "var(--color-text-muted)"
                        : i === step
                        ? "var(--color-signal)"
                        : "var(--color-border-strong)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* main fight area */}
          <div className="grid grid-cols-[1fr_auto_1fr] min-h-[440px] md:min-h-[500px]">

            {/* PROSECUTOR */}
            <FighterCard
              role="prosecutor"
              active={current.speaker === "prosecutor"}
              side="left"
            />

            {/* CENTER — VS or VERDICT */}
            <div className="flex flex-col items-center justify-center px-4 md:px-8 border-x border-[var(--color-border)] bg-[var(--color-panel)]">
              <AnimatePresence mode="wait">
                {isVerdict ? (
                  <motion.div
                    key="verdict"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="font-mono text-[9px] tracking-widest uppercase"
                      style={{ color: "var(--color-judge)" }}
                    >
                      VERDICT
                    </div>
                    <GavelSVG />
                  </motion.div>
                ) : (
                  <motion.div
                    key="vs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-3xl md:text-4xl text-[var(--color-text-muted)] select-none"
                  >
                    VS
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DEFENSE */}
            <FighterCard
              role="defense"
              active={current.speaker === "defense"}
              side="right"
            />
          </div>

          {/* speech ribbon */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-5 min-h-[90px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className="flex items-start gap-5 w-full"
              >
                <div
                  className="font-mono text-[10px] tracking-widest uppercase shrink-0 pt-1"
                  style={{
                    color:
                      current.speaker === "judge"
                        ? "#b8960c"
                        : current.speaker === "prosecutor"
                        ? "#ff1a00"
                        : "#0a0a0a",
                  }}
                >
                  {current.speaker} →
                </div>
                <div
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.1rem,2.5vw,1.75rem)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
                >
                  &ldquo;{current.line}&rdquo;
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* JUDGE overlay when verdict */}
          <AnimatePresence>
            {isVerdict && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{ border: "2px solid var(--color-judge)" }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
            ↑ Preview · Live arena in dashboard → streamed via SSE + Gemini 2.5
          </div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-signal)]">
            {current.speaker.toUpperCase()} SPEAKING
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Fighter card (Prosecutor / Defense) ───────────────────── */
function FighterCard({
  role,
  active,
  side,
}: {
  role: "prosecutor" | "defense";
  active: boolean;
  side: "left" | "right";
}) {
  const isProsecutor = role === "prosecutor";
  const color = isProsecutor ? "var(--color-prosecutor)" : "var(--color-defense)";
  const borderColor = isProsecutor ? "var(--color-prosecutor)" : "var(--color-text)";
  const label = isProsecutor ? "PROSECUTOR" : "DEFENSE";
  const subtitle = isProsecutor ? "The Hawk" : "The Diplomat";

  return (
    <div
      className={`flex flex-col ${side === "right" ? "items-end text-right" : "items-start"} p-6 md:p-10 transition-all duration-300`}
      style={{
        background: active ? (isProsecutor ? "rgba(255,26,0,0.04)" : "rgba(0,0,0,0.02)") : "transparent",
      }}
    >
      {/* role tag */}
      <div
        className="font-mono text-[9px] tracking-[0.2em] uppercase mb-6 px-2 py-1 border"
        style={{
          borderColor: active ? borderColor : "var(--color-border)",
          color: active ? color : "var(--color-text-muted)",
          transition: "all 240ms",
        }}
      >
        {label}
      </div>

      {/* robot SVG */}
      <motion.div
        animate={active ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{ duration: 1.3, repeat: active ? Infinity : 0, ease: "easeInOut" }}
        style={{ filter: active && isProsecutor ? "drop-shadow(0 0 12px rgba(255,26,0,0.35))" : active ? "drop-shadow(0 0 10px rgba(0,0,0,0.18))" : "none", transition: "filter 400ms" }}
      >
        <RobotSVG
          role={role}
          active={active}
          mirrored={side === "right"}
        />
      </motion.div>

      {/* name + subtitle */}
      <div className="mt-6">
        <div
          style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", letterSpacing: "-0.02em", color: active ? color : "var(--color-text)" }}
          className="transition-colors duration-240"
        >
          {label}
        </div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mt-1">
          {subtitle}
        </div>
      </div>

      {/* speaking indicator */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "2rem" }}
            exit={{ opacity: 0, width: 0 }}
            className="mt-4 h-0.5"
            style={{ background: color }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Robot SVG ─────────────────────────────────────────────── */
function RobotSVG({
  role,
  active,
  mirrored,
}: {
  role: "prosecutor" | "defense";
  active: boolean;
  mirrored: boolean;
}) {
  const isPros = role === "prosecutor";
  const bodyColor = active ? (isPros ? "#FF1A00" : "#0a0a0a") : "#d4d4d4";
  const eyeColor  = active ? (isPros ? "#fff"    : "#fff")    : "#a3a3a3";
  const accentColor = isPros ? "#FF1A00" : "#0a0a0a";

  return (
    <svg
      width="140"
      height="182"
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: mirrored ? "scaleX(-1)" : "none", transition: "all 300ms" }}
    >
      {/* antenna */}
      <line x1="50" y1="0" x2="50" y2="14" stroke={bodyColor} strokeWidth="2" />
      <circle cx="50" cy="4" r="3" fill={active ? accentColor : "#d4d4d4"} />

      {/* head */}
      <rect x="22" y="14" width="56" height="44" rx="2"
        fill="var(--color-panel)" stroke={bodyColor} strokeWidth="2" />

      {/* visor — full width bar */}
      <rect x="26" y="22" width="48" height="16" rx="1"
        fill={active ? accentColor : "#ececec"} opacity={active ? 0.15 : 1} />

      {/* eyes */}
      <rect x="31" y="26" width="14" height="8" rx="1" fill={active ? accentColor : "#d4d4d4"} />
      <rect x="55" y="26" width="14" height="8" rx="1" fill={active ? accentColor : "#d4d4d4"} />

      {/* pupil dots */}
      {active && (
        <>
          <rect x="36" y="28" width="4" height="4" fill={eyeColor} />
          <rect x="60" y="28" width="4" height="4" fill={eyeColor} />
        </>
      )}

      {/* mouth — horizontal lines */}
      <line x1="34" y1="47" x2="46" y2="47" stroke={bodyColor} strokeWidth="1.5" />
      <line x1="50" y1="47" x2="66" y2="47" stroke={bodyColor} strokeWidth="1.5" />

      {/* neck */}
      <rect x="43" y="58" width="14" height="8" fill={bodyColor} />

      {/* body */}
      <rect x="14" y="66" width="72" height="48" rx="2"
        fill="var(--color-panel)" stroke={bodyColor} strokeWidth="2" />

      {/* chest plate detail */}
      <rect x="30" y="74" width="40" height="24" rx="1"
        fill={active ? accentColor : "#ececec"} opacity={active ? 0.1 : 1} />
      <rect x="36" y="80" width="12" height="4" fill={active ? accentColor : "#d4d4d4"} />
      <rect x="52" y="80" width="12" height="4" fill={active ? accentColor : "#d4d4d4"} />
      <rect x="40" y="88" width="20" height="3" rx="0.5" fill={active ? accentColor : "#d4d4d4"} />

      {/* arms */}
      <rect x="0" y="68" width="12" height="36" rx="2"
        fill="var(--color-panel)" stroke={bodyColor} strokeWidth="1.5" />
      <rect x="88" y="68" width="12" height="36" rx="2"
        fill="var(--color-panel)" stroke={bodyColor} strokeWidth="1.5" />

      {/* legs */}
      <rect x="22" y="114" width="22" height="16" rx="2"
        fill="var(--color-panel)" stroke={bodyColor} strokeWidth="1.5" />
      <rect x="56" y="114" width="22" height="16" rx="2"
        fill="var(--color-panel)" stroke={bodyColor} strokeWidth="1.5" />
    </svg>
  );
}

/* ── Gavel SVG ─────────────────────────────────────────────── */
function GavelSVG() {
  return (
    <motion.svg
      width="48" height="48" viewBox="0 0 48 48" fill="none"
      animate={{ rotate: [0, -20, 10, 0] }}
      transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatDelay: 2 }}
    >
      <rect x="8" y="8" width="20" height="10" rx="1"
        fill="var(--color-judge)" transform="rotate(45 18 13)" />
      <line x1="22" y1="22" x2="38" y2="38"
        stroke="var(--color-judge)" strokeWidth="4" strokeLinecap="square" />
    </motion.svg>
  );
}
