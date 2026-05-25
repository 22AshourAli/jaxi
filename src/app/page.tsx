import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { locales, defaultLocale } from "@/lib/i18n/config";

export default async function RootRedirectPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  if (cookieLocale && locales.includes(cookieLocale as any)) {
    redirect(`/${cookieLocale}`);
  }

  const headersList = await headers();
  const negotiatorHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  let locale: string;
  try {
    locale = match(languages, [...locales], defaultLocale);
  } catch {
    locale = defaultLocale;
  }

  redirect(`/${locale}`);
}
