import { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

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

const robotoHeading = Roboto({ subsets: ['latin'], variable: '--font-heading' })
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
