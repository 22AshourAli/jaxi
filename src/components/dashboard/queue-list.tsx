"use client";

import { Phone, Check, X } from "lucide-react";

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  customer_phone: string | null;
  created_at: string;
};

type Props = {
  entries: QueueEntry[];
  dict: any;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
};

export function QueueList({ entries, dict, onComplete, onNoShow }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">{dict.dashboard.noQueue}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              #{entry.ticket_number}
            </span>
            <div>
              <p className="font-medium">{dict.dashboard.waiting}</p>
              {entry.customer_phone && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {entry.customer_phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onComplete(entry.id)}
              className="rounded-lg border border-success/30 p-2 text-success transition hover:bg-success/10"
              title={dict.dashboard.markComplete}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNoShow(entry.id)}
              className="rounded-lg border border-destructive/30 p-2 text-destructive transition hover:bg-destructive/10"
              title={dict.dashboard.markNoShow}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
