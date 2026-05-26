import Link from "next/link";
import { cookies, headers } from "next/headers";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { Scissors } from "lucide-react";
import { Logo } from "@/components/shared/logo";

async function getLocale(): Promise<"ar" | "en"> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale === "ar" || cookieLocale === "en") return cookieLocale;

  const headersList = await headers();
  const negotiatorHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  try {
    return match(languages, [...locales], defaultLocale) as "ar" | "en";
  } catch {
    return defaultLocale;
  }
}

export default async function NotFound() {
  const locale = await getLocale();
  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_110%)]" />

      <Logo size="xl" showText={false} />

      <h1 className="text-8xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        404
      </h1>

      <div className="max-w-sm space-y-2">
        <p className="text-xl font-semibold">
          {locale === "ar" ? "الصفحة مش موجودة!" : "Page not found!"}
        </p>
        <p className="text-sm text-muted-foreground">
          {locale === "ar"
            ? "يبدو أنك ضعت في المتاهة. خلينا نرجّعك لمكانك"
            : "Looks like you got lost. Let's get you back on track"}
        </p>
      </div>

      <Link
        href={`/${locale}`}
        className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <Scissors className="h-5 w-5" />
        {locale === "ar" ? "الرجوع للرئيسية" : "Back to Home"}
      </Link>
    </div>
  );
}
