"use client";

import { useEffect } from "react";

/**
 * Adds the `is-visible` class to every `[data-reveal]` element as it scrolls
 * into view. A single observer handles the whole page; reduced-motion users get
 * all content immediately.
 */
export function ScrollReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (elements.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    // Stagger siblings so grids cascade rather than appearing all at once.
    elements.forEach((element) => {
      const siblings = Array.from(
        element.parentElement?.children ?? [],
      ).filter((sibling) => sibling.hasAttribute("data-reveal"));
      const index = siblings.indexOf(element);

      if (index > 0) {
        element.style.setProperty(
          "--reveal-delay",
          `${Math.min(index * 70, 350)}ms`,
        );
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}
