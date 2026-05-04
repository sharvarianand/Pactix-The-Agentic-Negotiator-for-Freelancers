import Link from "next/link";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const DIMS: Record<Size, number> = { xs: 20, sm: 26, md: 32, lg: 42, xl: 56 };
const STROKE: Record<Size, number> = { xs: 1.2, sm: 1.4, md: 1.5, lg: 2, xl: 2.5 };
const TEXT_SIZE: Record<Size, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

/* ── The Pactix mark ─────────────────────────────────────────
   A bordered square. The P's vertical stem doubles as the left
   border. A solid signal-red block stamps the top-right corner.
   Simple. Unmistakable.
   ────────────────────────────────────────────────────────── */
export function PactixMark({
  size = "md",
  color = "currentColor",
}: {
  size?: Size;
  color?: string;
}) {
  const d = DIMS[size];
  const sw = STROKE[size];
  const half = sw / 2;

  return (
    <img
      src="/logo.png"
      alt="Pactix Mark"
      width={d}
      height={d}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

/* ── Full lockup: mark + wordmark ────────────────────────────── */
export function PactixLogo({
  size = "md",
  href,
  hideWordmark = false,
  color = "currentColor",
}: {
  size?: Size;
  href?: string;
  hideWordmark?: boolean;
  color?: string;
}) {
  const gap = size === "xs" || size === "sm" ? "gap-2" : "gap-2.5";

  const inner = (
    <span className={`flex items-center ${gap} shrink-0`} style={{ color }}>
      <PactixMark size={size} color={color} />
      {!hideWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.025em",
            lineHeight: 1,
            fontWeight: "bold",
            color,
          }}
          className={TEXT_SIZE[size]}
        >
          Pactix
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {inner}
      </Link>
    );
  }
  return inner;
}
