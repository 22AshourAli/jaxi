"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNotification } from "@/hooks/use-notification";
import { useToast } from "@/components/shared/toast";
import {
  Loader2,
  User,
  Phone,
  Scissors,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Bell,
  BellOff,
  Smartphone,
  Users,
  Clock,
  RefreshCw,
  PartyPopper,
  XCircle,
} from "lucide-react";

type Props = { locale: string; dict: any };

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
};

const LS_KEY = "dorak_active_ticket";

export function JoinForm({ locale, dict }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { permission, requestPermission, sendNotification } = useNotification();
  const { show: showToast } = useToast();
  const isRtl = locale === "ar";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [ticketNumber, setTicketNumber] = useState<number>(0);
  const [avgServiceTime, setAvgServiceTime] = useState(20);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [currentlyServing, setCurrentlyServing] = useState<number | null>(null);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [turnCalled, setTurnCalled] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [queueAvailable, setQueueAvailable] = useState(true);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const turnNotified = useRef(false);
  const nearNotified = useRef(false);

  // Recover from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data.entryId || !data.ticketNumber || !data.shopId) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      // Verify ticket is still active
      const client = createClient();
      client
        .from("queue_entries")
        .select("status")
        .eq("id", data.entryId)
        .maybeSingle()
        .then(({ data: entry }) => {
          if (entry && ["waiting", "serving", "called"].includes((entry as any).status)) {
            setEntryId(data.entryId);
            setShopId(data.shopId);
            setShopName(data.shopName || "");
            setTicketNumber(data.ticketNumber);
            setAvgServiceTime(data.avgServiceTime || 20);
            setPhone(data.phone || "");
            setName(data.name || "");
            setSubmitted(true);
            if ((entry as any).status === "serving" || (entry as any).status === "called") {
              setTurnCalled(true);
            }
          } else {
            localStorage.removeItem(LS_KEY);
          }
        });
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  // Save to localStorage when tracking
  useEffect(() => {
    if (submitted && entryId && ticketNumber) {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ entryId, shopId, ticketNumber, shopName, avgServiceTime, phone, name })
      );
    }
    if (cancelled || completed) {
      localStorage.removeItem(LS_KEY);
    }
  }, [submitted, entryId, ticketNumber, shopId, shopName, avgServiceTime, phone, name, cancelled, completed]);

  // Real-time queue subscription
  useEffect(() => {
    if (!shopId || !ticketNumber || cancelled || completed) return;

    const fetchLiveData = async () => {
      const { data, error } = await supabase
        .from("queue_entries")
        .select("id, ticket_number, status")
        .eq("shop_id", shopId)
        .neq("status", "cancelled")
        .order("ticket_number", { ascending: true });

      if (error || !data) {
        setQueueAvailable(false);
        return;
      }
      setQueueAvailable(true);

      const entries = data as QueueEntry[];

      const me = entries.find((e) => e.ticket_number === ticketNumber);
      if (!me) {
        setQueueAvailable(false);
        return;
      }

      if (me.status === "called" || me.status === "serving") {
        setTurnCalled(true);
        showToast(
          locale === "ar" ? "🔔 حان دورك!" : "🔔 It's Your Turn!",
          "success"
        );
      }
      if (me.status === "completed") {
        setCompleted(true);
        return;
      }

      const serving = entries.find((e) => e.status === "serving");
      setCurrentlyServing(serving?.ticket_number ?? null);

      const ahead = entries.filter(
        (e) => e.ticket_number < ticketNumber && e.status === "waiting"
      ).length;
      setPeopleAhead(ahead);
    };

    fetchLiveData();

    const channel = supabase
      .channel(`ticket-${entryId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${shopId}`,
        },
        () => fetchLiveData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, ticketNumber, entryId, cancelled, completed, supabase]);

  // Browser notification when turn is called
  useEffect(() => {
    if (turnCalled && browserNotifyEnabled && !turnNotified.current) {
      turnNotified.current = true;
      sendNotification(
        locale === "ar" ? "🔔 حان دورك!" : "🔔 It's Your Turn!",
        locale === "ar"
          ? `رقم #${ticketNumber} - توجّه إلى المحل الآن`
          : `Number #${ticketNumber} - Please head to the shop now`
      );
    }
  }, [turnCalled, browserNotifyEnabled, ticketNumber, locale, sendNotification]);

  // Browser notification when near (1-2 people ahead)
  useEffect(() => {
    if (
      peopleAhead <= 2 &&
      peopleAhead > 0 &&
      browserNotifyEnabled &&
      !nearNotified.current
    ) {
      nearNotified.current = true;
      sendNotification(
        locale === "ar" ? "⏳ دورك يقترب" : "⏳ Your Turn is Near",
        locale === "ar"
          ? `أنت رقم ${peopleAhead} في الطابور. استعد!`
          : `You're #${peopleAhead} in line. Get ready!`
      );
    }
  }, [peopleAhead, browserNotifyEnabled, locale, sendNotification]);

  function validateName(v: string): string {
    if (!v.trim()) return locale === "ar" ? "الاسم مطلوب" : "Name is required";
    if (v.trim().length < 2) return locale === "ar" ? "الاسم قصير جداً" : "Name is too short";
    return "";
  }

  function validatePhone(v: string): string {
    if (!v.trim()) return locale === "ar" ? "رقم الجوال مطلوب" : "Phone is required";
    const digits = v.replace(/\D/g, "");
    const normalized = digits.startsWith("20") ? digits.slice(2) : digits;
    if (normalized.length < 10) return locale === "ar" ? "رقم غير صحيح (10 أرقام على الأقل)" : "Invalid phone (min 10 digits)";
    if (normalized.length > 15) return locale === "ar" ? "رقم طويل جداً" : "Phone number too long";
    return "";
  }

  function formatPhone(v: string): string {
    const d = v.replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("20") && d.length > 2) {
      const rest = d.slice(2);
      if (rest.length <= 3) return `+20 ${rest}`;
      if (rest.length <= 7) return `+20 ${rest.slice(0, 3)} ${rest.slice(3)}`;
      return `+20 ${rest.slice(0, 3)} ${rest.slice(3, 7)} ${rest.slice(7, 11)}`;
    }
    if (d.startsWith("01")) {
      if (d.length <= 4) return d;
      if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
      return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 11)}`;
    }
    if (d.startsWith("1")) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    }
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError("");

    const nErr = validateName(name);
    const pErr = validatePhone(phone);
    setNameError(nErr);
    setPhoneError(pErr);
    if (nErr || pErr) return;

    setLoading(true);
    try {
      const { data: shop, error: shopErr } = await (supabase.from("shops") as any)
        .select("id, name, avg_service_time")
        .limit(1)
        .maybeSingle();

      if (shopErr || !shop) {
        setGeneralError(
          locale === "ar"
            ? "المحل غير متاح حالياً. حاول مرة أخرى لاحقاً"
            : "Shop not available. Please try again later."
        );
        return;
      }

      setShopName(shop.name);
      setShopId(shop.id);

      // Check if this phone already has an active booking
      const cleanPhone = phone.replace(/\D/g, "");
      const { data: existing } = await (supabase.from("queue_entries") as any)
        .select("id, ticket_number, status")
        .eq("shop_id", shop.id)
        .eq("customer_phone", cleanPhone)
        .in("status", ["waiting", "serving"])
        .limit(1);

      if (existing && (existing as any[]).length > 0) {
        const current = (existing as any[])[0];
        showToast(
          locale === "ar" ? `لديك حزب نشط بالفعل (#${current.ticket_number})` : `You already have an active booking (#${current.ticket_number})`,
          "error"
        );
        setGeneralError(
          locale === "ar"
            ? `لديك حجز نشط بالفعل (رقم #${current.ticket_number}). انتظر دورك أو تواصل مع المحل`
            : `You already have an active booking (#${current.ticket_number}). Please wait for your turn or contact the shop.`
        );
        setLoading(false);
        return;
      }

      const { data: lastEntry } = await (supabase.from("queue_entries") as any)
        .select("ticket_number")
        .eq("shop_id", shop.id)
        .order("ticket_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastTicket = (lastEntry as any)?.ticket_number || 0;
      const nextNumber = lastTicket + 1;

      const { data: entry, error: insertErr } = await (supabase.from("queue_entries") as any)
        .insert({
          shop_id: shop.id,
          ticket_number: nextNumber,
          customer_name: name.trim(),
          customer_phone: phone.replace(/\D/g, ""),
          status: "waiting",
        })
        .select()
        .single();

      if (insertErr) {
        if (insertErr.message?.includes?.("customer_name")) {
          setGeneralError(
            locale === "ar"
              ? "خطأ في قاعدة البيانات: عمود 'اسم العميل' غير موجود. شغّل ملف التحديث من supabase/migrations/"
              : "Database error: 'customer_name' column missing. Run the migration from supabase/migrations/"
          );
        } else {
          setGeneralError(
            locale === "ar"
              ? "حدث خطأ في الحجز. حاول مرة أخرى"
              : "Failed to book. Please try again."
          );
        }
        return;
      }

      const { data: aheadEntries } = await (supabase.from("queue_entries") as any)
        .select("id")
        .eq("shop_id", shop.id)
        .eq("status", "waiting")
        .lt("ticket_number", nextNumber);

      const ahead = (aheadEntries as any[])?.length || 0;
      const avgService = shop.avg_service_time || 20;
      setAvgServiceTime(avgService);

      setEntryId((entry as any).id);
      setTicketNumber(nextNumber);
      setPeopleAhead(ahead);

      // Fire-and-forget WhatsApp confirmation
      try {
        const { sendQueueConfirmation } = await import("@/actions/notifications");
        const sent = await sendQueueConfirmation(
          phone.replace(/\D/g, ""),
          shop.name,
          nextNumber,
          ahead,
          ahead * avgService,
          locale as "ar" | "en"
        );
        setWhatsappSent(sent);
      } catch {}

      setSubmitted(true);
      showToast(
        locale === "ar" ? `تم الحجز! رقم دورك #${nextNumber}` : `Booked! Your turn #${nextNumber}`,
        "success"
      );
    } catch {
      setGeneralError(
        locale === "ar"
          ? "حدث خطأ غير متوقع. حاول مرة أخرى"
          : "Unexpected error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleBrowserNotify() {
    if (permission !== "granted") {
      const ok = await requestPermission();
      if (!ok) return;
    }
    const next = !browserNotifyEnabled;
    setBrowserNotifyEnabled(next);
    if (next) {
      sendNotification(
        locale === "ar" ? "✅ تم تفعيل الإشعارات" : "✅ Notifications Enabled",
        locale === "ar"
          ? "سنخبرك عندما يقترب دورك"
          : "We'll notify you when your turn is near"
      );
    }
  }

  function handleBackToForm() {
    setSubmitted(false);
    setCancelled(false);
    setCompleted(false);
    setTurnCalled(false);
    setEntryId(null);
    setTicketNumber(0);
    setPeopleAhead(0);
    setCurrentlyServing(null);
    setBrowserNotifyEnabled(false);
    localStorage.removeItem(LS_KEY);
  }

  const estimatedWait = peopleAhead * avgServiceTime;

  // ── CANCELLED ──
  if (cancelled) {
    return (
      <div className="w-full max-w-md space-y-6 py-8 px-4">
        <div className="animate-scale-in text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">{locale === "ar" ? "تم إلغاء دورك" : "Your turn has been cancelled"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? "يمكنك أخذ دور جديد في أي وقت" : "You can get a new turn anytime"}
          </p>
          <button onClick={handleBackToForm} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            {locale === "ar" ? "خذ دور جديد" : "Get a new turn"}
            <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    );
  }

  // ── COMPLETED ──
  if (completed) {
    return (
      <div className="w-full max-w-md space-y-6 py-8 px-4">
        <div className="animate-scale-in text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <PartyPopper className="h-8 w-8 text-success" />
          </div>
          <p className="text-lg font-medium">{locale === "ar" ? "تمت خدمتك!" : "You've been served!"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? "نأمل أن تكون راضياً عن الخدمة" : "We hope you enjoyed the service"}
          </p>
          <p className="mt-1 text-4xl font-bold text-primary">#{ticketNumber}</p>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={handleBackToForm} className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 text-sm font-medium text-primary hover:bg-primary/20 transition">
            {locale === "ar" ? "خذ دور جديد" : "Get a new turn"}
          </button>
          <button onClick={() => router.push(`/${locale}`)} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition">
            {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
          </button>
        </div>
      </div>
    );
  }

  // ── TURN CALLED ──
  if (turnCalled) {
    return (
      <div className="w-full max-w-md space-y-6 py-8 px-4">
        <div className="animate-scale-in text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-success/20 [animation:glow-pulse_2s_ease-in-out_infinite]">
            <Bell className="h-12 w-12 text-success" />
          </div>
          <p className="text-lg font-bold text-success tracking-wide">
            {locale === "ar" ? "🔔 حان دورك!" : "🔔 It's Your Turn!"}
          </p>
          <p className="mt-3 text-7xl font-bold tracking-tight text-primary">#{ticketNumber}</p>
          <p className="mt-4 text-base text-muted-foreground">
            {locale === "ar"
              ? "يرجى التوجه إلى المحل الآن، دورك جاهز"
              : "Please head to the shop now, it's your turn"}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button onClick={handleBackToForm} className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 text-sm font-medium text-primary hover:bg-primary/20 transition">
            {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
          </button>
        </div>
      </div>
    );
  }

  // ── TRACKING ──
  if (submitted && ticketNumber > 0) {
    return (
      <div className="w-full max-w-md space-y-5 py-8 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowRight className={`h-3 w-3 ${isRtl ? "rotate-180" : ""}`} />
            {locale === "ar" ? "الرئيسية" : "Home"}
          </button>
          <p className="text-xs text-muted-foreground">{shopName}</p>
        </div>

        <div className="text-center animate-scale-in">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Scissors className="h-7 w-7 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{dict.customer.yourNumber}</p>
          <p className="mt-1 text-6xl font-bold tracking-tight text-primary">#{ticketNumber}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="animate-slide-up rounded-xl border border-border bg-card p-3 text-center shadow-sm">
            <Users className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 text-2xl font-bold transition-all duration-300">{peopleAhead}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{dict.customer.peopleAhead}</p>
          </div>
          <div
            className="animate-slide-up rounded-xl border border-border bg-card p-3 text-center shadow-sm"
            style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
          >
            <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 text-2xl font-bold transition-all duration-300">
              {estimatedWait}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{dict.customer.minutes}</p>
          </div>
          <div
            className="animate-slide-up rounded-xl border border-border bg-card p-3 text-center shadow-sm"
            style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
          >
            <p className="text-2xl font-bold text-success transition-all duration-300">
              {currentlyServing ? `#${currentlyServing}` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{dict.customer.currentlyServing}</p>
          </div>
        </div>

        <div
          className="animate-fade-in rounded-xl border border-border bg-card p-4 shadow-sm"
          style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">{dict.customer.queueStatus}</p>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {locale === "ar" ? "مباشر" : "Live"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
                style={{
                  width: currentlyServing && ticketNumber
                    ? `${Math.min(100, (currentlyServing / ticketNumber) * 100)}%`
                    : "0%",
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>#1</span>
            <span>{locale === "ar" ? "أنت" : "You"} #{ticketNumber}</span>
          </div>
        </div>

        <div
          className="animate-slide-up space-y-2"
          style={{ animationDelay: "320ms", animationFillMode: "backwards" }}
        >
          <button
            onClick={handleToggleBrowserNotify}
            className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all ${
              browserNotifyEnabled
                ? "border-primary/30 bg-primary/5 text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.02]"
            }`}
          >
            <span className="flex items-center gap-2 text-sm">
              {browserNotifyEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              {dict.customer.browserNotify}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                browserNotifyEnabled
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {browserNotifyEnabled
                ? locale === "ar"
                  ? "مفعل"
                  : "On"
                : locale === "ar"
                ? "تشغيل"
                : "Enable"}
            </span>
          </button>
        </div>

        <div
          className="animate-slide-up flex items-center justify-between rounded-xl border border-border bg-card p-3.5"
          style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            {locale === "ar" ? "إشعار واتساب" : "WhatsApp Notification"}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${whatsappSent ? "text-success" : "text-muted-foreground"}`}>
            {whatsappSent ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {whatsappSent
              ? (locale === "ar" ? "مرسل" : "Sent")
              : (locale === "ar" ? "جاري الإرسال..." : "Sending...")}
          </span>
        </div>


      </div>
    );
  }

  // ── FORM ──
  return (
    <div className="w-full max-w-md space-y-6 py-8 px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 animate-scale-in">
          <Scissors className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "خذ دورك الآن" : "Take Your Turn"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "ar" ? "أدخل بياناتك واحجز مكانك" : "Enter your info to book your spot"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg animate-slide-up">
        {generalError && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive animate-scale-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            {locale === "ar" ? "الاسم" : "Name"}
          </label>
          <div
            className={`flex items-center gap-3 rounded-xl border bg-background px-4 py-3.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10 ${
              nameError ? "border-destructive/70 focus-within:border-destructive focus-within:ring-destructive/10" : "border-border"
            }`}
          >
            <User className={`h-4 w-4 shrink-0 ${nameError ? "text-destructive" : "text-muted-foreground"}`} />
            <input
              id="name"
              type="text"
              placeholder={locale === "ar" ? "محمد أحمد" : "John Doe"}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); setGeneralError(""); }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              dir={isRtl ? "rtl" : "ltr"}
              autoComplete="name"
              autoFocus
            />
          </div>
          {nameError && (
            <p className="px-1 text-xs text-destructive animate-fade-in">{nameError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            {locale === "ar" ? "رقم الجوال (واتساب)" : "Phone Number (WhatsApp)"}
          </label>
          <div
            className={`flex items-center gap-3 rounded-xl border-2 bg-background px-4 py-3.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
              phoneError ? "border-destructive/70 focus-within:border-destructive focus-within:ring-destructive/20" : "border-border"
            }`}
          >
            <Phone className={`h-4 w-4 shrink-0 ${phoneError ? "text-destructive" : "text-muted-foreground"}`} />
            <input
              id="phone"
              type="tel"
              placeholder="01X XXX XXXX"
              value={phone}
              onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneError(""); setGeneralError(""); }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              dir="ltr"
              autoComplete="tel"
            />
          </div>
          {phoneError && (
            <p className="px-1 text-xs text-destructive animate-fade-in">{phoneError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {dict.common.loading}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              {locale === "ar" ? "احجز مكانك" : "Book Now"}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${isRtl ? "rotate-180 group-hover:-translate-x-0.5" : ""}`} />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
