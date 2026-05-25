"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";

type Props = {
  locale: string;
  dict: any;
};

export function Header({ locale, dict }: Props) {
  const pathname = usePathname();
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const alternatePath = pathname.replace(`/${locale}`, `/${alternateLocale}`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-lg font-bold">
          {dict.site.title}
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href={alternatePath}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            {dict.locale.switchTo}
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
