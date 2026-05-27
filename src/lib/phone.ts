export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  let formatted: string;
  if (digits.length === 11) {
    formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 10) {
    formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else {
    formatted = digits;
  }
  // LRM forces left-to-right rendering in RTL context
  return `\u200E${formatted}\u200E`;
}

export function phoneLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+2${digits}`;
}

export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/2${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
