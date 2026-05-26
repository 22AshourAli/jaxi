"use client";

import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [isRtl, setIsRtl] = useState(true);

  useEffect(() => {
    const lang = navigator.language || "";
    setIsRtl(lang.startsWith("ar") || location.pathname.startsWith("/ar"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {isRtl ? "أنت غير متصل" : "You're Offline"}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isRtl ? "تحقق من اتصالك بالإنترنت وحاول مرة أخرى" : "Check your internet connection and try again"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
        >
          {isRtl ? "إعادة المحاولة" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
