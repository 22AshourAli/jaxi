import { logger } from "@/lib/logger";

const API_VERSION = "v22.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getConfig() {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    throw new Error("WHATSAPP_API_TOKEN and WHATSAPP_PHONE_ID must be set");
  }
  return { token, phoneId };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "20" + digits.slice(1);
  if (!digits.startsWith("20")) return "20" + digits;
  return digits;
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<boolean> {
  try {
    const { token, phoneId } = getConfig();
    const normalizedTo = normalizePhone(to);

    const res = await fetch(`${BASE_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error("whatsapp.send_failed", { to: normalizedTo }, err);
      return false;
    }

    logger.info("whatsapp.sent", { to: normalizedTo });
    return true;
  } catch (err) {
    logger.error("whatsapp.send_error", { to }, err);
    return false;
  }
}

export function buildQueueNotificationMessage(
  shopName: string,
  ticketNumber: number,
  peopleAhead: number,
  estimatedMinutes: number,
  locale: "ar" | "en"
): string {
  if (locale === "ar") {
    return `مرحباً بك في ${shopName}\nرقم دورك: #${ticketNumber}\nالأشخاص قبلك: ${peopleAhead}\nالوقت المتوقع: ${estimatedMinutes} دقيقة\nشكراً لانتظارك!`;
  }
  return `Welcome to ${shopName}\nYour turn number: #${ticketNumber}\nPeople ahead: ${peopleAhead}\nEstimated wait: ${estimatedMinutes} minutes\nThank you for waiting!`;
}

export function buildTurnNotificationMessage(
  shopName: string,
  ticketNumber: number,
  locale: "ar" | "en"
): string {
  if (locale === "ar") {
    return `🔔 حان دورك رقم #${ticketNumber} في ${shopName}\nيرجى التوجه إلى المحل الآن.`;
  }
  return `🔔 It's your turn #${ticketNumber} at ${shopName}\nPlease head to the shop now.`;
}
