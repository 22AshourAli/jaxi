import { AVG_SERVICE_TIME_MINUTES } from "./constants";

export type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  created_at: string;
  service_id: string | null;
  called_at: string | null;
};

export type ServiceDurationMap = Record<string, number>;

export function getWaitingCount(entries: QueueEntry[], currentEntryId: string): number {
  const current = entries.find((e) => e.id === currentEntryId);
  if (!current) return 0;
  return entries.filter(
    (e) => e.status === "waiting" && e.ticket_number < current.ticket_number
  ).length;
}

export function getPositionInQueue(entries: QueueEntry[], currentEntryId: string): number {
  const waiting = entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => a.ticket_number - b.ticket_number);
  const idx = waiting.findIndex((e) => e.id === currentEntryId);
  return idx === -1 ? 0 : idx + 1;
}

export function estimateWaitTime(
  entries: QueueEntry[],
  currentEntryId: string,
  avgServiceTime: number = AVG_SERVICE_TIME_MINUTES,
  serviceDurations?: ServiceDurationMap
): number {
  const current = entries.find((e) => e.id === currentEntryId);
  if (!current) return 0;

  const aheadOfMe = entries.filter(
    (e) => e.status === "waiting" && e.ticket_number < current.ticket_number
  );

  const totalTime = aheadOfMe.reduce((sum, entry) => {
    const duration = entry.service_id && serviceDurations?.[entry.service_id]
      ? serviceDurations[entry.service_id]
      : avgServiceTime;
    return sum + duration;
  }, 0);

  const servingCount = entries.filter((e) => e.status === "serving").length;
  return totalTime + servingCount * avgServiceTime;
}

export function getNextTicket(entries: QueueEntry[]): number {
  const todayEntries = entries.filter(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString()
  );
  if (todayEntries.length === 0) return 1;
  return Math.max(...todayEntries.map((e) => e.ticket_number)) + 1;
}
