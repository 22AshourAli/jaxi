"use client";

import { useRealtimeQueue } from "@/hooks/use-realtime-queue";

type Shop = { id: string; name: string };
type Props = { shop: Shop; locale: string; dict: any };

export function LiveQueueDisplay({ shop, locale, dict }: Props) {
  const entries = useRealtimeQueue(shop.id);
  const waiting = entries.filter((e) => e.status === "waiting");
  const serving = entries.find((e) => e.status === "serving");

  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-gradient-to-b from-primary/5 to-background">
      <header className="border-b border-border bg-background/80 p-4 text-center backdrop-blur-sm">
        <h1 className="text-lg font-bold">{shop.name}</h1>
        <p className="text-sm text-muted-foreground">{dict.queue.liveDisplay}</p>
      </header>

      <main className="flex flex-1 flex-col items-center gap-8 p-6">
        {serving && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{dict.customer.currentlyServing}</p>
            <p className="mt-2 text-8xl font-bold text-primary animate-pulse">
              #{serving.ticket_number}
            </p>
          </div>
        )}

        <div className="w-full max-w-md space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {locale === "ar" ? "الطابور" : "Queue"} ({waiting.length})
          </h2>
          <div className="space-y-2">
            {waiting.slice(0, 10).map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-lg font-semibold">#{entry.ticket_number}</span>
                </div>
                <span className="text-sm text-muted-foreground">{dict.dashboard.waiting}</span>
              </div>
            ))}
            {waiting.length === 0 && !serving && (
              <p className="py-8 text-center text-muted-foreground">{dict.dashboard.noQueue}</p>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {shop.name} - {locale === "ar" ? "شاشة الطابور الحية" : "Live Queue Display"}
        </div>
      </main>
    </div>
  );
}
