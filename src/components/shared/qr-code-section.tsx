"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type Props = {
  locale: string;
  dict: any;
};

export function QRCodeSection({ locale, dict }: Props) {
  const { theme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const demoUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/${locale}/queue/demo`;

  if (!mounted) return <div className="h-48 w-48 animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-xl border border-border bg-card p-6">
        <QRCodeSVG
          value={demoUrl}
          size={180}
          fgColor={theme === "dark" ? "#ffffff" : "#0a0a0a"}
          bgColor="transparent"
          level="M"
        />
      </div>
      <p className="text-sm text-muted-foreground">{dict.customer.scanTitle}</p>
    </div>
  );
}
