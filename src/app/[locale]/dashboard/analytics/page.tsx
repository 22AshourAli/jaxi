"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  Users,
  Clock,
  Timer,
  TrendingUp,
  UserCheck,
  XCircle,
  Loader2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/hooks/use-dictionary";
import { format, subDays, startOfDay } from "date-fns";

export default function AnalyticsPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = useDictionary(locale);
  const supabase = createClient();
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgWait: 0,
    avgServiceTime: 0,
    completed: 0,
    noShow: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const fetchAnalytics = async () => {
      const { data: shops } = await (supabase.from("shops") as any)
        .select("id, avg_service_time")
        .limit(1);

      const shop = (shops as any[])?.[0];
      if (!shop) {
        setLoading(false);
        return;
      }

      const shopAvgService = shop.avg_service_time ?? 20;

      const { data: entriesData } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", shop.id)
        .gte("created_at", sevenDaysAgo);

      if (!entriesData) {
        setLoading(false);
        return;
      }

      const daily: Record<string, number> = {};
      const hourly: Record<string, number> = {};
      let totalWait = 0;
      let waitCount = 0;
      let totalServiceTime = 0;
      let serviceCount = 0;
      let completed = 0;
      let noShow = 0;
      let cancelled = 0;

      entriesData.forEach((entry: any) => {
        const date = format(new Date(entry.created_at), "MMM dd");
        daily[date] = (daily[date] || 0) + 1;
        const hour = format(new Date(entry.created_at), "HH:00");
        hourly[hour] = (hourly[hour] || 0) + 1;

        if (entry.status === "completed") completed++;
        else if (entry.status === "no_show") noShow++;
        else if (entry.status === "cancelled") cancelled++;

        if (entry.called_at && entry.created_at) {
          const wait = (new Date(entry.called_at).getTime() - new Date(entry.created_at).getTime()) / 60000;
          totalWait += wait;
          waitCount++;
        }
        if (entry.completed_at && entry.called_at) {
          const serviceTime = (new Date(entry.completed_at).getTime() - new Date(entry.called_at).getTime()) / 60000;
          totalServiceTime += serviceTime;
          serviceCount++;
        }
      });

      setDailyData(Object.entries(daily).map(([date, count]) => ({ date, count })));
      setHourlyData(Object.entries(hourly).map(([hour, count]) => ({ hour, count })));
      setStats({
        total: entriesData.length,
        avgWait: waitCount > 0 ? Math.round(totalWait / waitCount) : 0,
        avgServiceTime: serviceCount > 0 ? Math.round(totalServiceTime / serviceCount) : shopAvgService,
        completed,
        noShow,
        cancelled,
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [supabase]);

  function exportCSV() {
    const headers = ["date", "customers"];
    const rows = dailyData.map((d) => `${d.date},${d.count}`);
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const isRtl = locale === "ar";

  if (!dict?.dashboard) {
    return <div className="flex min-h-screen items-center justify-center p-4"><p className="text-muted-foreground">{dict?.common?.loading ?? "Loading..."}</p></div>;
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col lg:flex-row">
      <DashboardHeader locale={locale} dict={dict} />
      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{dict.dashboard.analytics}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.weeklyStats}</p>
            </div>
            <button
              onClick={exportCSV}
              disabled={dailyData.length === 0 || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-pulse">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="mt-3 h-8 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{dict.dashboard.totalCustomers}</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{dict.dashboard.avgWaitTime}</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{stats.avgWait} <span className="text-sm font-normal text-muted-foreground">{dict.customer.minutes}</span></p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>{dict.dashboard.avgServiceTime}</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{stats.avgServiceTime} <span className="text-sm font-normal text-muted-foreground">{dict.customer.minutes}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-border bg-card p-3 text-center sm:p-4">
                  <CheckCircleIcon className="mx-auto h-5 w-5 text-success" />
                  <p className="mt-1 text-lg sm:text-2xl font-bold">{stats.completed}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{locale === "ar" ? "مكتمل" : "Completed"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center sm:p-4">
                  <XCircle className="mx-auto h-5 w-5 text-destructive" />
                  <p className="mt-1 text-lg sm:text-2xl font-bold">{stats.noShow}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{locale === "ar" ? "لم يحضر" : "No Show"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center sm:p-4">
                  <TrendingUp className="mx-auto h-5 w-5 text-warning" />
                  <p className="mt-1 text-lg sm:text-2xl font-bold">{stats.cancelled}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{locale === "ar" ? "ملغي" : "Cancelled"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">{dict.dashboard.weeklyStats}</h2>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                      <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                    {locale === "ar" ? "لا توجد بيانات كافية" : "Not enough data"}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">{dict.dashboard.peakHours}</h2>
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hour" className="text-xs text-muted-foreground" />
                      <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                    {locale === "ar" ? "لا توجد بيانات كافية" : "Not enough data"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
