"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QueueList } from "@/components/dashboard/queue-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/hooks/use-dictionary";
import { sendTurnNotification } from "@/actions/notifications";

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  customer_phone: string | null;
  created_at: string;
  called_at: string | null;
  service_id: string | null;
};

export default function QueueManagementPage() {
  const { locale, shopId } = useParams<{ locale: string; shopId: string }>();
  const dict = useDictionary(locale);
  const supabase = createClient();
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [serving, setServing] = useState<QueueEntry | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const fetchData = async () => {
      const shopRes = await (supabase.from("shops") as any).select("name").eq("id", shopId).single();
      if (shopRes.data) setShopName(shopRes.data.name);

      const { data } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", shopId)
        .gte("created_at", todayStart.toISOString())
        .neq("status", "cancelled")
        .order("ticket_number", { ascending: true });

      if (data) {
        const entries = data as QueueEntry[];
        setEntries(entries);
        const currentServing = entries.find((e) => e.status === "serving");
        setServing(currentServing ?? null);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("queue-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${shopId}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, supabase]);

  const waiting = entries.filter((e) => e.status === "waiting");

  async function handleCallNext() {
    const next = waiting[0];
    if (!next) return;

    await (supabase.from("queue_entries") as any)
      .update({ status: "serving", called_at: new Date().toISOString() })
      .eq("id", next.id);

    if (serving) {
      await (supabase.from("queue_entries") as any)
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", serving.id);
    }

    if (next.customer_phone) {
      sendTurnNotification(next.customer_phone, shopName, next.ticket_number, locale as "ar" | "en");
    }
  }

  async function handleComplete(id: string) {
    await (supabase.from("queue_entries") as any)
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function handleNoShow(id: string) {
    await (supabase.from("queue_entries") as any)
      .update({ status: "no_show" })
      .eq("id", id);
  }

  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <DashboardHeader shopId={shopId} locale={locale} dict={dict} />
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{dict.dashboard.queueManagement}</h1>
            <button
              onClick={handleCallNext}
              disabled={loading || waiting.length === 0}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {dict.dashboard.callNext} ({waiting.length})
            </button>
          </div>

          {serving && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">{dict.queue.currentlyServing}</p>
              <p className="text-3xl font-bold text-primary">#{serving.ticket_number}</p>
            </div>
          )}

          {loading ? (
            <p className="text-center text-muted-foreground">{dict.common.loading}</p>
          ) : (
            <QueueList
              entries={waiting}
              dict={dict}
              onComplete={handleComplete}
              onNoShow={handleNoShow}
            />
          )}
        </div>
      </main>
    </div>
  );
}
