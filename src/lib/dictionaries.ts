import "server-only";
import type { Locale } from "./i18n/config";

const dictionaries = {
  ar: () => import("../../messages/ar.json").then((m) => m.default),
  en: () => import("../../messages/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)[Locale]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
