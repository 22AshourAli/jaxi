"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Settings, LogOut } from "lucide-react";

type Props = {
  shopId: string;
  locale: string;
  dict: any;
};

export function DashboardHeader({ shopId, locale, dict }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-lg font-bold">
          {dict.site.title}
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href={`/${locale}/dashboard/${shopId}`}
            className="rounded-lg px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            {dict.dashboard.queueManagement}
          </Link>
          <Link
            href={`/${locale}/dashboard/${shopId}/analytics`}
            className="rounded-lg px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            <BarChart3 className="inline-block h-4 w-4" />
            {dict.dashboard.analytics}
          </Link>
          <Link
            href={`/${locale}/dashboard/${shopId}/settings`}
            className="rounded-lg px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            <Settings className="inline-block h-4 w-4" />
            {dict.dashboard.settings}
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="inline-block h-4 w-4" />
            {dict.dashboard.logout}
          </button>
        </nav>
      </div>
    </header>
  );
}
