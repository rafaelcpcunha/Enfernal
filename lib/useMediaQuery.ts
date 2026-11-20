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
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const TOUCH_QUERY = "(pointer: coarse)";
export const PORTRAIT_QUERY = "(orientation: portrait)";
