"use server";

import { sendWhatsAppMessage, buildQueueNotificationMessage, buildTurnNotificationMessage } from "@/lib/notifications/whatsapp";
import { logger } from "@/lib/logger";

export async function sendQueueConfirmation(
  phone: string,
  shopName: string,
  ticketNumber: number,
  peopleAhead: number,
  estimatedMinutes: number,
  locale: "ar" | "en"
) {
  const message = buildQueueNotificationMessage(shopName, ticketNumber, peopleAhead, estimatedMinutes, locale);
  const sent = await sendWhatsAppMessage(phone, message);
  logger.info("notification.queue_confirmation", { phone, ticketNumber, sent });
  return sent;
}

export async function sendTurnNotification(
  phone: string,
  shopName: string,
  ticketNumber: number,
  locale: "ar" | "en"
) {
  const message = buildTurnNotificationMessage(shopName, ticketNumber, locale);
  const sent = await sendWhatsAppMessage(phone, message);
  logger.info("notification.turn_called", { phone, ticketNumber, sent });
  return sent;
}
