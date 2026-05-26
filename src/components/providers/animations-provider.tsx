"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function AnimationsProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reveal sections on scroll
    const sections = el.querySelectorAll<HTMLElement>("section");
    sections.forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 85%",
        onEnter: () => {
          gsap.fromTo(
            section.querySelectorAll<HTMLElement>("[data-animate]"),
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
          );
        },
        once: true,
      });
    });

    // Stagger cards on scroll
    const grids = el.querySelectorAll<HTMLElement>("[data-animate-grid]");
    grids.forEach((grid) => {
      const items = grid.querySelectorAll<HTMLElement>("[data-animate-item]");
      if (items.length) {
        ScrollTrigger.create({
          trigger: grid,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              items,
              { y: 30, opacity: 0, scale: 0.95 },
              { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(1.4)" }
            );
          },
          once: true,
        });
      }
    });

    // Number counters
    const counters = el.querySelectorAll<HTMLElement>("[data-count-to]");
    counters.forEach((counter) => {
      const target = parseInt(counter.dataset.countTo || "0", 10);
      ScrollTrigger.create({
        trigger: counter,
        start: "top 90%",
        onEnter: () => {
          gsap.fromTo(
            counter,
            { textContent: 0 },
            {
              textContent: target,
              duration: 1.5,
              ease: "power2.out",
              snap: { textContent: 1 },
              onUpdate: () => {
                const val = parseInt(counter.textContent || "0", 10);
                counter.textContent = val.toLocaleString();
              },
            }
          );
        },
        once: true,
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
