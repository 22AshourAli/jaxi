"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getNextTicket, estimateWaitTime } from "@/lib/queue-engine";
import { useRealtimeQueue } from "@/hooks/use-realtime-queue";
import { useNotification } from "@/hooks/use-notification";
import { Bell, BellOff, Clock, Users } from "lucide-react";
import { sendQueueConfirmation } from "@/actions/notifications";

type Shop = {
  id: string;
  name: string;
  avg_service_time: number;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
};

type Props = {
  shop: Shop;
  services: Service[];
  locale: string;
  dict: any;
};

export function QueueEntryView({ shop, services, locale, dict }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const entries = useRealtimeQueue(shop.id);
  const { permission, requestPermission } = useNotification();

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

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

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
    if (permission !== "granted") {
      requestPermission();
    }
    setNotificationsOn(!notificationsOn);
  }

  const waitingCount = entryId
    ? entries.filter(
        (e) => e.status === "waiting" && e.ticket_number < ticketNumber!
      ).length
    : 0;
  const waitTime = entryId ? estimateWaitTime(entries, entryId, shop.avg_service_time, serviceDurations) : 0;
  const serving = entries.find((e) => e.status === "serving");

  if (ticketNumber && entryId) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6 py-8">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-sm text-muted-foreground">{dict.customer.yourNumber}</p>
          <p className="mt-2 text-6xl font-bold text-primary">#{ticketNumber}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{waitingCount}</p>
            <p className="text-xs text-muted-foreground">{dict.customer.peopleAhead}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Clock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {waitTime} <span className="text-sm font-normal">{dict.customer.minutes}</span>
            </p>
            <p className="text-xs text-muted-foreground">{dict.customer.estimatedTime}</p>
          </div>
        </div>

        {serving && (
          <p className="text-sm text-muted-foreground">
            {dict.customer.currentlyServing} #{serving.ticket_number}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={toggleNotifications}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              notificationsOn
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {notificationsOn ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            {dict.customer.notifyMe}
          </button>
          <button
            onClick={handleLeaveQueue}
            className="rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive transition hover:bg-destructive/10"
          >
            {dict.customer.leaveQueue}
          </button>
        </div>

        <button
          onClick={() => router.push(`/${locale}`)}
          className="text-sm text-muted-foreground underline transition hover:text-foreground"
        >
          {dict.customer.scanAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 py-8">
      <div className="w-full space-y-2">
        <h1 className="text-center text-xl font-bold">{shop.name}</h1>
        {services.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{dict.customer.selectService}</p>
            <div className="grid gap-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selectedService === service.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="mr-2 text-muted-foreground">
                    ~{service.duration_minutes} {dict.customer.minutes}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <input
          type="tel"
          placeholder={dict.dashboard.phoneNumber + " (اختياري)"}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          dir="ltr"
        />
      </div>

      <button
        onClick={handleJoinQueue}
        disabled={loading}
        className="w-full rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? dict.common.loading : dict.customer.getTicket}
      </button>

      <div className="w-full space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{dict.customer.queueStatus}</p>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{dict.common.loading}...</p>
        </div>
      </div>
    </div>
  );
}
