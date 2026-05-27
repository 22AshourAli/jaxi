"use client";

import { Check, X, Clock, Scissors, MessageCircle, PhoneCall, Sparkles } from "lucide-react";
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
      {entries.map((entry, i) => (
        <QueueCard
          key={entry.id}
          entry={entry}
          dict={dict}
          onComplete={onComplete}
          onNoShow={onNoShow}
          index={i}
        />
      ))}
    </div>
  );
}

function QueueCard({
  entry,
  dict,
  onComplete,
  onNoShow,
  index,
}: {
  entry: QueueEntry;
  dict: any;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  index: number;
}) {
  return (
    <div
      className="animate-slide-up rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md overflow-hidden"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center gap-2 p-2.5 sm:p-4">
        {/* Ticket number */}
        <span className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-sm sm:text-lg font-bold text-primary shadow-sm">
          #{entry.ticket_number}
        </span>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-base font-medium truncate leading-tight">{entry.customer_name || `#${entry.ticket_number}`}</p>
          {entry.service_name && (
            <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
              {entry.service_name.split(" + ").map((svc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded-sm bg-primary/10 px-1 py-0.5 text-[9px] sm:text-[10px] font-medium text-primary leading-tight"
                >
                  {svc}
                </span>
              ))}
            </div>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {timeAgo(entry.created_at)}
            </span>
            {entry.customer_phone && (
              <>
                <PhoneDisplay phone={entry.customer_phone} className="text-muted-foreground" />
                <a
                  href={phoneLink(entry.customer_phone)}
                  className="inline-flex items-center gap-0.5 rounded-sm bg-primary/10 px-1 py-0.5 text-primary hover:bg-primary/20 transition"
                >
                  <PhoneCall className="h-2.5 w-2.5" />
                </a>
                <a
                  href={whatsappLink(entry.customer_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 rounded-sm bg-[#25D366]/10 px-1 py-0.5 text-[#25D366] hover:bg-[#25D366]/20 transition"
                >
                  <MessageCircle className="h-2.5 w-2.5" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Actions - always visible, compact on mobile */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onComplete(entry.id)}
            className="flex items-center gap-0.5 rounded-lg sm:rounded-xl border border-success/30 px-1.5 py-1 sm:px-3 sm:py-2 text-[9px] sm:text-xs font-medium text-success transition hover:bg-success/10 active:scale-95"
            title={dict.dashboard.markComplete}
          >
            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden lg:inline">{dict.dashboard.markComplete}</span>
          </button>
          <button
            onClick={() => onNoShow(entry.id)}
            className="flex items-center gap-0.5 rounded-lg sm:rounded-xl border border-destructive/30 px-1.5 py-1 sm:px-3 sm:py-2 text-[9px] sm:text-xs font-medium text-destructive transition hover:bg-destructive/10 active:scale-95"
            title={dict.dashboard.markNoShow}
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden lg:inline">{dict.dashboard.markNoShow}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
