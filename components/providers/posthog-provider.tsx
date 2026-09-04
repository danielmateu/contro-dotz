'use client'

import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const initPostHog = async () => {
        try {
          const { default: posthog } = await import('posthog-js')
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
        } catch (err) {
          console.error('PostHog init error:', err)
        }
      }

      // Posponer PostHog hasta que la CPU finalice la carga crítica de la página
      if ('requestIdleCallback' in window) {
        const handle = (window as any).requestIdleCallback(initPostHog, { timeout: 4000 })
        return () => {
          if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(handle)
        }
      } else {
        const timer = setTimeout(initPostHog, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  return <>{children}</>
}
