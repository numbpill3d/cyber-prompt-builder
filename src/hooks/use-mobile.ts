import * as React from "react";

// ---[ MOBILE DETECTION CONSTANTS ]---
const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * useIsMobile
 * A highly robust, cross-browser React hook to detect mobile viewport.
 * Uses matchMedia for modern browsers, with window resize fallback.
 * Returns: boolean, true if device is below MOBILE_BREAKPOINT px.
 */
export function useIsMobile(): boolean {
  // Function to determine initial mobile state
  const getIsMobile = (): boolean => {
    // If server-side, always return false to avoid hydration mismatch
    if (typeof window === "undefined") return false;
    // Use matchMedia if available for real-time media query evaluation
    if ("matchMedia" in window) {
      return window.matchMedia(MOBILE_QUERY).matches;
    }
    // Fallback to direct width measurement
    return window.innerWidth < MOBILE_BREAKPOINT;
  };

  // React state to track mobile status
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile);

  React.useEffect(() => {
    // If not running in a browser environment, do nothing
    if (typeof window === "undefined") return;

    // ---[ MediaQueryList Event Handler ]---
    let mql: MediaQueryList | null = null;
    let mqlListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;
    let resizeListener: (() => void) | null = null;

    // Prefer matchMedia if supported
    if ("matchMedia" in window) {
      mql = window.matchMedia(MOBILE_QUERY);

      // Update state on media query match change
      mqlListener = (event: MediaQueryListEvent) => {
        setIsMobile(event.matches);
      };
      mql.addEventListener("change", mqlListener);

      // Set initial state
      setIsMobile(mql.matches);
    } else {
      // Legacy: Fallback to resize event
      resizeListener = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };
      window.addEventListener("resize", resizeListener);

      // Set initial state
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }

    // ---[ Cleanup on Unmount ]---
    return () => {
      if (mql && mqlListener) mql.removeEventListener("change", mqlListener);
      if (resizeListener) window.removeEventListener("resize", resizeListener);
    };
    // MOBILE_QUERY is static, so it’s safe to omit from deps
    // eslint-disable-next-line
  }, []);

  return isMobile;
}

/**
 * useMobile
 * Legacy alias for useIsMobile, returns { isMobile } object for backward compatibility
 */
export function useMobile(): { isMobile: boolean } {
  const isMobile = useIsMobile();
  return { isMobile };
}

