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

  // Cargar perfil actual
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, avatar_url, status')
    .eq('id', user.id)
    .single()

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
    </div>
  )
}
