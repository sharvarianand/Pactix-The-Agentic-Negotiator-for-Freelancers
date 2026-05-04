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
    <svg
      width={d}
      height={d}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pactix"
    >
      {/* outer border */}
      <rect
        x={half} y={half}
        width={32 - sw} height={32 - sw}
        stroke={color}
        strokeWidth={sw}
        fill="none"
      />
      {/* signal red stamp — top-right corner */}
      <rect x="19" y="0" width="13" height="13" fill="#ff1a00" />

      {/* P letterform — stem + bowl */}
      <line x1="8" y1="8" x2="8" y2="25"
        stroke={color} strokeWidth={sw + 0.5} strokeLinecap="square" />
      <path
        d="M8 8 L15 8 Q21 8 21 14 Q21 20 15 20 L8 20"
        stroke={color}
        strokeWidth={sw + 0.2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
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
