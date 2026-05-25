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
  const { locale, shopId } = useParams<{ locale: string; shopId: string }>();
  const dict = useDictionary(locale);
  const supabase = createClient();
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([]);
  const [stats, setStats] = useState({ total: 0, avgWait: 0 });

  useEffect(() => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const fetchAnalytics = async () => {
      const { data } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", shopId)
        .gte("created_at", sevenDaysAgo);

      if (!data) return;

      const daily: Record<string, number> = {};
      const hourly: Record<string, number> = {};
      let totalWait = 0;
      let waitCount = 0;

      data.forEach((entry: any) => {
        const date = format(new Date(entry.created_at), "MMM dd");
        daily[date] = (daily[date] || 0) + 1;

        const hour = format(new Date(entry.created_at), "HH:00");
        hourly[hour] = (hourly[hour] || 0) + 1;

        if (entry.called_at && entry.created_at) {
          const wait = (new Date(entry.called_at).getTime() - new Date(entry.created_at).getTime()) / 60000;
          totalWait += wait;
          waitCount++;
        }
      });

      setDailyData(Object.entries(daily).map(([date, count]) => ({ date, count })));
      setHourlyData(Object.entries(hourly).map(([hour, count]) => ({ hour, count })));
      setStats({
        total: data.length,
        avgWait: waitCount > 0 ? Math.round(totalWait / waitCount) : 0,
      });
    };

    fetchAnalytics();
  }, [shopId, supabase]);

  function exportCSV() {
    const headers = ["date", "customers"];
    const rows = dailyData.map((d) => `${d.date},${d.count}`);
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${shopId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <DashboardHeader shopId={shopId} locale={locale} dict={dict} />
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{dict.dashboard.analytics}</h1>
            <button
              onClick={exportCSV}
              disabled={dailyData.length === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{dict.dashboard.totalCustomers}</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{dict.dashboard.avgWaitTime}</p>
              <p className="text-3xl font-bold">{stats.avgWait} {dict.customer.minutes}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{dict.dashboard.avgServiceTime}</p>
              <p className="text-3xl font-bold">{stats.avgWait} {dict.customer.minutes}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
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

          <div className="rounded-xl border border-border bg-card p-4">
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
