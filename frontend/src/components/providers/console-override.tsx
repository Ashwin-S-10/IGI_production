"use client";

import { useEffect } from "react";

/**
 * Silences all console output on the client side.
 * Applies to both development and production.
 * Errors are still thrown and captured by server logs.
 */
export function ConsoleOverride() {
  useEffect(() => {
    // Override on client side in all environments
    if (typeof window !== "undefined") {
      const noop = () => {};
      
      // Override all console methods
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      console.warn = noop;
      console.error = noop;
    }
  }, []);

  return null;
}
