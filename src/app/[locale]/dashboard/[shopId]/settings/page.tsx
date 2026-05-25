"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/hooks/use-dictionary";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
};

const WEEKDAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

const WEEKDAY_LABELS: Record<string, { ar: string; en: string }> = {
  saturday: { ar: "السبت", en: "Saturday" },
  sunday: { ar: "الأحد", en: "Sunday" },
  monday: { ar: "الإثنين", en: "Monday" },
  tuesday: { ar: "الثلاثاء", en: "Tuesday" },
  wednesday: { ar: "الأربعاء", en: "Wednesday" },
  thursday: { ar: "الخميس", en: "Thursday" },
  friday: { ar: "الجمعة", en: "Friday" },
};

export default function SettingsPage() {
  const { locale, shopId } = useParams<{ locale: string; shopId: string }>();
  const dict = useDictionary(locale);
  const supabase = createClient();
  const isRtl = locale === "ar";

  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ name: "", duration: 15 });
  const [saving, setSaving] = useState(false);

  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({});
  const [hoursSaved, setHoursSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const svcRes = await (supabase.from("services") as any).select("*").eq("shop_id", shopId).order("sort_order");
      if (svcRes.data) setServices(svcRes.data as Service[]);

      const shopRes = await (supabase.from("shops") as any).select("working_hours").eq("id", shopId).single();
      if (shopRes.data?.working_hours) {
        const wh = shopRes.data.working_hours;
        const normalized: Record<string, { open: string; close: string; enabled: boolean }> = {};
        for (const day of WEEKDAYS) {
          const entry = wh[day];
          normalized[day] = entry
            ? { open: entry.open || "09:00", close: entry.close || "22:00", enabled: true }
            : { open: "09:00", close: "22:00", enabled: false };
        }
        setWorkingHours(normalized);
      }
    };
    load();
  }, [shopId, supabase]);

  async function saveWorkingHours() {
    setHoursSaved(false);
    const payload: Record<string, { open: string; close: string }> = {};
    for (const day of WEEKDAYS) {
      if (workingHours[day]?.enabled) {
        payload[day] = { open: workingHours[day].open, close: workingHours[day].close };
      }
    }
    await (supabase.from("shops") as any).update({ working_hours: payload }).eq("id", shopId);
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2000);
  }

  async function addService() {
    if (!newService.name) return;
    setSaving(true);
    const { data } = await (supabase.from("services") as any)
      .insert({ shop_id: shopId, name: newService.name, duration_minutes: newService.duration, sort_order: services.length + 1 })
      .select()
      .single();
    if (data) {
      setServices([...services, data as Service]);
      setNewService({ name: "", duration: 15 });
    }
    setSaving(false);
  }

  async function toggleService(id: string, current: boolean) {
    await (supabase.from("services") as any).update({ is_active: !current }).eq("id", id);
    setServices(services.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  }

  async function deleteService(id: string) {
    await (supabase.from("services") as any).delete().eq("id", id);
    setServices(services.filter((s) => s.id !== id));
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <DashboardHeader shopId={shopId} locale={locale} dict={dict} />
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold">{dict.dashboard.settings}</h1>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 text-lg font-semibold">{dict.dashboard.workingHours}</h2>
            <div className="space-y-3">
              {WEEKDAYS.map((day) => {
                const wh = workingHours[day] || { open: "09:00", close: "22:00", enabled: true };
                const label = WEEKDAY_LABELS[day]?.[locale as "ar" | "en"] || day;
                return (
                  <div key={day} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <label className="flex w-6 items-center">
                      <input
                        type="checkbox"
                        checked={wh.enabled}
                        onChange={() => setWorkingHours({ ...workingHours, [day]: { ...wh, enabled: !wh.enabled } })}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                    <span className="w-24 text-sm font-medium">{label}</span>
                    {wh.enabled ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="time"
                          value={wh.open}
                          onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...wh, open: e.target.value } })}
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                        />
                        <span className="text-muted-foreground">—</span>
                        <input
                          type="time"
                          value={wh.close}
                          onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...wh, close: e.target.value } })}
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    ) : (
                      <span className="flex-1 text-sm text-muted-foreground">{dict.common.cancel}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={saveWorkingHours}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              {hoursSaved ? "✓ " + dict.common.save : dict.common.save}
            </button>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 text-lg font-semibold">{dict.dashboard.services}</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className={`font-medium ${!service.is_active ? "text-muted-foreground line-through" : ""}`}>
                      {service.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {service.duration_minutes} {dict.customer.minutes}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleService(service.id, service.is_active)}
                      className={`rounded-md px-3 py-1 text-xs ${service.is_active ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
                    >
                      {service.is_active ? dict.common.cancel : dict.dashboard.services}
                    </button>
                    <button onClick={() => deleteService(service.id)} className="rounded-md bg-destructive/10 px-3 py-1 text-xs text-destructive">
                      {dict.common.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder={dict.dashboard.serviceName}
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                type="number"
                placeholder={dict.dashboard.duration}
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                min={5}
              />
              <button
                onClick={addService}
                disabled={saving || !newService.name}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {dict.dashboard.addService}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
