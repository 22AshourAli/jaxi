import { Scissors } from "lucide-react";

type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
};

const sizes = {
  sm: { icon: "h-5 w-5", text: "text-base", container: "h-8 w-8", inner: "h-3.5 w-3.5", gap: "gap-2" },
  md: { icon: "h-6 w-6", text: "text-lg", container: "h-9 w-9", inner: "h-4 w-4", gap: "gap-2.5" },
  lg: { icon: "h-8 w-8", text: "text-2xl", container: "h-12 w-12", inner: "h-5 w-5", gap: "gap-3" },
  xl: { icon: "h-10 w-10", text: "text-3xl sm:text-4xl", container: "h-16 w-16 sm:h-20 sm:w-20", inner: "h-7 w-7 sm:h-9 sm:w-9", gap: "gap-3 sm:gap-4" },
};

export function Logo({ size = "md", showText = true, className = "" }: Props) {
  const s = sizes[size];

  return (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      <div className={`flex ${s.container} items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25`}>
        <Scissors className={`${s.inner} text-white`} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight`}>
          جاكسي
        </span>
      )}
    </div>
  );
}
