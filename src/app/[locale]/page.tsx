import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { QRCodeSection } from "@/components/shared/qr-code-section";
import { Header } from "@/components/shared/header";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <Header locale={locale} dict={dict} />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{dict.site.title}</h1>
          <p className="text-lg text-muted-foreground">{dict.site.tagline}</p>
        </div>

        <QRCodeSection locale={locale} dict={dict} />

        <div className="flex gap-4">
          <Link
            href={`/${locale}/queue/demo`}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {dict.customer.scanTitle}
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className="rounded-lg border border-border bg-card px-8 py-3 text-sm font-medium transition hover:bg-muted"
          >
            {dict.dashboard.dashboard}
          </Link>
        </div>
      </main>
    </div>
  );
}
