"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { QueueList } from "@/components/dashboard/queue-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { sendTurnNotification } from "@/actions/notifications";
import { serverCallNext, serverComplete, serverNoShow, serverAddCustomer, serverDeleteEntry } from "@/actions/queue";
import { phoneLink, whatsappLink, formatPhoneDisplay } from "@/lib/phone";
import { getServiceNames, decodeCustomerName } from "@/lib/booking";
import { PhoneDisplay } from "@/components/shared/phone-display";
import { Users, Clock, UserCheck, ArrowRight, Loader2, QrCode, UserPlus, X, Check, Phone, User, Trash2, MessageCircle, ChevronDown, History, Scissors } from "lucide-react";
import { Skeleton, QueueSkeleton, StatsSkeleton } from "@/components/shared/skeleton";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  sort_order: number;
};

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
  customer_phone: string | null;
  customer_name?: string | null;
  created_at: string;
  called_at: string | null;
  service_id: string | null;
  service_ids?: string | null;
  service_name?: string;
};

type Props = { locale: string; dict: any };

export function QueueManagement({ locale, dict }: Props) {
  const supabase = createClient();
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [serving, setServing] = useState<QueueEntry | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [services, setServices] = useState<Map<string, string>>(new Map());
  const servicesRef = useRef<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addServices, setAddServices] = useState<string[]>([] as string[]);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"waiting" | "completed">("waiting");
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const isRtl = locale === "ar";

  useEffect(() => {
    const fetchData = async () => {
      const shopRes = await (supabase.from("shops") as any).select("id, name").limit(1).maybeSingle();
      if (shopRes.data) {
        setShopId(shopRes.data.id);
        setShopName(shopRes.data.name);
      }

      // Fetch services for mapping
      const { data: svcData } = await (supabase.from("services") as any)
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      const svcMap = new Map<string, string>();
      if (svcData) {
        for (const svc of svcData as any[]) {
          svcMap.set(svc.id, svc.name);
        }
        setServices(svcMap);
        servicesRef.current = svcMap;
      }

      if (shopRes.data) {
        const { data } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("shop_id", shopRes.data.id)
          .neq("status", "cancelled")
          .order("ticket_number", { ascending: true });

        if (data) {
          const entries = (data as QueueEntry[]).map((e) => ({
            ...e,
            customer_name: decodeCustomerName(e.customer_name).name,
            service_name: getServiceNames(e, svcMap),
          }));
          setEntries(entries);
          const currentServing = entries.find((e) => e.status === "serving");
          setServing(currentServing ?? null);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!shopId) return;

    const channel = supabase
      .channel("queue-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          supabase
            .from("queue_entries")
            .select("*")
            .eq("shop_id", shopId)
            .neq("status", "cancelled")
            .order("ticket_number", { ascending: true })
            .then(({ data }) => {
              if (data) {
                const entries = (data as QueueEntry[]).map((e) => ({
                  ...e,
                  customer_name: decodeCustomerName(e.customer_name).name,
                  service_name: getServiceNames(e, servicesRef.current),
                }));
                setEntries(entries);
                const currentServing = entries.find((e) => e.status === "serving");
                setServing(currentServing ?? null);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, supabase]);

  const waiting = entries.filter((e) => e.status === "waiting");

  async function handleCallNext() {
    const next = waiting[0];
    if (!next) return;
    setActionLoading(true);

    await serverCallNext(next.id, serving?.id ?? null);

    if (next.customer_phone) {
      sendTurnNotification(next.customer_phone, shopName, next.ticket_number, locale as "ar" | "en");
    }
    setActionLoading(false);
  }

  async function handleComplete(id: string) {
    await serverComplete(id);
  }

  async function handleNoShow(id: string) {
    await serverNoShow(id);
  }

  async function handleDelete(id: string) {
    await serverDeleteEntry(id);
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleCallNext();
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setShowAddModal(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [waiting, serving, loading, actionLoading]);

  async function handleShowHistory(phone: string) {
    setShowHistory(phone);
    setHistoryLoading(true);
    const { data } = await (supabase.from("queue_entries") as any)
      .select("*")
      .eq("customer_phone", phone.replace(/\D/g, ""))
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      const mapped = (data as any[]).map((e: any) => ({
        ...e,
        customer_name: decodeCustomerName(e.customer_name).name,
        service_name: getServiceNames(e, services),
      }));
      setHistoryEntries(mapped);
    }
    setHistoryLoading(false);
  }

  const addDigits = (v: string) => v.replace(/\D/g, "");

  async function handleAddCustomer() {
    if (!addName.trim()) {
      setAddError(locale === "ar" ? "الاسم مطلوب" : "Name is required");
      return;
    }
    const phoneDigits = addDigits(addPhone);
    if (phoneDigits.length < 10) {
      setAddError(locale === "ar" ? "رقم غير صحيح (10 أرقام على الأقل)" : "Invalid phone (min 10 digits)");
      return;
    }
    if (phoneDigits.length > 15) {
      setAddError(locale === "ar" ? "رقم طويل جداً" : "Phone number too long");
      return;
    }
    setAddLoading(true);
    setAddError("");

    const { error } = await serverAddCustomer(shopId!, addName.trim(), addPhone, addServices);

    if (error) {
      if (error.includes("customer_name")) {
        setAddError(
          locale === "ar"
            ? "خطأ في قاعدة البيانات. شغّل ملف التحديث من supabase/migrations/"
            : "Database error. Run the migration from supabase/migrations/"
        );
      } else {
        setAddError(error);
      }
      setAddLoading(false);
      return;
    }

    setShowAddModal(false);
    setAddName("");
    setAddPhone("");
    setAddServices([]);
    setAddLoading(false);
  }

  if (!dict?.dashboard) {
    return <div className="flex min-h-screen items-center justify-center p-4"><p className="text-muted-foreground">{dict?.common?.loading ?? "Loading..."}</p></div>;
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col lg:flex-row">
      <DashboardHeader locale={locale} dict={dict} />
      <main className="flex-1 p-3 sm:p-4 lg:ml-64 lg:p-6">
        <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{dict.dashboard.queueManagement}</h1>
              {shopName && (
                <p className="mt-0.5 text-sm text-muted-foreground">{shopName}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                {locale === "ar" ? "إضافة عميل" : "Add Customer"}
              </button>
              <Link
                href={`/${locale}/dashboard/settings`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted active:scale-95"
              >
                <QrCode className="h-4 w-4" />
                {locale === "ar" ? "QR" : "QR Code"}
              </Link>
              <button
                onClick={handleCallNext}
                disabled={loading || waiting.length === 0 || actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                )}
                {dict.dashboard.callNext}
                {waiting.length > 0 && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs">{waiting.length}</span>}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
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
          ) : (
            <>
              {serving && (
                <div className="animate-scale-in rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{dict.queue.currentlyServing}</p>
                      <p className="mt-0.5 text-3xl sm:text-4xl font-bold text-primary">#{serving.ticket_number}</p>
                      {serving.customer_name && (
                        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground truncate">{serving.customer_name}</p>
                      )}
                      {serving.service_name && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-xs text-primary/70 font-medium truncate">
                          <Scissors className="h-3 w-3 shrink-0" />
                          {serving.service_name}
                        </p>
                      )}
                    </div>
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <UserCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleComplete(serving.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-success/10 px-4 py-2 text-xs font-medium text-success transition hover:bg-success/20 active:scale-95"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {locale === "ar" ? "اكتملت" : "Complete"}
                    </button>
                    <button
                      onClick={() => handleNoShow(serving.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/20 active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                      {locale === "ar" ? "لم يحضر" : "No Show"}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">{dict.dashboard.waiting}</p>
                  <p className="mt-0.5 text-xl sm:text-2xl font-bold">{waiting.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">{dict.dashboard.serving}</p>
                  <p className="mt-0.5 text-xl sm:text-2xl font-bold">{serving ? 1 : 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">{dict.dashboard.completed}</p>
                  <p className="mt-0.5 text-xl sm:text-2xl font-bold">
                    {entries.filter((e) => e.status === "completed").length}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 border-b border-border">
                <button
                  onClick={() => setActiveTab("waiting")}
                  className={`pb-3 text-sm font-medium transition border-b-2 -mb-[1px] ${
                    activeTab === "waiting"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {locale === "ar" ? "في الانتظار" : "Waiting"} ({waiting.length})
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`pb-3 text-sm font-medium transition border-b-2 -mb-[1px] ${
                    activeTab === "completed"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {locale === "ar" ? "تم الانتهاء" : "Completed"} ({entries.filter((e) => e.status === "completed").length})
                </button>
              </div>

              {activeTab === "waiting" ? (
                <QueueList
                  entries={waiting}
                  dict={dict}
                  onComplete={handleComplete}
                  onNoShow={handleNoShow}
                />
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const completed = entries.filter((e) => e.status === "completed");
                    if (completed.length === 0) {
                      return (
                        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                          <UserCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                          <p className="text-muted-foreground">{locale === "ar" ? "لا يوجد عملاء منتهيون" : "No completed customers"}</p>
                        </div>
                      );
                    }
                    return completed.map((entry, i) => (
                      <div
                        key={entry.id}
                        className="animate-slide-up rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                      >
                        <div className="flex items-center gap-3 p-3 sm:p-4">
                          <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 text-base sm:text-lg font-bold text-success shadow-sm">
                            #{entry.ticket_number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium truncate">{entry.customer_name || `#${entry.ticket_number}`}</p>
                            {entry.service_name && (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-xs text-primary/60 font-medium truncate">
                                <Scissors className="h-3 w-3 shrink-0" />
                                {entry.service_name}
                              </p>
                            )}
                            {entry.customer_phone && (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" />
                                <PhoneDisplay phone={entry.customer_phone} />
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {entry.customer_phone && (
                              <>
                                <a
                                  href={phoneLink(entry.customer_phone)}
                                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium text-muted-foreground transition hover:bg-muted active:scale-95"
                                  title={locale === "ar" ? "اتصال" : "Call"}
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={whatsappLink(entry.customer_phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium text-success transition hover:bg-success/10 active:scale-95"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                                <button
                                  onClick={() => handleShowHistory(entry.customer_phone!)}
                                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium text-muted-foreground transition hover:bg-muted active:scale-95"
                                  title={locale === "ar" ? "السجل" : "History"}
                                >
                                  <History className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium text-destructive transition hover:bg-destructive/10 active:scale-95"
                              title={locale === "ar" ? "حذف" : "Delete"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-xl animate-slide-up max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">
                  {locale === "ar" ? "تاريخ الزيارات" : "Visit History"}
                </h2>
                {showHistory && <span className="text-xs text-muted-foreground" dir="ltr">{formatPhoneDisplay(showHistory)}</span>}
              </div>
              <button onClick={() => setShowHistory(null)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : historyEntries.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد زيارات سابقة" : "No previous visits"}</p>
                </div>
              ) : (
                historyEntries.map((e: any, i: number) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-3.5" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        e.status === "completed" ? "bg-success/10 text-success" : e.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>
                        #{e.ticket_number}
                      </span>
                      <div className="min-w-0">
                        {e.service_name && <p className="text-xs font-medium text-foreground truncate">{e.service_name}</p>}
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      e.status === "completed" ? "bg-success/10 text-success" :
                      e.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      e.status === "serving" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {e.status === "completed" ? (locale === "ar" ? "تم" : "Done") :
                       e.status === "cancelled" ? (locale === "ar" ? "ملغي" : "Cancelled") :
                       e.status === "serving" ? (locale === "ar" ? "جارٍ" : "Serving") :
                       e.status === "waiting" ? (locale === "ar" ? "انتظار" : "Waiting") : e.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">
                {locale === "ar" ? "إضافة عميل" : "Add Customer"}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setAddError(""); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-3 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">{addError}</div>
            )}

              <div className="space-y-3">
              <div>
                <label htmlFor="add-name" className="block mb-1 text-xs font-medium text-muted-foreground">
                  {locale === "ar" ? "الاسم" : "Name"}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    id="add-name"
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder={locale === "ar" ? "اسم العميل" : "Customer name"}
                    dir={isRtl ? "rtl" : "ltr"}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label htmlFor="add-phone" className="block mb-1 text-xs font-medium text-muted-foreground">
                  {locale === "ar" ? "رقم الجوال" : "Phone"}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    id="add-phone"
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="05X XXX XXXX"
                    dir="ltr"
                  />
                </div>
              </div>
              {/* Service selection */}
              <div>
                <label className="block mb-1.5 text-xs font-medium text-muted-foreground">
                  {locale === "ar" ? "الخدمات" : "Services"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Array.from(services).map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAddServices((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                        addServices.includes(id)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setShowAddModal(false); setAddError(""); }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                {dict.common.cancel}
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={addLoading}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : dict.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
