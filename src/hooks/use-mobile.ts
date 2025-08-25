import * as React from "react"

const MOBILE_QUERY = "(max-width: 768px)"

// Mobile detection hook
export function useMobile(): boolean {
  return useIsMobile()
import * as React from "react"

const MOBILE_QUERY = "(max-width: 768px)"

export function useIsMobile(): boolean {
  const getMatch = () =>
    typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches

  const [isMobile, setIsMobile] = React.useState(getMatch)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)

    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

export function useIsMobile(): boolean {
  const getMatch = () =>
    typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches

  const [isMobile, setIsMobile] = React.useState(getMatch)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)

    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
