import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/shared/header";
import { LandingQueueStatus } from "@/components/landing/queue-status";
import {
  Scissors,
  ArrowRight,
  Sparkles,
  Timer,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Zap,
  HeartHandshake,
  Quote,
} from "lucide-react";

const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] as const;

const features = [
  { icon: Star, ar: "أفضل الحلاقين المحترفين", en: "Professional Barbers" },
  { icon: Shield, ar: "أدوات معقمة وبيئة نظيفة", en: "Sterile Tools & Clean Environment" },
  { icon: Zap, ar: "خدمة سريعة بدون انتظار طويل", en: "Fast Service, Minimal Wait" },
  { icon: HeartHandshake, ar: "ضمان الرضا التام عن الخدمة", en: "100% Satisfaction Guaranteed" },
];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";
  const supabase = await createServerSupabase();

  const { data: shop } = await (supabase.from("shops") as any).select("*").limit(1).maybeSingle();
  const { data: services } = await (supabase.from("services") as any)
    .select("*")
    .order("sort_order", { ascending: true });

  const serviceList = (services as any[]) || [];

  const hours: Record<string, { open: string; close: string }> =
    typeof shop?.working_hours === "object" ? shop.working_hours : {};

  const dayNames: Record<string, string> = {
    saturday: isRtl ? "السبت" : "Saturday",
    sunday: isRtl ? "الأحد" : "Sunday",
    monday: isRtl ? "الإثنين" : "Monday",
    tuesday: isRtl ? "الثلاثاء" : "Tuesday",
    wednesday: isRtl ? "الأربعاء" : "Wednesday",
    thursday: isRtl ? "الخميس" : "Thursday",
    friday: isRtl ? "الجمعة" : "Friday",
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <Header locale={locale} dict={dict} />

      {/* ═══ HERO ═══ */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_60%)] opacity-[0.08]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--accent)_0%,transparent_50%)] opacity-[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_110%)]" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30 ring-[6px] ring-background [animation:bounce-in_0.6s_ease-out]">
            <Scissors className="h-9 w-9 sm:h-10 sm:w-10 text-white" />
          </div>

          <h1 className="[animation:slide-up_0.5s_ease-out] bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            {shop?.name || dict.site.title}
          </h1>

          <p
            className="mx-auto mt-4 max-w-lg text-base sm:text-lg text-muted-foreground [animation:slide-up_0.5s_ease-out_0.1s_both]"
          >
            {isRtl
              ? "أفضل مكان للحصول على إطلالتك المثالية. حلاقة عصرية، عناية باللحية، وخدمة راقية"
              : "The best place for your perfect look. Modern haircuts, beard grooming, and premium service."}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row [animation:slide-up_0.5s_ease-out_0.2s_both]">
            <Link
              href={`/${locale}/join`}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles className="h-5 w-5" />
              {dict.customer.getTicket}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Link>
          </div>
        </div>

        {/* Live queue status */}
        {shop && (
          <div className="relative mt-12 w-full max-w-lg px-4 [animation:slide-up_0.5s_ease-out_0.3s_both]">
            <LandingQueueStatus shopId={shop.id} avgServiceTime={shop.avg_service_time || 20} locale={locale} dict={dict} />
          </div>
        )}
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="relative border-t border-border px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
              <Sparkles className="h-6 w-6 text-primary" />
              {isRtl ? "لماذا تختارنا؟" : "Why Choose Us?"}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card/80 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-md [animation:slide-up_0.4s_ease-out_0.1s_both]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">{isRtl ? f.ar : f.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      {serviceList.length > 0 && (
        <section className="relative border-t border-border px-4 py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--accent)_0%,transparent_60%)] opacity-[0.03]" />
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
                <Scissors className="h-6 w-6 text-primary" />
                {isRtl ? "خدماتنا" : "Our Services"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isRtl ? "اختر الخدمة التي تناسبك" : "Choose the service that suits you"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {serviceList.map((svc: any, i: number) => (
                <div
                  key={svc.id}
                  className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md [animation:slide-up_0.4s_ease-out]"
                  style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-sm group-hover:scale-110 transition-transform">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{svc.name}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Timer className="h-3.5 w-3.5" />
                          <span>{svc.duration_minutes} {isRtl ? "دقيقة" : "min"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold text-primary">{svc.duration_minutes}</p>
                      <p className="text-[10px] text-muted-foreground">{isRtl ? "دقيقة" : "min"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ WORKING HOURS ═══ */}
      {Object.keys(hours).length > 0 && (
        <section className="relative border-t border-border px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isRtl ? "ساعات العمل" : "Working Hours"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRtl ? "تفضّل بزيارتنا في الأوقات التالية" : "Visit us during the following hours"}
            </p>

            <div className="mt-8 space-y-2">
              {DAYS.map((day, i) => {
                const h = hours[day];
                const label = dayNames[day] || day;
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-5 py-3 backdrop-blur-sm [animation:slide-up_0.3s_ease-out]"
                    style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "backwards" }}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">
                      {h ? `${h.open} – ${h.close}` : isRtl ? "مغلق" : "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONTACT ═══ */}
      <section className="relative border-t border-border px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isRtl ? "تواصل معنا" : "Contact Us"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRtl ? "نحن هنا لخدمتك" : "We're here to serve you"}
          </p>

          <div className="mt-8 space-y-3">
            <a
              href="https://wa.me/201094022327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card/50 px-5 py-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 group-hover:scale-110 transition-transform">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm font-medium">+20 109 402 2327</span>
              <span className="text-xs text-muted-foreground">({isRtl ? "واتساب" : "WhatsApp"})</span>
            </a>
            <a
              href="tel:+201094022327"
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card/50 px-5 py-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">+20 109 402 2327</span>
              <span className="text-xs text-muted-foreground">({isRtl ? "اتصال" : "Call"})</span>
            </a>
            <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card/50 px-5 py-4 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">
                📍 {isRtl ? "الناصرية" : "Naseriya"}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href={`/${locale}/join`}
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Sparkles className="h-5 w-5" />
              {dict.customer.getTicket}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <p className="font-bold text-foreground">{shop?.name || dict.site.title}</p>
          <p className="mt-1">+20 109 402 2327</p>
          <p className="mt-4 text-xs">&copy; {new Date().getFullYear()} {dict.site.title}. {isRtl ? "جميع الحقوق محفوظة" : "All rights reserved"}</p>
        </div>
      </footer>
    </div>
  );
}
