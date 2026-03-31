import { useId, type SVGProps } from "react";

/**
 * Adscora mark: upward motion + arc (growth / scale) — violet / blue on dark.
 */
export function AdscoraMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, "");
  const gMain = `adscora-main-${id}`;
  const gGlow = `adscora-glow-${id}`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient id={gMain} x1="8" y1="32" x2="32" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="0.45" stopColor="#818cf8" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={gGlow} x1="4" y1="36" x2="28" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* soft orbit */}
      <path
        d="M5 30c6-10 16-14 28-11"
        stroke={`url(#${gGlow})`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* upward arrow / chevron */}
      <path
        d="M20 8 L28 18 L24 18 L24 28 L16 28 L16 18 L12 18 Z"
        fill={`url(#${gMain})`}
        fillRule="evenodd"
        className="drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]"
      />
      <path
        d="M20 11l5 6h-3v9h-4v-9h-3l5-6z"
        fill="#fff"
        fillOpacity="0.92"
      />
    </svg>
  );
}

type LockupProps = {
  markClassName?: string;
  wordmarkClassName?: string;
  className?: string;
};

export function AdscoraLockup({ markClassName, wordmarkClassName, className }: LockupProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <AdscoraMark
        className={`h-9 w-9 shrink-0 sm:h-10 sm:w-10 ${markClassName ?? ""}`}
      />
      <span
        className={`font-sans text-xl font-semibold tracking-tight text-foreground sm:text-2xl ${wordmarkClassName ?? ""}`}
      >
        Adscora
      </span>
    </span>
  );
}
