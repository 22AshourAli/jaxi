type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
};

const sizes = {
  sm: { box: 28, icon: 14, text: "text-sm", gap: "gap-1.5" },
  md: { box: 36, icon: 18, text: "text-lg", gap: "gap-2" },
  lg: { box: 48, icon: 24, text: "text-2xl", gap: "gap-2.5" },
  xl: { box: 72, icon: 36, text: "text-3xl sm:text-4xl", gap: "gap-3 sm:gap-4" },
};

function LogoIcon({ box, iconSize }: { box: number; iconSize: number }) {
  const s = iconSize;
  const sc = s / 108; // scale factor relative to original SVG (108 = 192 - margins)
  return (
    <svg width={box} height={box} viewBox="0 0 192 192" className="shrink-0">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="192" height="192" rx={36} fill="url(#logo-bg)" />
      <g transform={`translate(42, ${20 * sc > 16 ? 20 : 16})`}>
        <path
          d="M0 120 Q20 100 40 80 L80 40 Q85 35 82 30 Q78 25 73 28 L33 68 Q13 88 0 120Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M108 120 Q88 100 68 80 L28 40 Q23 35 26 30 Q30 25 35 28 L75 68 Q95 88 108 120Z"
          fill="white"
          opacity="0.95"
        />
        <circle cx="54" cy="74" r="10" fill="white" />
        <circle cx="54" cy="74" r="5" fill="url(#logo-bg)" />
      </g>
    </svg>
  );
}

export function Logo({ size = "md", showText = true, className = "" }: Props) {
  const s = sizes[size];

  return (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      <LogoIcon box={s.box} iconSize={s.icon} />
      {showText && (
        <span className={`${s.text} font-bold tracking-tight`}>
          جاكسي
        </span>
      )}
    </div>
  );
}
