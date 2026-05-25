"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, UserCheck, Clock, Loader2 } from "lucide-react";

type Props = {
  shopId: string;
  avgServiceTime: number;
  locale: string;
  dict: any;
};

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
};

export function LandingQueueStatus({ shopId, avgServiceTime, locale, dict }: Props) {
  const supabase = createClient();
  const [waiting, setWaiting] = useState<number | null>(null);
  const [serving, setServing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    const fetchStats = async () => {
      const { data } = await supabase
        .from("queue_entries")
        .select("ticket_number, status")
        .eq("shop_id", shopId)
        .neq("status", "cancelled")
        .neq("status", "completed")
        .neq("status", "no_show")
        .order("ticket_number", { ascending: true });

      if (data) {
        const entries = data as QueueEntry[];
        setWaiting(entries.filter((e) => e.status === "waiting").length);
        const s = entries.find((e) => e.status === "serving");
        setServing(s?.ticket_number ?? null);
      }
      setLoading(false);
    };

    fetchStats();

    const channel = supabase
      .channel("landing-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: `shop_id=eq.${shopId}` },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const estWait = waiting !== null ? waiting * avgServiceTime : null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className="group animate-slide-up rounded-xl border border-border bg-card/80 p-4 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
        <Users className="mx-auto h-5 w-5 text-primary/60" />
        <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums">{waiting ?? "–"}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{dict.dashboard.waiting}</p>
      </div>
      <div
        className="group animate-slide-up rounded-xl border border-border bg-card/80 p-4 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
        style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
      >
        <UserCheck className="mx-auto h-5 w-5 text-success/60" />
        <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums">
          {serving ? `#${serving}` : "–"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{dict.customer.currentlyServing}</p>
      </div>
      <div
        className="group animate-slide-up rounded-xl border border-border bg-card/80 p-4 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
        style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
      >
        <Clock className="mx-auto h-5 w-5 text-accent/60" />
        <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums">{estWait !== null ? estWait : "–"}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{dict.customer.estimatedTime}</p>
      </div>
    </div>
  );
}
