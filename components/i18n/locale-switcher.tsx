'use client'

import { useI18n, SupportedLocale } from '@/lib/i18n/i18n-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe, Check } from 'lucide-react'

const languages: Array<{ code: SupportedLocale; label: string; flag: string }> = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ca', label: 'Català', flag: 'cat' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={`h-9 px-3 rounded-xl border-slate-700 bg-background/50 hover:bg-background text-xs font-semibold gap-2 ${className}`}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="uppercase font-bold text-foreground">{currentLang.code}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-foreground rounded-xl w-36 p-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="flex items-center justify-between text-xs font-medium cursor-pointer rounded-lg px-2.5 py-2 hover:bg-slate-800 focus:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
            {locale === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
