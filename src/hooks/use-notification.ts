import { useState, useEffect, useCallback } from "react";

function getPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setPermission(getPermission());
    const handler = () => setPermission(getPermission());
    // Permission changes are rare, poll on focus
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (permission !== "granted") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: "/icons/icon-192x192.svg",
          badge: "/icons/icon-192x192.svg",
          vibrate: [100, 50, 100],
        } as unknown as NotificationOptions);
      });
    } else {
      new Notification(title, { body });
    }
  }, [permission]);

  return { permission, requestPermission, sendNotification };
}
