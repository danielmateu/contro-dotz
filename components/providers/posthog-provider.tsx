'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useState } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const initPostHog = () => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: true,
          loaded: (ph) => {
            if (process.env.NODE_ENV === 'development') {
              ph.opt_out_capturing()
            }
          },
        })
        setInitialized(true)
      }

      // Posponer PostHog hasta que la CPU finalice la carga de la página
      if ('requestIdleCallback' in window) {
        const handle = (window as any).requestIdleCallback(initPostHog, { timeout: 3000 })
        return () => {
          if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(handle)
        }
      } else {
        const timer = setTimeout(initPostHog, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !initialized) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}
