"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getNextTicket, estimateWaitTime } from "@/lib/queue-engine";
import { useRealtimeQueue } from "@/hooks/use-realtime-queue";
import { useNotification } from "@/hooks/use-notification";
import { Bell, BellOff, Clock, Users, Loader2, ArrowLeft, CheckCircle, X } from "lucide-react";
import { sendQueueConfirmation } from "@/actions/notifications";

type Shop = { id: string; name: string; avg_service_time: number };
type Service = { id: string; name: string; duration_minutes: number };

type Props = { shop: Shop; services: Service[]; locale: string; dict: any };

export function QueueEntryView({ shop, services, locale, dict }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const entries = useRealtimeQueue(shop.id);
  const { permission, requestPermission } = useNotification();
  const isRtl = locale === "ar";

  const serviceDurations: Record<string, number> = {};
  services.forEach((s) => { serviceDurations[s.id] = s.duration_minutes; });

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);

  async function handleJoinQueue() {
    setLoading(true);
    const nextNumber = getNextTicket(entries);

    const { data: entry, error } = await (supabase.from("queue_entries") as any)
      .insert({
        shop_id: shop.id,
        service_id: selectedService,
        ticket_number: nextNumber,
        customer_phone: phone || null,
        status: "waiting",
      })
      .select()
      .single();

    if (error) { console.error(error); setLoading(false); return; }

    setEntryId(entry.id);
    setTicketNumber(entry.ticket_number);
    setLoading(false);

    if (phone) {
      const ahead = entries.filter((e) => e.status === "waiting" && e.ticket_number < entry.ticket_number).length;
      const wait = estimateWaitTime([...entries, entry], entry.id, shop.avg_service_time, serviceDurations);
      sendQueueConfirmation(phone, shop.name, entry.ticket_number, ahead, wait, locale as "ar" | "en");
    }
  }

  async function handleLeaveQueue() {
    if (!entryId) return;
    await (supabase.from("queue_entries") as any).update({ status: "cancelled" }).eq("id", entryId);
    setEntryId(null);
    setTicketNumber(null);
  }

  function toggleNotifications() {
    if (permission !== "granted") requestPermission();
    setNotificationsOn(!notificationsOn);
  }

  const waitingCount = entryId
    ? entries.filter((e) => e.status === "waiting" && e.ticket_number < ticketNumber!).length
    : 0;
  const waitTime = entryId ? estimateWaitTime(entries, entryId, shop.avg_service_time, serviceDurations) : 0;
  const serving = entries.find((e) => e.status === "serving");

  if (ticketNumber && entryId) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className="flex w-full max-w-md flex-col items-center gap-6 py-8">
        <div className="w-full">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
            {dict.customer.scanAgain}
          </button>
        </div>

        <div className="animate-scale-in w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center shadow-lg">
          <p className="text-sm font-medium text-muted-foreground">{dict.customer.yourNumber}</p>
          <p className="mt-2 text-6xl font-bold tracking-tight text-primary">#{ticketNumber}</p>
          <p className="mt-2 text-sm text-muted-foreground">{shop.name}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <div className="animate-slide-up rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
            <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{waitingCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">{dict.customer.peopleAhead}</p>
          </div>
          <div
            className="animate-slide-up rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
            style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
          >
            <Clock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {waitTime} <span className="text-sm font-normal text-muted-foreground">{dict.customer.minutes}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{dict.customer.estimatedTime}</p>
          </div>
        </div>

        {serving && (
          <div className="animate-fade-in rounded-2xl border border-success/20 bg-success/5 p-4 text-center">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">
              {dict.customer.currentlyServing} <strong className="text-foreground">#{serving.ticket_number}</strong>
            </p>
          </div>
        )}

        <div className="flex w-full gap-3">
          <button
            onClick={toggleNotifications}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition active:scale-[0.98] ${
              notificationsOn
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
            aria-label={dict.customer.notifyMe}
          >
            {notificationsOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {dict.customer.notifyMe}
          </button>
          <button
            onClick={handleLeaveQueue}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-destructive/30 px-4 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/10 active:scale-[0.98]"
            aria-label={dict.customer.leaveQueue}
          >
            <X className="h-4 w-4" />
            {dict.customer.leaveQueue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex w-full max-w-md flex-col items-center gap-6 py-8">
      <div className="w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{shop.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.customer.scanTitle}</p>
        </div>

        {services.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{dict.customer.selectService}</p>
            <div className="grid gap-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all active:scale-[0.98] ${
                    selectedService === service.id
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-muted-foreground">
                    ~{service.duration_minutes} {dict.customer.minutes}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <input
            type="tel"
            placeholder={`${dict.dashboard.phoneNumber}${locale === "ar" ? " (اختياري)" : " (optional)"}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            dir="ltr"
            aria-label={dict.dashboard.phoneNumber}
            autoComplete="tel"
          />
        </div>
      </div>

      <button
        onClick={handleJoinQueue}
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {dict.common.loading}
          </span>
        ) : (
          dict.customer.getTicket
        )}
      </button>

      <div className="w-full space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{dict.customer.queueStatus}</p>
        <div className="animate-pulse-soft rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          {serving ? (
            <div>
              <p className="text-sm text-muted-foreground">{dict.customer.currentlyServing}</p>
              <p className="mt-1 text-2xl font-bold text-primary">#{serving.ticket_number}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{dict.common.loading}...</p>
          )}
        </div>
      </div>
    </div>
  );
}
