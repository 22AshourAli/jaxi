"use client";

import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VideoModalProps {
  isRtl: boolean;
}

export function VideoModal({ isRtl }: VideoModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => setOpen(false);
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex aspect-video w-full items-center justify-center rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/5 to-accent/5 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <Play className="h-7 w-7 sm:h-9 sm:w-9 text-primary fill-primary ml-0.5" />
          </div>
          <p className="text-sm font-medium text-foreground/80">
            {isRtl ? "شاهد الفيديو" : "Watch Video"}
          </p>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />
      </button>

      <dialog
        ref={dialogRef}
        className="backdrop:bg-black/80 bg-transparent p-0 max-w-4xl w-[90vw] rounded-2xl overflow-hidden border border-border open:animate-in fade-in-0 zoom-in-95"
        onClick={(e) => { if (e.target === dialogRef.current) setOpen(false); }}
      >
        <div className="relative bg-card">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            <video
              controls
              autoPlay
              className="h-full w-full"
              poster="/api/static/images/haircut.jpg"
            >
              <source src="/api/static/videos/shop-tour.mp4" type="video/mp4" />
              {isRtl ? "المتصفح لا يدعم تشغيل الفيديو" : "Your browser does not support the video tag"}
            </video>
          </div>
        </div>
      </dialog>
    </>
  );
}
