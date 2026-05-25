import { isAdmin } from "@/actions/admin-auth";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import SimpleLogin from "./_components/simple-login";
import { QueueManagement } from "./_components/queue-management";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const authenticated = await isAdmin();
  if (!authenticated) return <SimpleLogin locale={locale} />;

  const dict = await getDictionary(locale);
  return <QueueManagement locale={locale} dict={dict} />;
}
