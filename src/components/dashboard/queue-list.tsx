"use client";

import { Phone, Check, X, Clock } from "lucide-react";
import { PhoneDisplay } from "@/components/shared/phone-display";

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  customer_phone: string | null;
  customer_name?: string | null;
  created_at: string;
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
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(entry.created_at)}
              </p>
              {entry.customer_phone && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <PhoneDisplay phone={entry.customer_phone} />
                </p>
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
