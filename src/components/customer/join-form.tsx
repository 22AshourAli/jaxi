"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNotification } from "@/hooks/use-notification";
import { useToast } from "@/components/shared/toast";
import { Logo } from "@/components/shared/logo";
import { formatPhoneDisplay, whatsappLink } from "@/lib/phone";
import { encodeCustomerName } from "@/lib/booking";
import { serverCancelBooking } from "@/actions/queue";
import confetti from "canvas-confetti";
import {
  Loader2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Bell,
  BellOff,
  Users,
  Clock,
  PartyPopper,
  XCircle,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

type Props = { locale: string; dict: any };

type QueueEntry = {
  id: string;
  ticket_number: number;
  status: string;
};

const LS_KEY = "jaxi_active_ticket";

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
  const [whatsappClicked, setWhatsappClicked] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Map<string, any>>(new Map());
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedServiceNames, setSelectedServiceNames] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const turnNotified = useRef(false);
  const nearNotified = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const NOTIFY_LS_KEY = "jaxi_notify_enabled";

  // Fetch services on mount
  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) {
          const arr = data as any[];
          setServices(arr);
          const m = new Map<string, any>();
          arr.forEach((s) => m.set(s.id, s));
          setServicesMap(m);
        }
      });
  }, []);

  // Recover from localStorage on mount
  useEffect(() => {
    // Restore notification preference
    try {
      const savedNotify = localStorage.getItem(NOTIFY_LS_KEY);
      if (savedNotify === "true") {
        setBrowserNotifyEnabled(true);
      }
    } catch {}

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
            setSelectedServiceNames(data.selectedServiceNames || "");
      setSubmitted(true);
      // Celebrate!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        startVelocity: 30,
        colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
      });
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
        JSON.stringify({ entryId, shopId, ticketNumber, shopName, avgServiceTime, phone, name, selectedServiceNames })
      );
    }
    if (cancelled || completed) {
      localStorage.removeItem(LS_KEY);
    }
  }, [submitted, entryId, ticketNumber, shopId, shopName, avgServiceTime, phone, name, selectedServiceNames, cancelled, completed]);

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

    // Polling fallback every 15s in case Realtime drops
    pollingRef.current = setInterval(fetchLiveData, 15000);

    // Auto-request notification permission
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
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
    if (selectedServices.length === 0) {
      setServiceError(locale === "ar" ? "اختر خدمة واحدة على الأقل" : "Select at least one service");
    } else {
      setServiceError("");
    }
    if (nErr || pErr || selectedServices.length === 0) return;

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
      const names = selectedServices.map((id) => servicesMap.get(id)?.name || "").filter(Boolean);
      setSelectedServiceNames(names.join(locale === "ar" ? " + " : " + "));

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

      const customer_name = encodeCustomerName(name.trim(), selectedServices);
      const insertData: any = {
        shop_id: shop.id,
        service_id: selectedServices[0],
        ticket_number: nextNumber,
        customer_name,
        customer_phone: phone.replace(/\D/g, ""),
        status: "waiting",
      };
      if (selectedServices.length > 1) {
        insertData.service_ids = selectedServices.join(",");
      }

      let { data: entry, error: insertErr } = await (supabase.from("queue_entries") as any)
        .insert(insertData)
        .select()
        .single();

      // If service_ids column doesn't exist, retry without it
      if (insertErr?.message?.includes?.("service_ids")) {
        const retry = await (supabase.from("queue_entries") as any)
          .insert({
            shop_id: shop.id,
            service_id: selectedServices[0],
            ticket_number: nextNumber,
            customer_name,
            customer_phone: phone.replace(/\D/g, ""),
            status: "waiting",
          })
          .select()
          .single();
        entry = retry.data;
        insertErr = retry.error;
      }

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
    try { localStorage.setItem(NOTIFY_LS_KEY, next ? "true" : "false"); } catch {}
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
    setShowCancelConfirm(false);
    setCancelling(false);
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
          <div className="mx-auto mb-3">
            <Logo size="md" showText={false} />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{dict.customer.yourNumber}</p>
          <p className="mt-1 text-6xl font-bold tracking-tight text-primary">#{ticketNumber}</p>
          {selectedServiceNames && (
            <p className="mt-1.5 text-sm font-medium text-primary/70">{selectedServiceNames}</p>
          )}
        </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
          {!browserNotifyEnabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 shrink-0" />
              {locale === "ar"
                ? "فعّل الإشعارات عشان ننبّهك لما يجي دورك"
                : "Enable notifications so we alert you when it's your turn"}
            </div>
          )}
          <button
            onClick={handleToggleBrowserNotify}
            className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all active:scale-[0.98] ${
              browserNotifyEnabled
                ? "border-primary/30 bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.02]"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              {browserNotifyEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              {browserNotifyEnabled
                ? (locale === "ar" ? "🔔 الإشعارات مفعّلة" : "🔔 Notifications On")
                : (locale === "ar" ? "تفعيل الإشعارات" : "Enable Notifications")}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                browserNotifyEnabled
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {browserNotifyEnabled
                ? locale === "ar" ? "مفعل" : "On"
                : locale === "ar" ? "تشغيل" : "Enable"}
            </span>
          </button>
        </div>

        <a
          href={whatsappLink(
            phone,
            locale === "ar"
              ? `مرحباً جاكسي 👋\n\nرقم دوري: #${ticketNumber}\nالأشخاص قبلي: ${peopleAhead}\n\nأريد متابعة دوري عبر واتساب`
              : `Hi Jaxi 👋\n\nMy turn: #${ticketNumber}\nPeople ahead: ${peopleAhead}\n\nI want to track my turn via WhatsApp`
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setWhatsappClicked(true)}
          className={`flex w-full items-center justify-between rounded-xl border p-3.5 transition-all ${
            whatsappClicked
              ? "border-success/30 bg-success/5"
              : "border-border bg-card hover:border-success/20 hover:bg-success/[0.02]"
          }`}
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            {locale === "ar" ? "متابعة عبر واتساب" : "Track via WhatsApp"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            {whatsappClicked ? (locale === "ar" ? "تم الفتح" : "Opened") : (
              <>
                <ExternalLink className="h-3 w-3" />
                {locale === "ar" ? "فتح" : "Open"}
              </>
            )}
          </span>
        </a>

        {/* Cancel booking */}
        <div className="border-t border-border pt-4 mt-2">
          {showCancelConfirm ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 animate-slide-up">
              <p className="text-xs font-medium text-destructive text-center">
                {locale === "ar"
                  ? "هل أنت متأكد من إلغاء الحجز؟"
                  : "Are you sure you want to cancel?"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCancelConfirm(false); setCancelling(false); }}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted active:scale-95"
                >
                  {locale === "ar" ? "تراجع" : "Go back"}
                </button>
                <button
                  onClick={async () => {
                    setCancelling(true);
                    if (entryId) await serverCancelBooking(entryId);
                    setCancelled(true);
                  }}
                  disabled={cancelling}
                  className="flex-1 rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {cancelling
                    ? (locale === "ar" ? "جاري الإلغاء..." : "Cancelling...")
                    : (locale === "ar" ? "تأكيد الإلغاء" : "Confirm cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 py-3 text-xs font-medium text-destructive/70 transition hover:bg-destructive/5 hover:text-destructive active:scale-95"
            >
              <XCircle className="h-4 w-4" />
              {locale === "ar" ? "إلغاء الحجز" : "Cancel booking"}
            </button>
          )}
        </div>


      </div>
    );
  }

  // ── FORM ──
  return (
    <div className="w-full max-w-md mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push(`/${locale}`)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowRight className={`h-3 w-3 ${isRtl ? "rotate-180" : ""}`} />
          {locale === "ar" ? "الرئيسية" : "Home"}
        </button>
      </div>
      <div className="text-center mb-6 animate-fade-in">
        <div className="mx-auto mb-4 w-fit">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "احجز دورك" : "Book Your Turn"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "ar" ? "اختر الخدمة وسجل بياناتك" : "Pick a service and enter your details"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
        {generalError && (
          <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-shake">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{generalError}</span>
          </div>
        )}

        {/* Service selection - dropdown */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground/80">
            {locale === "ar" ? "اختر الخدمات" : "Services"}
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              className={`w-full flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm transition-all ${
                  selectedServices.length > 0 ? "border-primary/50" : "border-border"
                }`}
              >
                <span className="flex-1 min-w-0 truncate">
                  {selectedServices.length === 0
                    ? (locale === "ar" ? "اختر..." : "Select...")
                    : selectedServices.map((id) => servicesMap.get(id)?.name || "").join(", ")
                  }
                </span>
              {selectedServices.length > 0 && (
                <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {services.filter((s) => selectedServices.includes(s.id)).reduce((t, s) => t + s.duration_minutes, 0)} {locale === "ar" ? "د" : "min"}
                </span>
              )}
              <svg className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${showServiceDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showServiceDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowServiceDropdown(false)} />
                <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-xl overflow-y-auto max-h-60 animate-slide-up">
                  {services.map((svc) => {
                    const isSelected = selectedServices.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          setSelectedServices((prev) =>
                            prev.includes(svc.id) ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                          );
                          setServiceError("");
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-muted ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <span className="text-base">{getServiceIcon(svc.name)}</span>
                        <span className="flex-1 min-w-0 truncate">{svc.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{svc.duration_minutes}{locale === "ar" ? "د" : "m"}</span>
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {serviceError && <p className="px-1 text-xs text-destructive font-medium">{serviceError}</p>}
        </div>

        {/* Name & Phone */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-foreground/80">
              {locale === "ar" ? "الاسم" : "Name"}
            </label>
            <input
              id="name"
              type="text"
              placeholder={locale === "ar" ? "محمد أحمد" : "John Doe"}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); setGeneralError(""); }}
              className={`w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:ring-2 ${
                nameError
                  ? "border-destructive/50 focus:border-destructive focus:ring-destructive/10"
                  : "border-border focus:border-primary focus:ring-primary/10"
              }`}
              dir={isRtl ? "rtl" : "ltr"}
              autoComplete="name"
              autoFocus
            />
            {nameError && <p className="px-1 text-xs text-destructive font-medium">{nameError}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-foreground/80">
              {locale === "ar" ? "رقم الجوال" : "Phone Number"}
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="01X XXX XXXX"
              value={phone}
              onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneError(""); setGeneralError(""); }}
              className={`w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/40 tracking-wider focus:ring-2 ${
                phoneError
                  ? "border-destructive/50 focus:border-destructive focus:ring-destructive/10"
                  : "border-border focus:border-primary focus:ring-primary/10"
              }`}
              dir="ltr"
              autoComplete="tel"
            />
            {phoneError && <p className="px-1 text-xs text-destructive font-medium">{phoneError}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-shine group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              {dict.common.loading}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2.5">
              {dict.customer.getTicket}
              <ArrowRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

function getServiceIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("شعر") && n.includes("دقن")) return "💈";
  if (n.includes("شعر") || n.includes("hair")) return "✂️";
  if (n.includes("دقن") || n.includes("beard") || n.includes("لحية")) return "🪒";
  if (n.includes("استشوار") || n.includes("مكوا") || n.includes("blow")) return "💨";
  if (n.includes("صبغ") || n.includes("color") || n.includes("لون")) return "🎨";
  if (n.includes("غسيل") || n.includes("face") || n.includes("wash")) return "🧼";
  if (n.includes("عناية") || n.includes("complete") || n.includes("package")) return "⭐";
  return "✂️";
}
