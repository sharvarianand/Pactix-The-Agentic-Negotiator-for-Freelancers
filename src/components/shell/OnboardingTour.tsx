"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Bot, BarChart3, FileText, Keyboard } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to Pactix",
    body: "Your AI deal desk. Eight adversarial agents argue over every client email, negotiate in your voice, and close the contract — while you watch.",
    icon: Sparkles,
    position: "center" as const,
  },
  {
    title: "The Inbox",
    body: "Every client email lands here. Select a deal to see the full thread and council traces. Click 'Send to Pactix' to start the council.",
    icon: FileText,
    position: "left" as const,
  },
  {
    title: "The Arena",
    body: "Watch Prosecutor and Defense agents argue in real-time. The Judge weighs both sides and issues a binding verdict. The Negotiator writes the reply in your voice.",
    icon: Bot,
    position: "center" as const,
  },
  {
    title: "Analytics & Control",
    body: "Track win probability, rate uplift, and revenue across all deals. Every decision is audit-trailed.",
    icon: BarChart3,
    position: "right" as const,
  },
  {
    title: "Power Shortcuts",
    body: "Press ⌘K for the command palette. D to dispatch, A to approve, N for next deal. You're in control.",
    icon: Keyboard,
    position: "center" as const,
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("pactix-onboarding-seen");
    if (!seen) {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("pactix-onboarding-seen", "true");
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (dismissed) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -20 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[var(--color-panel)] border border-[var(--color-border-strong)] shadow-2xl"
        >
          {/* Progress bar */}
          <div className="h-[3px] bg-[var(--color-border)]">
            <motion.div
              className="h-full bg-[var(--color-signal)]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pt-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ background: "var(--color-signal)", color: "#fff" }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]">
                  Step {step + 1} of {STEPS.length}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.2rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {current.title}
                </div>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              {current.body}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: "var(--color-signal)", color: "#fff" }}
            >
              {step === STEPS.length - 1 ? "Get started" : "Next"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
