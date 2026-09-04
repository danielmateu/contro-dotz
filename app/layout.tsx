import { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Inter, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { I18nProvider } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toast"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Control Dotz - Control de Gastos Familiares',
    template: '%s | Control Dotz',
  },
  description: 'Controla tus gastos diarios en familia con total claridad. Registra gastos del hogar, supervisa presupuestos mensuales y gestiona tus finanzas colaborativas con un lector de tickets por IA.',
  keywords: ['control de gastos', 'finanzas familiares', 'presupuesto familiar', 'ahorro colaborativo', 'gastos compartidos', 'gestión de dinero', 'gemini ocr', 'escanear tickets'],
  authors: [{ name: 'Control Dotz Team' }],
  creator: 'Control Dotz',
  metadataBase: new URL('https://controldotz.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Control Dotz',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://controldotz.com',
    title: 'Control Dotz - Control de Gastos Familiares',
    description: 'Controla tus gastos diarios en familia con total claridad. Registra gastos del hogar, supervisa presupuestos mensuales y gestiona tus finanzas colaborativas.',
    siteName: 'Control Dotz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Control Dotz - Control de Gastos Familiares',
    description: 'Controla tus gastos diarios en familia con total claridad. Registra gastos del hogar, supervisa presupuestos mensuales y gestiona tus finanzas colaborativas.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const robotoHeading = Roboto({ subsets: ['latin'], weight: ['400', '500', '700', '900'], variable: '--font-heading', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, robotoHeading.variable)}
    >
      <body>
        <PostHogProvider>
          <I18nProvider>
            <ThemeProvider>
              {children}
              <Toaster />
              <PWAInstallPrompt />
            </ThemeProvider>
          </I18nProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
