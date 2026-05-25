import { QueueSkeleton, StatsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="hidden lg:block w-64 border-r border-border bg-card p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="animate-pulse rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-20" />
              </div>
              <Skeleton className="h-14 w-14 rounded-xl" />
            </div>
          </div>
          <StatsSkeleton />
          <QueueSkeleton />
        </div>
      </main>
    </div>
  );
}
