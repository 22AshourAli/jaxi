export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { JoinForm } from "@/components/customer/join-form";

export default async function JoinPage({ params }: PageProps<"/[locale]/join">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_60%)] opacity-5" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--accent)_0%,transparent_60%)] opacity-5" />
      <JoinForm locale={locale} dict={dict} />
    </div>
  );
}
