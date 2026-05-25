import { useSyncExternalStore } from "react";

function getSnapshot(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

export function useNotification() {
  const permission = useSyncExternalStore(
    () => () => {},
    getSnapshot,
    () => "default" as NotificationPermission
  );

  async function requestPermission() {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  function sendNotification(title: string, body: string) {
    if (permission !== "granted") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(
          title,
          { body, icon: "/icons/icon-192x192.svg", badge: "/icons/icon-192x192.svg" } as NotificationOptions
        );
      });
    } else {
      new Notification(title, { body });
    }
  }

  return { permission, requestPermission, sendNotification };
}
