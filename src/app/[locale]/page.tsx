import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/shared/header";
import { Logo } from "@/components/shared/logo";
import { LandingQueueStatus } from "@/components/landing/queue-status";
import { InstallPWA } from "@/components/shared/install-pwa";
import { VideoModal } from "@/components/home/video-modal";
import {
  Scissors,
  ArrowRight,
  Sparkles,
  Timer,
  Phone,
  MapPin,
  Star,
  Shield,
  Zap,
  HeartHandshake,
  Award,
  Wind,
  UserCheck,
} from "lucide-react";

const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] as const;

const features = [
  { icon: Star, ar: "أفضل الحلاقين المحترفين", en: "Professional Barbers" },
  { icon: Shield, ar: "أدوات معقمة وبيئة نظيفة", en: "Sterile Tools & Clean Environment" },
  { icon: Zap, ar: "خدمة سريعة بدون انتظار طويل", en: "Fast Service, Minimal Wait" },
  { icon: HeartHandshake, ar: "ضمان الرضا التام عن الخدمة", en: "100% Satisfaction Guaranteed" },
];

const serviceIcons: Record<string, string> = {
  "حلاقة شعر": "✂️",
  "حلاقة دقن": "🪒",
  "حلاقة شعر + دقن": "💈",
  "استشوار ومكواة": "💨",
  "صبغ شعر": "🎨",
  "غسيل وجه": "🧼",
  "عناية كاملة (شعر + دقن + غسيل)": "⭐",
};

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";
  const supabase = await createServerSupabase();

  const { data: shop } = await (supabase.from("shops") as any).select("*").limit(1).maybeSingle();
  const { data: services } = await (supabase.from("services") as any)
    .select("*")
    .eq("is_active", true)
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
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4">
        {/* Animated gradient background (always loads, no external dependency) */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)_0%,transparent_60%)] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_120%,var(--accent)_0%,transparent_60%)] opacity-20" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_110%)]" />

        {/* Animated floating orbs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDuration: "8s" }} />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "-3s", animationDuration: "10s" }} />

        {/* Scissors decorative element */}
        <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 opacity-[0.03] text-[200px] select-none">
          ✂️
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Animated entrance */}
          <div className="mx-auto mb-6 [animation:bounce-in_0.7s_ease-out]">
            <Logo size="xl" />
          </div>

          <p className="mx-auto mt-2 max-w-xl text-base sm:text-lg text-foreground/80 [animation:slide-up_0.6s_ease-out_0.15s_both] leading-relaxed">
            {isRtl
              ? "أفضل مكان للحصول على إطلالتك المثالية. حلاقة عصرية، عناية باللحية، وخدمة راقية"
              : "The best place for your perfect look. Modern haircuts, beard grooming, and premium service."}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row [animation:slide-up_0.6s_ease-out_0.25s_both]">
            <Link
              href={`/${locale}/join`}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] btn-shine"
            >
              <Sparkles className="h-5 w-5" />
              {dict.customer.getTicket}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Link>
          </div>
        </div>

        {shop && (
          <div className="relative mt-14 w-full max-w-lg px-4 [animation:slide-up_0.6s_ease-out_0.35s_both]">
            <LandingQueueStatus shopId={shop.id} avgServiceTime={shop.avg_service_time || 20} locale={locale} dict={dict} />
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex h-10 w-6 items-start justify-center rounded-full border border-border p-1">
            <div className="h-2 w-1 rounded-full bg-muted-foreground/50 animate-float" />
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section data-animate className="relative border-t border-border px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
              <Sparkles className="h-6 w-6 text-primary" />
              {isRtl ? "لماذا تختارنا؟" : "Why Choose Us?"}
            </h2>
          </div>
          <div data-animate-grid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={i}
                data-animate-item
                className="group rounded-xl border border-border bg-card/80 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-md"
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
        <section data-animate className="relative border-t border-border px-4 py-16 sm:py-20">
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

            <div data-animate-grid className="grid gap-3 sm:grid-cols-2">
              {serviceList.map((svc: any, i: number) => (
                <div
                  key={svc.id}
                  data-animate-item
                  className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-sm group-hover:scale-110 transition-transform text-lg">
                        {serviceIcons[svc.name] || "✂️"}
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

      {/* ═══ GALLERY ═══ */}
      <section data-animate className="relative border-t border-border px-4 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center" data-animate>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isRtl ? "معرض الصور" : "Gallery"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRtl ? "جودة واهتمام بالتفاصيل" : "Quality and attention to detail"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" data-animate-grid>
            {[
              { label: isRtl ? "حلاقة عصرية" : "Modern Haircut", src: "/api/static/images/haircut.jpg" },
              { label: isRtl ? "عناية باللحية" : "Beard Care", src: "/api/static/images/beard.jpg" },
              { label: isRtl ? "بيئة نظيفة" : "Clean Environment", src: "/api/static/images/clean.jpg" },
              { label: isRtl ? "استشوار احترافي" : "Professional Styling", src: "/api/static/images/blow-dry.jpg" },
            ].map((item, i) => (
              <div
                key={i}
                data-animate-item
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-background to-primary/5">
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-semibold text-sm sm:text-base text-white drop-shadow-lg">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LUXURY & CLEANLINESS ═══ */}
      <section data-animate className="relative border-t border-border px-4 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,var(--accent)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center" data-animate>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isRtl ? "فخامة ونظافة عالمية" : "Luxury & World-Class Cleanliness"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              {isRtl
                ? "نقدم لك تجربة حلاقة راقية في بيئة نظيفة ومعقمة بأعلى المعايير العالمية"
                : "Experience premium grooming in a pristine, sterile environment meeting the highest standards"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-animate-grid>
            {[
              {
                icon: Shield,
                title: isRtl ? "أدوات معقمة" : "Sterile Tools",
                desc: isRtl ? "جميع الأدوات معقمة ومعبأة بشكل فردي لكل عميل" : "All tools sterilized and individually packaged for each client",
                gradient: "from-primary/10 to-accent/10",
              },
              {
                icon: Wind,
                title: isRtl ? "تهوية متطورة" : "Advanced Ventilation",
                desc: isRtl ? "نظام تهوية متطور يضمن هواء نقي طوال الوقت" : "Advanced ventilation system ensuring fresh air at all times",
                gradient: "from-accent/10 to-primary/10",
              },
              {
                icon: Award,
                title: isRtl ? "منتجات فاخرة" : "Premium Products",
                desc: isRtl ? "نستخدم أفضل منتجات العناية بالشعر والبشرة العالمية" : "We use the best international hair and skin care products",
                gradient: "from-primary/10 to-accent/10",
              },
              {
                icon: UserCheck,
                title: isRtl ? "حلاقين محترفين" : "Professional Barbers",
                desc: isRtl ? "فريق من الحلاقين المحترفين بخبرة سنوات في المجال" : "A team of professional barbers with years of experience",
                gradient: "from-accent/10 to-primary/10",
              },
              {
                icon: Sparkles,
                title: isRtl ? "نظافة فائقة" : "Ultimate Cleanliness",
                desc: isRtl ? "تعقيم شامل بين كل عميل وآخر لضمان سلامتك" : "Complete sterilization between each client for your safety",
                gradient: "from-primary/10 to-accent/10",
              },
              {
                icon: Star,
                title: isRtl ? "خدمة متميزة" : "Premium Service",
                desc: isRtl ? "نقدم مشروبات ترحيبية وأجواء مريحة أثناء الانتظار" : "Welcome drinks and a relaxing atmosphere while you wait",
                gradient: "from-accent/10 to-primary/10",
              },
            ].map((item, i) => (
              <div
                key={i}
                data-animate-item
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-sm mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VIDEO SECTION ═══ */}
      <section data-animate className="relative border-t border-border px-4 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="mx-auto max-w-4xl text-center">
          <div data-animate>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isRtl ? "جولة في المحل" : "Tour Our Shop"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              {isRtl
                ? "شاهد بنفسك جودة الخدمات والأجواء الفاخرة في صالون جاكسي"
                : "See for yourself the quality and luxury atmosphere at Jaxi salon"}
            </p>
          </div>

          <div data-animate>
            <VideoModal isRtl={isRtl} />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative border-t border-border px-4 py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center" data-animate-grid>
            {[
              { count: 5, label: isRtl ? "سنوات خبرة" : "Years Experience", icon: "⭐" },
              { count: 1500, label: isRtl ? "عميل سعيد" : "Happy Clients", icon: "😊" },
              { count: 25, label: isRtl ? "خدمة احترافية" : "Services", icon: "✂️" },
              { count: 100, label: isRtl ? "رضا مضمون" : "Satisfaction %", icon: "💯", suffix: "%" },
            ].map((stat, i) => (
              <div
                key={i}
                data-animate-item
                className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8 backdrop-blur-sm shadow-sm"
              >
                <span className="text-2xl sm:text-3xl mb-2 block">{stat.icon}</span>
                <p className="text-3xl sm:text-4xl font-bold text-primary" data-count-to={stat.count}>{stat.count}{stat.suffix || ""}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKING HOURS ═══ */}
      {Object.keys(hours).length > 0 && (
        <section data-animate className="relative border-t border-border px-4 py-16 sm:py-20">
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
                    className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-5 py-3 backdrop-blur-sm"
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
      <section data-animate className="relative border-t border-border px-4 py-16 sm:py-20">
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
              <span className="text-sm font-medium" dir="ltr">010 940 22327</span>
              <span className="text-xs text-muted-foreground">({isRtl ? "واتساب" : "WhatsApp"})</span>
            </a>
            <a
              href="tel:+201094022327"
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card/50 px-5 py-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium" dir="ltr">010 940 22327</span>
              <span className="text-xs text-muted-foreground">({isRtl ? "اتصال" : "Call"})</span>
            </a>
            <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card/50 px-5 py-4 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">
                {isRtl ? "الناصرية" : "Naseriya"}
              </span>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href={`/${locale}/join`}
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] btn-shine"
            >
              <Sparkles className="h-5 w-5" />
              {dict.customer.getTicket}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border py-12 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-5">
            <Logo size="md" />
          </div>
          <p className="mt-1" dir="ltr">010 940 22327</p>
          <p className="mt-4 text-xs">&copy; {new Date().getFullYear()} {shop?.name || dict.site.title}. {isRtl ? "جميع الحقوق محفوظة" : "All rights reserved"}</p>
        </div>
      </footer>

      <InstallPWA locale={locale} />
    </div>
  );
}
