"use client";

import { useSyncExternalStore } from "react";

/**
 * Assina uma media query via useSyncExternalStore: sem setState em efeito,
 * sem flicker e com valor seguro no servidor (false).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      // Safari antigo (iOS < 14) só tem addListener; resize cobre atrasos do evento no iOS.
      if (mql.addEventListener) mql.addEventListener("change", cb);
      else mql.addListener(cb);
      window.addEventListener("resize", cb);
      return () => {
        if (mql.removeEventListener) mql.removeEventListener("change", cb);
        else mql.removeListener(cb);
        window.removeEventListener("resize", cb);
      };
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const TOUCH_QUERY = "(pointer: coarse)";
export const PORTRAIT_QUERY = "(orientation: portrait)";
