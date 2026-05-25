import { useEffect, useState, startTransition } from "react";

const cache: Record<string, any> = {};

export function useDictionary(locale: string): any {
  const [dict, setDict] = useState<any>({});

  useEffect(() => {
    if (cache[locale]) {
      startTransition(() => setDict(cache[locale]));
      return;
    }
    import(`../../messages/${locale}.json`).then((mod) => {
      cache[locale] = mod.default;
      startTransition(() => setDict(mod.default));
    });
  }, [locale]);

  return dict;
}
