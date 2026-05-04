"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Pencil, RotateCcw, Loader2, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useDealStore } from "@/store/deal-store";

const TONES = ["friendly", "professional", "firm", "assertive", "hardball"] as const;
type Tone = (typeof TONES)[number];

export function ApproveReplyModal() {
  const open = useDealStore((s) => s.approveReplyOpen);
  const initialDraft = useDealStore((s) => s.approveReplyDraft);
  const selectedDealId = useDealStore((s) => s.selectedDealId);
  const setOpen = useDealStore((s) => s.setApproveReplyOpen);
  const approveReply = useDealStore((s) => s.approveReply);

  const [text, setText] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [regenerating, setRegenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setText((prev) => prev + " " + currentTranscript);
          }
        };
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setListening(false);
        };
        recognitionRef.current.onend = () => {
          setListening(false);
        };
      }
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setListening(true);
        toast("Listening...");
      } else {
        toast.error("Speech recognition not supported in this browser.");
      }
    }
  };

  useEffect(() => {
    if (open) {
      setText(initialDraft);
      setTone("professional");
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open, initialDraft]);

  async function handleToneChange(newTone: Tone) {
    if (!selectedDealId || newTone === tone) return;
    setTone(newTone);
    setRegenerating(true);
    try {
      const res = await fetch(`/api/deals/${selectedDealId}/regen-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: newTone, currentDraft: initialDraft }),
      });
      const data = (await res.json()) as { replyBody?: string; error?: string };
      if (data.replyBody) setText(data.replyBody);
      else toast.error(data.error || "Regen failed");
    } catch {
      toast.error("Regen failed");
    } finally {
      setRegenerating(false);
    }
  }

  if (!open || !selectedDealId) return null;

  const isEdited = text.trim() !== initialDraft.trim();
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-xl bg-[var(--color-panel)] flex flex-col shadow-2xl"
        style={{ border: "1px solid var(--color-border-strong)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-[var(--color-border)] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Pencil className="w-3.5 h-3.5 text-[var(--color-signal)]" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                Review &amp; edit reply
              </span>
              {isEdited && (
                <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 bg-[var(--color-signal-soft)] text-[var(--color-signal)]">
                  Edited
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] tracking-wider text-[var(--color-text-muted)]">
              Click anywhere in the draft to edit · {words} words
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mt-0.5 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Tone slider */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]">
              Tone
            </div>
            {regenerating && (
              <div className="flex items-center gap-1 font-mono text-[9px] text-[var(--color-text-muted)]">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Regenerating…
              </div>
            )}
          </div>
          <div className="flex border border-[var(--color-border-strong)]">
            {TONES.map((t) => (
              <button
                key={t}
                disabled={regenerating}
                onClick={() => handleToneChange(t)}
                className="flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-60"
                style={{
                  background: tone === t ? "var(--color-text)" : "transparent",
                  color: tone === t ? "var(--color-bg)" : "var(--color-text-muted)",
                  borderRight: t !== TONES[TONES.length - 1] ? "1px solid var(--color-border-strong)" : "none",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Editable draft */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Edit zone label */}
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)]">
              Draft — click to edit
            </div>
            {isEdited && (
              <button
                onClick={() => setText(initialDraft)}
                className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            )}
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors ml-3 ${
                listening ? "text-[var(--color-signal)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {listening ? "Stop Dictating" : "Dictate"}
            </button>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="w-full bg-[var(--color-bg)] border text-sm leading-relaxed resize-none focus:outline-none transition-colors px-4 py-4"
              style={{
                borderColor: isEdited ? "var(--color-text)" : "var(--color-border)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
              }}
            />
            {/* Pencil icon overlay hint */}
            <div className="absolute top-3 right-3 pointer-events-none">
              <Pencil className="w-3 h-3 text-[var(--color-text-dim)]" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {isEdited ? "Your edits will be sent" : "Pactix draft · ready to send"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(false)}
              className="text-sm px-4 py-2 border border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)] text-[var(--color-text-muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={sending}
              onClick={async () => {
                setSending(true);
                try {
                  await approveReply(selectedDealId, text);
                  toast.success("Reply sent via Pactix");
                } finally {
                  setSending(false);
                }
              }}
              className="text-sm px-5 py-2 font-semibold flex items-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "var(--color-signal)", color: "#fff" }}
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Approve & Send"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
