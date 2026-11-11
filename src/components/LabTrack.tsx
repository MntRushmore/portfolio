"use client";

import { useEffect } from "react";

type Tracker = ((event: string, props?: Record<string, string | number | boolean>) => void) & { stop?: () => void };

/**
 * Counts a visit to a React page on the labs site (the index, or a "page" lab)
 * with the same tracker the HTML labs use: public/lab-files/track.js. It sends
 * a view when the page opens and the time spent when the visitor moves on.
 */
export function LabTrack({ lab }: { lab: string }) {
  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    // A tick late, so a mount that is undone straight away (React's dev double-run) sends nothing.
    const timer = setTimeout(() => {
      script = document.createElement("script");
      script.src = "/lab-files/track.js";
      script.async = true;
      script.dataset.lab = lab;
      document.head.appendChild(script);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (!script) return;
      try {
        (window as unknown as { labTrack?: Tracker }).labTrack?.stop?.();
      } catch {}
      script.remove();
    };
  }, [lab]);
  return null;
}
