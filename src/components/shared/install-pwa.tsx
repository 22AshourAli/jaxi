"use client";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Download, X } from "lucide-react";
import { useState } from "react";

export function InstallPWA({ locale }: { locale: string }) {
  const { isInstallable, isInstalled, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:left-auto sm:bottom-4 sm:right-4 sm:max-w-xs animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card px-4 py-3 shadow-xl backdrop-blur-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {locale === "ar" ? "حمّل تطبيق جاكسي" : "Install Jaxi App"}
          </p>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "شغّل بدون إنترنت" : "Works offline"}
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95"
        >
          {locale === "ar" ? "تثبيت" : "Install"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
