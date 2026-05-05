"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { PactixLogo } from "@/components/shell/Logo";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const DEMO_LINES = [
  "ORCHESTRATOR → classifying deal scope…",
  "SCOUT → Lumen Analytics: $40M ARR",
  "PROSECUTOR → target $1,200",
  "JUDGE → verdict: approved",
  "NEGOTIATOR → drafting reply…",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickIdx, setTickIdx] = useState(0);

  async function setSessionAndGo() {
    await fetch("/api/auth/login", { method: "POST" });
    router.push("/dashboard");
  }

  async function handleDemo() {
    setLoading(true);
    // Directly log in as a demo user or just use a standard login
    // For now, we'll just show the login form or provide a "Demo Login" button
    // that uses a predefined demo account if you have one, 
    // but the user wants NEW users to also have the same details.
    // So we'll just encourage signing in/up.
    
    // If they want a "one-click" demo, we can use an anonymous sign-in or a shared demo account.
    // But since they want NEW users to have it too, standard auth is better.
    router.push("/signup"); 
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* ── Left panel — editorial black ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[var(--color-text)] flex-col justify-between p-12 relative overflow-hidden">
        {/* dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* logo */}
        <div className="relative z-10">
          <PactixLogo size="sm" color="white" />
        </div>

        {/* center manifesto */}
        <div className="relative z-10">
          <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-6">
            The Agentic Deal Desk
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem,4vw,4rem)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Six agents.
            <br />
            <span style={{ color: "#ff1a00" }}>One</span> verdict.
            <br />
            <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.55)" }}>Your</span> price.
          </h2>

          {/* live ticker */}
          <div className="mt-10 border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#ff1a00]"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              />
              <span className="font-mono text-[9px] tracking-widest uppercase text-white/40">Council · Live</span>
            </div>
            <motion.div
              key={tickIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[11px] text-white/70 tracking-wider"
            >
              {DEMO_LINES[tickIdx]}
            </motion.div>
          </div>
        </div>

        {/* bottom stats */}
        <div className="relative z-10 grid grid-cols-3 border-t border-white/10 pt-8 gap-6">
          {[["6", "AI agents"], ["+30%", "rate uplift"], ["< 8s", "verdict"]].map(([n, l]) => (
            <div key={l}>
              <div
                style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.03em", color: "#ffffff" }}
              >
                {n}
              </div>
              <div className="font-mono text-[9px] tracking-widest uppercase text-white/35 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12">
        <div className="max-w-[400px] w-full mx-auto">
          {/* mobile logo */}
          <div className="lg:hidden mb-10">
            <PactixLogo href="/" size="sm" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
              Welcome back
            </div>
            <h1
              style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", letterSpacing: "-0.03em", lineHeight: 1 }}
              className="mb-8"
            >
              Sign in to
              <br />
              <span className="text-[var(--color-signal)]">Pactix</span>
            </h1>

            {/* Demo CTA — most prominent */}
            <button
              onClick={handleDemo}
              disabled={loading}
              className="w-full py-4 bg-[var(--color-text)] text-[var(--color-bg)] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 mb-6"
            >
              {loading ? (
                <span className="font-mono text-xs tracking-widest animate-pulse">
                  {DEMO_LINES[tickIdx]}
                </span>
              ) : (
                <>
                  Enter demo — no account needed
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                or sign in
              </span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-dim)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-dim)] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-signal w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                Sign in <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
              No account?{" "}
              <Link href="/signup" className="text-[var(--color-text)] underline underline-offset-4 hover:text-[var(--color-signal)] transition-colors">
                Create one free
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
