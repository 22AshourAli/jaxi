import { formatPhoneDisplay } from "@/lib/phone";

export function PhoneDisplay({ phone, className = "" }: { phone: string; className?: string }) {
  return (
    <span
      dir="ltr"
      className={className}
      style={{ unicodeBidi: "isolate", direction: "ltr" }}
    >
      {formatPhoneDisplay(phone)}
    </span>
  );
}
