"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type State = "idle" | "copied" | "failed";

const LABEL: Record<State, string> = {
  idle: "Copy address",
  copied: "Copied",
  failed: "Press ⌘C / Ctrl+C",
};

export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="btn min-w-[11.5rem] justify-center overflow-hidden"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={state}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          className="inline-block"
        >
          {LABEL[state]}
        </m.span>
      </AnimatePresence>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied"
          ? `${email} copied to clipboard`
          : state === "failed"
            ? "Copy failed. Select the address to copy it."
            : ""}
      </span>
    </button>
  );
}
