import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  created_at: string;
  called_at: string | null;
  service_id: string | null;
};

export function useRealtimeQueue(shopId: string) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchEntries = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", shopId)
        .gte("created_at", todayStart.toISOString())
        .neq("status", "cancelled")
        .order("ticket_number", { ascending: true });

      if (data) setEntries(data as QueueEntry[]);
    };

    fetchEntries();

    const channel = supabase
      .channel("queue-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${shopId}`,
        },
        () => fetchEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, supabase]);

  return entries;
}
