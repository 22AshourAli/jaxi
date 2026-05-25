"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return <div className="h-8 w-8" />;

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className={`h-4 w-4 transition-all duration-200 ${isDark ? "hidden" : ""}`} />
      <Moon className={`h-4 w-4 transition-all duration-200 ${isDark ? "" : "hidden"}`} />
    </button>
  );
}
