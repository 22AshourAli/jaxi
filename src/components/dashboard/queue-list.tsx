"use client";

import { useState, useRef } from "react";
import { Phone, Check, X, Clock, Scissors, MessageCircle, PhoneCall, MoreHorizontal, Sparkles } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  return (
    <div
      className="animate-slide-up rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Ticket number */}
        <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-base sm:text-lg font-bold text-primary shadow-sm">
          #{entry.ticket_number}
        </span>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-medium truncate">{entry.customer_name || `#${entry.ticket_number}`}</p>
          {entry.service_name && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {entry.service_name.split(" + ").map((svc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary leading-tight"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {svc}
                </span>
              ))}
            </div>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {timeAgo(entry.created_at)}
            </span>
            {entry.customer_phone && (
              <>
                <PhoneDisplay phone={entry.customer_phone} className="text-muted-foreground" />
                <div className="flex gap-1">
                  <a
                    href={phoneLink(entry.customer_phone)}
                    className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-primary hover:bg-primary/20 transition"
                    title="Call"
                  >
                    <PhoneCall className="h-2.5 w-2.5" />
                  </a>
                  <a
                    href={whatsappLink(entry.customer_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 rounded-md bg-[#25D366]/10 px-1.5 py-0.5 text-[#25D366] hover:bg-[#25D366]/20 transition"
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-2.5 w-2.5" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions - Desktop */}
        <div className="hidden sm:flex gap-1.5 shrink-0">
          <button
            onClick={() => onComplete(entry.id)}
            className="flex items-center gap-1 rounded-xl border border-success/30 px-3 py-2 text-xs font-medium text-success transition hover:bg-success/10 active:scale-95"
            title={dict.dashboard.markComplete}
          >
            <Check className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{dict.dashboard.markComplete}</span>
          </button>
          <button
            onClick={() => onNoShow(entry.id)}
            className="flex items-center gap-1 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10 active:scale-95"
            title={dict.dashboard.markNoShow}
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{dict.dashboard.markNoShow}</span>
          </button>
        </div>

        {/* Actions - Mobile (menu button) */}
        <div className="relative sm:hidden shrink-0">
          <button
            onClick={toggleMenu}
            className="flex items-center justify-center rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted active:scale-95"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                ref={menuRef}
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 min-w-[140px] rounded-xl border border-border bg-card shadow-xl animate-slide-up overflow-hidden"
              >
                <button
                  onClick={() => { onComplete(entry.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-success hover:bg-success/10 transition"
                >
                  <Check className="h-4 w-4" />
                  {dict.dashboard.markComplete}
                </button>
                <button
                  onClick={() => { onNoShow(entry.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <X className="h-4 w-4" />
                  {dict.dashboard.markNoShow}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
