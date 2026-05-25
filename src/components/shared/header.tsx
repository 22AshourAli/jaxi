"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";

type Props = {
  locale: string;
  dict: any;
  hideLocale?: boolean;
};

export function Header({ locale, dict, hideLocale }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const alternatePath = pathname.replace(`/${locale}`, `/${alternateLocale}`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-lg font-bold tracking-tight transition hover:opacity-80"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-lg shadow-primary/25">
            D
          </span>
          {dict.site.title}
        </Link>

        <nav className="hidden items-center gap-2 sm:flex">
          {!hideLocale && (
            <Link
              href={alternatePath}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {dict.locale.switchTo}
            </Link>
          )}
          <ThemeToggle />
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center rounded-xl p-2 transition hover:bg-muted sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="animate-slide-up border-t border-border bg-background px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            {!hideLocale && (
              <Link
                href={alternatePath}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <Globe className="h-4 w-4" />
                {dict.locale.switchTo}
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
