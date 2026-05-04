import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Pactix",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {children}
    </div>
  );
}
