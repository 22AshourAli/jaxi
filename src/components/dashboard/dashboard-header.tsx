"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Settings, LogOut, ChevronLeft, Globe } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";

type Props = {
  locale: string;
  dict: any;
};

const navItems = [
  { key: "queueManagement", icon: LayoutDashboard, href: "" },
  { key: "analytics", icon: BarChart3, href: "/analytics" },
  { key: "settings", icon: Settings, href: "/settings" },
];

export function DashboardHeader({ locale, dict }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRtl = locale === "ar";

  async function handleLogout() {
    const { adminLogout } = await import("@/actions/admin-auth");
    await adminLogout();
    router.push(`/${locale}`);
  }

  const basePath = `/${locale}/dashboard`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center rounded-xl p-2 transition hover:bg-muted"
            aria-label="Toggle sidebar"
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <Link href={`/${locale}`}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-xl p-2 text-destructive transition hover:bg-destructive/10"
            aria-label={dict.dashboard.logout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-300 ${
          isRtl ? "right-0" : "left-0"
        } ${
          sidebarOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
        } lg:translate-x-0`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href={`/${locale}`}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center rounded-xl p-1.5 transition hover:bg-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <ChevronLeft className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const href = item.href ? `${basePath}${item.href}` : basePath;
            const active = item.href
              ? pathname.endsWith(item.href)
              : !pathname.includes("/analytics") && !pathname.includes("/settings");
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {dict.dashboard[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center justify-between px-3 py-2">
            <Link
              href={`/${locale === "ar" ? "en" : "ar"}${pathname.replace(`/${locale}`, "")}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <Globe className="h-4 w-4" />
              {locale === "ar" ? "English" : "العربية"}
            </Link>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            {dict.dashboard.logout}
          </button>
        </div>
      </aside>
    </>
  );
}
