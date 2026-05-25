export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { QueueEntryView } from "@/components/customer/queue-entry-view";
import { Header } from "@/components/shared/header";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function QueuePage({ params }: PageProps<"/[locale]/queue/[shopId]">) {
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

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("sort_order");

  if (!shop) notFound();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col">
      <Header locale={locale} dict={dict} />
      <main className="flex flex-1 flex-col items-center gap-6 p-4">
        <QueueEntryView
          shop={shop}
          services={services ?? []}
          locale={locale}
          dict={dict}
        />
      </main>
    </div>
  );
}
