import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { isValidLocale } from "@/lib/i18n/config";

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!isValidLocale(locale)) notFound();

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

export async function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}
