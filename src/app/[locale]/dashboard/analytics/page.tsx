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
import { Download } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/hooks/use-dictionary";
import { format, subDays } from "date-fns";

export default function AnalyticsPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = useDictionary(locale);
  const supabase = createClient();
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([]);
  const [stats, setStats] = useState({ total: 0, avgWait: 0, avgServiceTime: 0 });

  useEffect(() => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const fetchAnalytics = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;

      const { data: shopData } = await supabase.from("shops").select("avg_service_time").eq("id", userId).single();
      const shopAvgService = (shopData as any)?.avg_service_time ?? 20;

      const { data: entriesData } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", userId)
        .gte("created_at", sevenDaysAgo);

      if (!entriesData) return;

      const daily: Record<string, number> = {};
      const hourly: Record<string, number> = {};
      let totalWait = 0;
      let waitCount = 0;
      let totalServiceTime = 0;
      let serviceCount = 0;

      entriesData.forEach((entry: any) => {
        const date = format(new Date(entry.created_at), "MMM dd");
        daily[date] = (daily[date] || 0) + 1;
        const hour = format(new Date(entry.created_at), "HH:00");
        hourly[hour] = (hourly[hour] || 0) + 1;
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
      });
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
              disabled={dailyData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{dict.dashboard.totalCustomers}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{dict.dashboard.avgWaitTime}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{stats.avgWait} {dict.customer.minutes}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{dict.dashboard.avgServiceTime}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{stats.avgServiceTime} {dict.customer.minutes}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{dict.dashboard.weeklyStats}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{dict.dashboard.peakHours}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
