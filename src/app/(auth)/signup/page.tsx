"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { PactixLogo } from "@/components/shell/Logo";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

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
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
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
