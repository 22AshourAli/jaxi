"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Users, Clock, ArrowRight, Bell } from "lucide-react";

const LS_KEY = "dorak_active_ticket";

type TicketData = {
  entryId: string;
  shopId: string;
  ticketNumber: number;
  shopName: string;
  phone: string;
  name: string;
};

export function TicketTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [peopleAhead, setPeopleAhead] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [currentlyServing, setCurrentlyServing] = useState<number | null>(null);

  const isRtl = locale === "ar";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const data = JSON.parse(saved) as TicketData;
        if (data.entryId && data.ticketNumber) {
          setTicket(data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!ticket) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("queue_entries")
        .select("id, ticket_number, status")
        .eq("shop_id", ticket.shopId)
        .neq("status", "cancelled")
        .order("ticket_number", { ascending: true });

      if (!data) return;

      const entries = data as any[];
      const me = entries.find((e) => e.ticket_number === ticket.ticketNumber);
      if (!me) return;

      setStatus(me.status);

      const serving = entries.find((e) => e.status === "serving");
      setCurrentlyServing(serving?.ticket_number ?? null);

      const ahead = entries.filter(
        (e) => e.ticket_number < ticket.ticketNumber && e.status === "waiting"
      ).length;
      setPeopleAhead(ahead);
    };

    fetchStatus();

    const channel = supabase
      .channel(`ticket-tracker-${ticket.entryId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${ticket.shopId}`,
        },
        () => fetchStatus()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticket, supabase]);

  if (!ticket || !status || status === "completed" || status === "cancelled" || status === "no_show") {
    return null;
  }

  if (pathname.startsWith(`/${locale}/join`) || pathname.startsWith(`/${locale}/dashboard`)) {
    return null;
  }

  const isCalled = status === "called" || status === "serving";

  return (
    <Link
      href={`/${locale}/join`}
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-slide-up"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-xl backdrop-blur-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl ${
          isCalled
            ? "border-success/30 bg-success/10 text-success"
            : "border-border bg-background/95 text-foreground"
        }`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {isCalled ? (
          <Bell className="h-5 w-5 shrink-0 animate-pulse" />
        ) : (
          <Ticket className="h-5 w-5 shrink-0 text-primary" />
        )}
        <div className="text-sm">
          <p className="font-semibold leading-tight">
            {isCalled
              ? isRtl
                ? "🔔 حان دورك!"
                : "🔔 It's Your Turn!"
              : isRtl
              ? `دورك #${ticket.ticketNumber}`
              : `Your turn #${ticket.ticketNumber}`}
          </p>
          {!isCalled && peopleAhead !== null && (
            <p className="text-xs text-muted-foreground">
              {isRtl
                ? `${peopleAhead} أشخاص قبلك`
                : `${peopleAhead} people ahead`}
            </p>
          )}
        </div>
        <ArrowRight className={`h-4 w-4 shrink-0 ${isRtl ? "rotate-180" : ""}`} />
      </div>
    </Link>
  );
}
