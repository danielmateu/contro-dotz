'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import esDict from '@/messages/es.json'
import enDict from '@/messages/en.json'
import caDict from '@/messages/ca.json'

export type SupportedLocale = 'es' | 'en' | 'ca'

const dictionaries: Record<SupportedLocale, typeof esDict> = {
  es: esDict,
  en: enDict,
  ca: caDict,
}

interface I18nContextType {
  locale: SupportedLocale
  setLocale: (loc: SupportedLocale) => void
  t: (keyPath: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('es')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'))
      const saved = (match ? match[2] : localStorage.getItem('NEXT_LOCALE')) as SupportedLocale
      if (saved && (saved === 'es' || saved === 'en' || saved === 'ca')) {
        setLocaleState(saved)
      }
    }
  }, [])

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('NEXT_LOCALE', newLocale)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    }
  }

  const t = (keyPath: string): string => {
    const dict = dictionaries[locale] || dictionaries.es
    const parts = keyPath.split('.')
    let current: any = dict

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return keyPath
      }
    }

    return typeof current === 'string' ? current : keyPath
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
