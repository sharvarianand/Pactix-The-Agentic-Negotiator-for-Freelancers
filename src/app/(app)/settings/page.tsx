"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";

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
  const [name, setName] = useState("Maya Chen");
  const [email, setEmail] = useState("maya@studio.com");
  const [voice, setVoice] = useState("Concise, confident, no fluff. Direct asks. Sign off with — Maya");
  const [floor, setFloor] = useState("500");
  const [target, setTarget] = useState("1200");
  const [walkaway, setWalkaway] = useState("350");
  const [geminiKey, setGeminiKey] = useState("AIzaSy••••••••••••••••••••••••");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
            <><RefreshCw className="w-4 h-4" /> Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save changes</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl flex flex-col gap-6">
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

          {/* API keys */}
          <Section title="API configuration" sub="Keys used by the agent council">
            <Field label="Gemini API key" value={geminiKey} onChange={setGeminiKey} type="password" mono />
            <div className="p-4 bg-[var(--color-panel-2)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-green-500 signal-pulse" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-green-600">
                  Gemini 2.5 Flash · Connected
                </span>
              </div>
              <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                Model: gemini-2.5-flash · Provider: Google AI Studio
              </p>
            </div>
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
