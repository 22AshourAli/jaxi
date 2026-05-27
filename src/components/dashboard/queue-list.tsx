"use client";

import { Phone, Check, X, Clock, Scissors, MessageCircle, PhoneCall } from "lucide-react";
import { PhoneDisplay } from "@/components/shared/phone-display";
import { phoneLink, whatsappLink } from "@/lib/phone";

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  customer_phone: string | null;
  customer_name?: string | null;
  created_at: string;
  service_name?: string;
};

type Props = {
  entries: QueueEntry[];
  dict: any;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function QueueList({ entries, dict, onComplete, onNoShow }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">{dict.dashboard.noQueue}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 py-2">
        <p className="text-sm font-medium text-muted-foreground">
          {dict.dashboard.waiting} ({entries.length})
        </p>
      </div>
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="animate-slide-up flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-lg font-bold text-primary shadow-sm">
              #{entry.ticket_number}
            </span>
            <div>
              <p className="font-medium">{entry.customer_name || dict.dashboard.waiting}</p>
              {entry.service_name && (
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-primary/60 font-medium">
                  <Scissors className="h-3 w-3" />
                  {entry.service_name}
                </p>
              )}
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                {timeAgo(entry.created_at)}
              </p>
              {entry.customer_phone && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <PhoneDisplay phone={entry.customer_phone} className="text-xs text-muted-foreground" />
                  <a
                    href={phoneLink(entry.customer_phone)}
                    className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition"
                    title={entry.customer_phone}
                  >
                    <PhoneCall className="h-2.5 w-2.5" />
                  </a>
                  <a
                    href={whatsappLink(entry.customer_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 rounded-md bg-[#25D366]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#25D366] hover:bg-[#25D366]/20 transition"
                    title={entry.customer_phone}
                  >
                    <MessageCircle className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onComplete(entry.id)}
              className="flex items-center gap-1 rounded-xl border border-success/30 px-3 py-2 text-xs font-medium text-success transition hover:bg-success/10 active:scale-95"
              title={dict.dashboard.markComplete}
            >
              <Check className="h-3.5 w-3.5" />
              {dict.dashboard.markComplete}
            </button>
            <button
              onClick={() => onNoShow(entry.id)}
              className="flex items-center gap-1 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10 active:scale-95"
              title={dict.dashboard.markNoShow}
            >
              <X className="h-3.5 w-3.5" />
              {dict.dashboard.markNoShow}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
