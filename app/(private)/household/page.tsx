import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateHouseholdForm } from '@/components/household/create-household-form'
import { InviteMemberForm } from '@/components/household/invite-member-form'
import { InvitationActions } from '@/components/household/invitation-actions'
import { MemberActions } from '@/components/household/member-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Users2,
  Mail,
  UserPlus,
  Shield,
  Hourglass,
  Calendar,
  Coins,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateBalances, calculateDebts } from '@/lib/finance-utils'
import { SettlementsTabContent } from '@/components/household/settlements-tab-content'

export default async function HouseholdPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar email de perfil y membresía de hogar en paralelo
  const [profileRes, membershipRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('household_members')
      .select('id, household_id, role, households(name, created_at)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
  ])

  const profile = profileRes.data
  const membership = membershipRes.data
  const userEmail = profile?.email || ''

  const hasHousehold = !!membership
  const householdName = membership?.households
    ? (membership.households as any).name
    : null
  const householdCreatedAt = membership?.households
    ? (membership.households as any).created_at
    : null

  let membersList: any[] = []
  let sentInvitations: any[] = []
  let receivedInvitations: any[] = []
  let balances: any[] = []
  let debts: any[] = []
  let settlementsList: any[] = []

  if (hasHousehold) {
    // Cargar miembros, invitaciones enviadas, gastos y liquidaciones en paralelo
    const [membersRes, sentRes, expensesRes, settlementsRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('id, role, user_id, profiles(display_name, email)')
        .eq('household_id', membership.household_id),
      supabase
        .from('invitations')
        .select('id, email, role, status, created_at')
        .eq('household_id', membership.household_id)
        .eq('status', 'pending'),
      supabase
        .from('expenses')
        .select('created_by, amount')
        .eq('household_id', membership.household_id),
      supabase
        .from('settlements')
        .select('id, payer_id, receiver_id, amount, settled_at')
        .eq('household_id', membership.household_id)
        .order('settled_at', { ascending: false })
    ])

    membersList = membersRes.data || []
    sentInvitations = sentRes.data || []
    const expensesList = expensesRes.data || []
    settlementsList = settlementsRes.data || []

    // Calcular balances y deudas
    balances = calculateBalances(membersList, expensesList, settlementsList)
    debts = calculateDebts(balances)
  } else {
    // Cargar invitaciones recibidas pendientes
    const { data: received } = await supabase
      .from('invitations')
      .select(
        'id, role, status, created_at, households(name), profiles:invited_by(display_name)'
      )
      .eq('email', userEmail.toLowerCase().trim())
      .eq('status', 'pending')

    receivedInvitations = received || []
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          Hogar y Familia
        </h1>
        <p className="text-muted-foreground">
          {hasHousehold
            ? 'Administra los miembros de tu familia e invita a otros.'
            : 'Crea un nuevo hogar o acepta una invitación para empezar.'}
        </p>
      </div>

      {!hasHousehold ? (
        // ==========================================
        // VISTA: USUARIO SIN HOGAR
        // ==========================================
        <div className="grid gap-6 md:grid-cols-2">
          {/* Formulario de creación */}
          <CreateHouseholdForm />

          {/* Invitaciones recibidas */}
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Invitaciones Recibidas
              </CardTitle>
              <CardDescription>
                Hogares que te han invitado a unirte a ellos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <Mail className="h-10 w-10 stroke-1 mb-2 text-slate-400" />
                  <p className="text-sm">No tienes invitaciones pendientes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl bg-muted/30 gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {(inv.households as any)?.name || 'Hogar Invitado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invitado por:{' '}
                          <span className="font-medium">
                            {(inv.profiles as any)?.display_name || 'Alguien'}
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(inv.created_at), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <InvitationActions invitationId={inv.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // ==========================================
        // VISTA: USUARIO CON HOGAR (TABS)
        // ==========================================
        <Tabs defaultValue="members" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-100 bg-transparent p-1 rounded-xl">
            <TabsTrigger value="members" className="flex items-center gap-2 rounded-lg py-2">
              <Users2 className="h-4 w-4" />
              Miembros y Familia
            </TabsTrigger>
            <TabsTrigger value="settlements" className="flex items-center gap-2 rounded-lg py-2">
              <Coins className="h-4 w-4" />
              Saldos y Cuentas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6 outline-none">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Lista de miembros */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200/50 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-primary" />
                        Miembros de {householdName}
                      </CardTitle>
                      {householdCreatedAt && (
                        <CardDescription className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Creado el{' '}
                          {format(
                            new Date(householdCreatedAt),
                            "d 'de' MMMM, yyyy",
                            { locale: es }
                          )}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="w-16 text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membersList.map((member) => {
                          const isCurrentUser = member.user_id === user.id
                          const memberDisplayName =
                            member.profiles?.display_name || 'Miembro'
                          const memberEmail =
                            member.profiles?.email || 'Desconocido'
                          return (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {memberDisplayName}{' '}
                                {isCurrentUser && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    (Tú)
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {memberEmail}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    member.role === 'owner' ? 'default' : 'secondary'
                                  }
                                  className="gap-1"
                                >
                                  {member.role === 'owner' && (
                                    <Shield className="h-3 w-3" />
                                  )}
                                  {member.role === 'owner'
                                    ? 'Propietario'
                                    : 'Miembro'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {/* Mostrar acciones de eliminar miembro o salir */}
                                {(membership.role === 'owner' && !isCurrentUser) ||
                                  (isCurrentUser && membership.role === 'member') ? (
                                  <MemberActions
                                    memberId={member.id}
                                    householdId={membership.household_id}
                                    isSelf={isCurrentUser}
                                    memberName={memberDisplayName}
                                  />
                                ) : null}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Invitaciones enviadas (solo para owners) */}
                {membership.role === 'owner' && (
                  <Card className="border-slate-200/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hourglass className="h-5 w-5 text-amber-500 animate-pulse" />
                        Invitaciones Enviadas Pendientes
                      </CardTitle>
                      <CardDescription>
                        Invitaciones pendientes de aceptar por los destinatarios.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sentInvitations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay invitaciones enviadas pendientes.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sentInvitations.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between p-3 border rounded-xl bg-muted/20"
                            >
                              <div>
                                <p className="text-sm font-semibold">{inv.email}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Rol asignado:{' '}
                                  {inv.role === 'owner' ? 'Propietario' : 'Miembro'}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-amber-600 bg-amber-50 dark:bg-amber-950/20">
                                Pendiente
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Formulario de invitar (solo para owners) */}
              <div className="space-y-6">
                {membership.role === 'owner' ? (
                  <Card className="border-slate-200/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Añadir Familiares
                      </CardTitle>
                      <CardDescription>
                        Envía una invitación por correo a los miembros que deseas sumar.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InviteMemberForm householdId={membership.household_id} />
                    </CardContent>
                  </Card>
                ) : (
                  // {-- Mensaje informativo para miembros no propietarios --}
                  <Card className="border-slate-200/50 shadow-md bg-muted/20">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Miembro del hogar
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Solo el propietario del hogar puede gestionar las invitaciones y
                      miembros adicionales. Si necesitas invitar a alguien, pídeselo al
                      propietario.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settlements" className="outline-none">
            <SettlementsTabContent
              householdId={membership.household_id}
              membersList={membersList}
              balances={balances}
              debts={debts}
              settlementsList={settlementsList}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
