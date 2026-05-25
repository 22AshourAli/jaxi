"use client";

import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useDictionary } from "@/hooks/use-dictionary";
import { QRCodeSVG } from "qrcode.react";
import { Download, Scissors } from "lucide-react";

export default function SettingsPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = useDictionary(locale);
  const isRtl = locale === "ar";
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (!dict?.dashboard) {
    return <div className="flex min-h-screen items-center justify-center p-4"><p className="text-muted-foreground">{dict?.common?.loading ?? "Loading..."}</p></div>;
  }

  const joinUrl = `${siteUrl}/${locale}/join`;

  function downloadQR(format: "png" | "svg") {
    const canvas = document.querySelector("canvas");
    if (format === "png" && canvas) {
      const link = document.createElement("a");
      link.download = "qrcode-dawrk.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      const svg = document.querySelector(".qr-code-svg svg");
      if (svg) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        const blob = new Blob([svgStr], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "qrcode-dawrk.svg";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col lg:flex-row">
      <DashboardHeader locale={locale} dict={dict} />
      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">{dict.dashboard.settings}</h1>

          <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Scissors className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-lg font-semibold">{isRtl ? "QR Code الطابور" : "Queue QR Code"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRtl
                  ? "اطبع هذا الرمز وضعه على الحائط ليدخل الزبائن"
                  : "Print this QR code and place it on the wall for customers"}
              </p>
            </div>

            <div className="my-8 flex justify-center">
              <div className="qr-code-svg rounded-2xl border-4 border-primary/20 bg-white p-6 shadow-xl">
                <QRCodeSVG value={joinUrl} size={200} level="H" includeMargin />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => downloadQR("png")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                {isRtl ? "تحميل PNG" : "Download PNG"}
              </button>
              <button
                onClick={() => downloadQR("svg")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {isRtl ? "تحميل SVG" : "Download SVG"}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {isRtl ? "الرابط:" : "URL:"} {joinUrl}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
