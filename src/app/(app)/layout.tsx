"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutGrid,
  Bot,
  BarChart3,
  Settings,
  Inbox,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { PactixLogo } from "@/components/shell/Logo";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { OnboardingTour } from "@/components/shell/OnboardingTour";
import { ApproveReplyModal } from "@/components/ApproveReplyModal";
import { ApproveClosingModal } from "@/components/ApproveClosingModal";

const NAV = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/agents",    icon: Bot,         label: "Agents"    },
  { href: "/analytics", icon: BarChart3,   label: "Analytics" },
  { href: "/deals",     icon: Inbox,       label: "Deals"     },
  { href: "/settings",  icon: Settings,    label: "Settings"  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          name: user.user_metadata.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
        });
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-screen flex bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
        {/* Logo */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[var(--color-border)]">
          <PactixLogo href="/" size="lg" />
          <CommandPalette />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = path === href || (href !== "/dashboard" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 group relative"
                style={{
                  color: active ? "var(--color-text)" : "var(--color-text-muted)",
                  background: active ? "var(--color-panel-2)" : "transparent",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {/* active bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[var(--color-signal)]"
                  />
                )}
                <Icon
                  className="w-4 h-4 shrink-0 transition-colors"
                  style={{ color: active ? "var(--color-signal)" : "var(--color-text-muted)" }}
                />
                {label}
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto text-[var(--color-text-dim)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user row */}
        <div className="border-t border-[var(--color-border)] p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 bg-[var(--color-text)] flex items-center justify-center text-[var(--color-bg)] font-mono text-[10px] font-bold shrink-0">
              {userProfile?.name?.slice(0, 2).toUpperCase() || "..."}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{userProfile?.name || "Loading..."}</div>
              <div className="font-mono text-[9px] text-[var(--color-text-muted)] truncate">{userProfile?.email || "..."}</div>
            </div>
            <button onClick={handleLogout} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Modals — mounted at layout level so they fire from any page */}
      <ApproveReplyModal />
      <ApproveClosingModal />
      <OnboardingTour />
    </div>
  );
}
