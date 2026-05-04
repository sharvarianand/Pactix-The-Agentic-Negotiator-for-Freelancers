"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`w-8 h-8 border border-[var(--color-border-strong)] flex items-center justify-center
        hover:border-[var(--color-text-muted)] hover:bg-[var(--color-panel-2)]
        transition-all duration-150 ${className}`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
      )}
    </button>
  );
}
