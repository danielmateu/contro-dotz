import { createClient } from '@/lib/supabase/server'
import { LandingViewClient } from '@/components/landing/landing-view-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Control Dotz - Control de Gastos Familiares',
  description: 'La aplicación colaborativa y premium para gestionar los gastos del hogar, presupuestos mensuales y liquidar deudas familiares con facilidad y escáner de tickets con IA.',
}

export default async function LandingPage() {
  let isAuthenticated = false

  try {
    const supabase = await createClient()

    // Comprobar si el usuario tiene sesión activa
    const { data, error } = await supabase.auth.getUser()

    isAuthenticated = !error && !!data?.user
  } catch (error) {
    console.error('Error comprobando sesión en LandingPage:', error)
  }

  return <LandingViewClient isAuthenticated={isAuthenticated} />
}

