import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/shared/header";
import { QRCodeSVG } from "qrcode.react";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";
  const supabase = await createServerSupabase();

  const { data: shops } = await supabase
    .from("shops")
    .select("*")
    .order("name");

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <Header locale={locale} dict={dict} />
      <main className="flex flex-1 flex-col items-center gap-8 p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{dict.site.title}</h1>
          <p className="text-lg text-muted-foreground">{dict.site.tagline}</p>
        </div>

        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
          {shops?.map((shop: { id: string; name: string; phone: string }) => (
            <Link
              key={shop.id}
              href={`/${locale}/queue/${shop.id}`}
              className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary/50 hover:shadow-sm"
            >
              <h2 className="text-xl font-bold">{shop.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {shop.phone}
              </p>
              <div className="mt-4 flex items-center justify-center">
                <QRCodeSVG
                  value={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/${locale}/queue/${shop.id}`}
                  size={120}
                  level="M"
                />
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {dict.customer.scanTitle}
              </p>
            </Link>
          ))}
        </div>

        <Link
          href={`/${locale}/dashboard`}
          className="rounded-lg border border-border bg-card px-8 py-3 text-sm font-medium transition hover:bg-muted"
        >
          {dict.dashboard.dashboard}
        </Link>
      </main>
    </div>
  );
}
