"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { PactixLogo } from "@/components/shell/Logo";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      toast.info("Assembling your AI council...");
      // Create the profile and seed data
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          name: name,
        }),
      });
      
      toast.success("Account ready! Welcome to Pactix.");
      // Reset onboarding for new user
      localStorage.removeItem("pactix-onboarding-seen");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* left panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[var(--color-text)] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="relative z-10">
          <PactixLogo size="sm" color="white" />
        </div>
        <div className="relative z-10">
          <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-6">Start free</div>
          <h2
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,4vw,4rem)", lineHeight: 1, letterSpacing: "-0.03em", color: "#fff" }}
          >
            Close deals.
            <br />
            <span style={{ color: "#ff1a00" }}>Not</span> spreadsheets.
          </h2>
          <p className="mt-6 text-white/50 text-sm max-w-xs leading-relaxed">
            Your first deal is free. No credit card. The council is ready in under 60 seconds.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 border-t border-white/10 pt-8 gap-6">
          {[["Free", "to start"], ["6", "AI agents"], ["< 8s", "per verdict"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.03em", color: "#fff" }}>{n}</div>
              <div className="font-mono text-[9px] tracking-widest uppercase text-white/35 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* right panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12">
        <div className="max-w-[400px] w-full mx-auto">
          <div className="lg:hidden mb-10">
            <PactixLogo href="/" size="sm" />
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
              Create account
            </div>
            <h1
              style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", letterSpacing: "-0.03em", lineHeight: 1 }}
              className="mb-8"
            >
              Join <span className="text-[var(--color-signal)]">Pactix</span>
            </h1>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 border border-[var(--color-border)] bg-white text-[var(--color-text)] font-medium text-sm flex items-center justify-center gap-3 hover:bg-[var(--color-panel-2)] transition-all mb-6 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                or use email
              </span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maya Chen"
                  className="w-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-dim)]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-dim)]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-dim)] pr-12"
                    required
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
                {loading ? "Setting up council…" : <>Create account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--color-text)] underline underline-offset-4 hover:text-[var(--color-signal)] transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
