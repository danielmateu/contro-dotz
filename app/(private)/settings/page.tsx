import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Ajustes',
  robots: {
    index: false,
    follow: false,
  },
}
import { ProfileNameForm } from '@/components/household/profile-name-form'
import { SendReportButton } from '@/components/household/send-report-button'
import { MemberIncomeForm } from '@/components/household/member-income-form'
import { MonthlyIncomesListForm } from '@/components/household/monthly-incomes-list-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { User, Mail } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar perfil actual y membresía del hogar en paralelo
  const [profileRes, membershipRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, email, avatar_url, status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('household_members')
      .select('household_id, monthly_income')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.data
  const membership = membershipRes.data
  const householdId = membership?.household_id || null
  const monthlyIncome = Number(membership?.monthly_income || 0)

  // Cargar ingresos mensuales específicos del usuario logueado en este hogar
  let memberIncomes: any[] = []
  if (householdId) {
    const { data: incomesRes } = await supabase
      .from('member_incomes')
      .select('id, month, amount, payroll_path')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
    memberIncomes = incomesRes || []
  }

  const displayName = profile?.display_name || ''
  const email = profile?.email || ''
  const avatarUrl = profile?.avatar_url || ''
  const status = profile?.status || ''

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          Ajustes de Perfil
        </h1>
        <p className="text-muted-foreground">
          Administra la información de tu cuenta y de tu usuario.
        </p>
      </div>

      <Card className="border-slate-200/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Información Personal</CardTitle>
          <CardDescription>
            Actualiza los datos de tu perfil público y de contacto.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Correo electrónico (deshabilitado por seguridad de Auth) */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico de la cuenta</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="pl-9 bg-muted/60 text-muted-foreground cursor-not-allowed border-muted-foreground/20"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              El correo electrónico está vinculado a tu autenticación y no puede modificarse directamente.
            </p>
          </div>

          {/* Formulario de actualización de nombre, avatar y estado */}
          <ProfileNameForm
            initialName={displayName}
            initialAvatarUrl={avatarUrl}
            initialStatus={status}
            userId={user.id}
          />
        </CardContent>
      </Card>

      {/* Ingresos Mensuales */}
      {householdId && (
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Ingresos Mensuales (Base)</CardTitle>
            <CardDescription>
              Introduce tus ingresos mensuales netos base para poder analizar de forma justa el reparto de los gastos del hogar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberIncomeForm
              initialIncome={monthlyIncome}
              householdId={householdId}
            />
          </CardContent>
        </Card>
      )}

      {/* Nóminas e Ingresos Variables */}
      {householdId && (
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Nóminas e Ingresos Variables</CardTitle>
            <CardDescription>
              Registra ingresos netos específicos para meses concretos (ej. nóminas con pagas extra, comisiones o bonus). Si un mes no tiene registro aquí, se usará tu ingreso base por defecto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyIncomesListForm
              initialIncomes={memberIncomes}
              householdId={householdId}
              userId={user.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Reportes del Hogar (Opción C) */}
      {householdId && (
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Reportes del Hogar</CardTitle>
            <CardDescription>
              Envía un reporte financiero detallado por email a todos los miembros de tu familia. El informe incluye desglose de gastos mensuales, límites de presupuestos consumidos y sugerencias de transferencias para liquidar saldos pendientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendReportButton householdId={householdId} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
