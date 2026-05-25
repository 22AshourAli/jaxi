export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { LiveQueueDisplay } from "@/components/customer/live-queue-display";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function LivePage({ params }: PageProps<"/[locale]/queue/[shopId]/live">) {
  const { locale, shopId } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";
  const supabase = await createServerSupabase();

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  if (!shop) notFound();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <LiveQueueDisplay shop={shop} locale={locale} dict={dict} />
    </div>
  );
}
