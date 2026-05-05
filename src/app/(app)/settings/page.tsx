"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

function Field({
  label, value, type = "text", onChange, mono = false
}: {
  label: string; value: string; type?: string;
  onChange: (v: string) => void; mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors"
        style={mono ? { fontFamily: "var(--font-mono)" } : undefined}
      />
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[var(--color-border)]"
    >
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mt-0.5">
          {sub}
        </div>
      </div>
      <div className="px-6 py-6 flex flex-col gap-5">{children}</div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [voice, setVoice] = useState("");
  const [floor, setFloor] = useState("500");
  const [target, setTarget] = useState("1200");
  const [walkaway, setWalkaway] = useState("350");

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const res = await fetch(`/api/auth/sync?email=${user.email}`);
        const data = await res.json();
        if (data.freelancer) {
          setProfile(data.freelancer);
          setName(data.freelancer.name);
          setEmail(data.freelancer.email);
          setVoice(data.freelancer.voiceStyleSamples || "");
          setFloor(data.freelancer.floorRateHourly?.toString() || "500");
          setIsGoogleConnected(data.freelancer.connectedAccounts?.some((a: any) => a.provider === "google"));
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSave() {
    setSaved(true);
    toast.success("Settings updated");
    setTimeout(() => setSaved(false), 2000);
  }

  function connectGoogle() {
    window.location.href = "/api/auth/google";
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center font-mono text-sm animate-pulse">
      SYNCING_CONFIG...
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 px-8 py-6 border-b border-[var(--color-border)] flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
            Configuration
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            Settings
          </h1>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: saved ? "#16a34a" : "var(--color-text)",
            color: "var(--color-bg)",
          }}
        >
          {saved ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save changes</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl flex flex-col gap-6 pb-20">
          
          {/* Integrations */}
          <Section title="Integrations" sub="Connect your external platforms to Pactix">
            <div className="flex items-center justify-between p-4 border border-[var(--color-border)] bg-[var(--color-panel-2)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#EA4335]/10 text-[#EA4335]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Gmail</div>
                  <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
                    {isGoogleConnected ? "Watching for new deals" : "Automate deal detection from your inbox"}
                  </div>
                </div>
              </div>
              {isGoogleConnected ? (
                <div className="flex items-center gap-2 text-green-600 font-mono text-[10px] uppercase font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </div>
              ) : (
                <button
                  onClick={connectGoogle}
                  className="px-4 py-2 bg-[var(--color-text)] color-[var(--color-bg)] text-xs font-bold hover:opacity-90 transition-opacity"
                  style={{ color: "var(--color-bg)" }}
                >
                  Connect
                </button>
              )}
            </div>
          </Section>

          {/* Profile */}
          <Section title="Profile" sub="Your identity — used to match voice fingerprint">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" value={name} onChange={setName} />
              <Field label="Email" value={email} type="email" onChange={setEmail} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
                Voice fingerprint
              </label>
              <textarea
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                rows={3}
                className="border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors resize-none"
              />
              <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                Describe your writing style. The Negotiator uses this to mirror your voice.
              </p>
            </div>
          </Section>

          {/* Deal parameters */}
          <Section title="Deal parameters" sub="Default negotiation boundaries for new deals">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Floor price ($)" value={floor} onChange={setFloor} mono />
              <Field label="Target price ($)" value={target} onChange={setTarget} mono />
              <Field label="Walk-away ($)" value={walkaway} onChange={setWalkaway} mono />
            </div>
            <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
              Judge uses these as bounds. Override per-deal in the arena.
            </p>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" sub="When the council wants your attention">
            {[
              ["New deal detected", "Email lands and Orchestrator classifies it", true],
              ["Verdict ready",     "Judge has set floor, target, and walk-away",  true],
              ["Reply drafted",     "Negotiator has written the response",          true],
              ["Payment received",  "Stripe webhook confirms the deposit",          false],
            ].map(([label, hint, defaultOn]) => (
              <div key={String(label)} className="flex items-center justify-between py-1">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="font-mono text-[10px] text-[var(--color-text-muted)] mt-0.5">{String(hint)}</div>
                </div>
                <Toggle defaultOn={Boolean(defaultOn)} />
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Toggle({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className="relative w-10 h-5 shrink-0 transition-colors duration-200"
      style={{ background: on ? "var(--color-text)" : "var(--color-border-strong)" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200"
        style={{ left: on ? "calc(100% - 1.1rem)" : "0.125rem" }}
      />
    </button>
  );
}
