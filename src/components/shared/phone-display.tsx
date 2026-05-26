import { formatPhoneDisplay } from "@/lib/phone";

export function PhoneDisplay({ phone, className = "" }: { phone: string; className?: string }) {
  return (
    <span dir="ltr" className={className}>
      {formatPhoneDisplay(phone)}
    </span>
  );
}
