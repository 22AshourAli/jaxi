"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as Toast from "@radix-ui/react-toast";
import { CheckCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastData = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ show }}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}

        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className="animate-slide-up fixed bottom-4 right-4 z-[100] flex w-80 items-center gap-3 rounded-xl border bg-card p-4 shadow-xl data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[200%] data-[swipe=end]:opacity-0"
            style={{ animationFillMode: "backwards" }}
          >
            {toast.type === "success" && <CheckCircle className="h-5 w-5 shrink-0 text-success" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />}
            {toast.type === "info" && <AlertCircle className="h-5 w-5 shrink-0 text-primary" />}
            <Toast.Description className="flex-1 text-sm">{toast.message}</Toast.Description>
            <Toast.Close onClick={() => remove(toast.id)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Toast.Close>
          </Toast.Root>
        ))}

        <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
