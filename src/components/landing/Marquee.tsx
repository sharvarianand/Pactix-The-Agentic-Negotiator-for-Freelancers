"use client";

const ITEMS = [
  "ORCHESTRATOR",
  "SCOUT",
  "PROSECUTOR",
  "DEFENSE",
  "JUDGE",
  "NEGOTIATOR",
  "CONTRACT",
  "PAYMENT",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <section
      className="border-t border-b border-[var(--color-border)] py-5 overflow-hidden group"
      style={{ cursor: "default" }}
    >
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          align-items: center;
          gap: 0;
          white-space: nowrap;
          animation: marquee-scroll 28s linear infinite;
        }
        .marquee-track:hover,
        .group:hover .marquee-track {
          animation-play-state: paused;
        }
        .marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 2rem;
          padding: 0 2rem;
          transition: color 180ms ease;
          color: #737373;
        }
        .marquee-item:hover {
          color: #ff1a00;
        }
        .marquee-item:hover .marquee-dot {
          background: #ff1a00;
          transform: scale(1.4);
        }
        .marquee-dot {
          width: 6px;
          height: 6px;
          background: #ff1a00;
          flex-shrink: 0;
          transition: transform 180ms ease, background 180ms ease;
        }
      `}</style>
      <div className="marquee-track">
        {row.map((item, i) => (
          <span key={i} className="marquee-item">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem,3vw,2.25rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {item}
            </span>
            <span className="marquee-dot" />
          </span>
        ))}
      </div>
    </section>
  );
}
