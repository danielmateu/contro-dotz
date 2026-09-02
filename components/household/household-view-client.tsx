'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
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
  Users2,
  Mail,
  UserPlus,
  Shield,
  Hourglass,
  Calendar,
  Coins,
} from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS, ca } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettlementsTabContent } from '@/components/household/settlements-tab-content'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface HouseholdViewClientProps {
  hasHousehold: boolean
  householdName: string | null
  householdCreatedAt: string | null
  householdId?: string
  role?: string
  currentUserId: string
  membersList: any[]
  sentInvitations: any[]
  receivedInvitations: any[]
  balances: any[]
  debts: any[]
  settlementsList: any[]
}

export function HouseholdViewClient({
  hasHousehold,
  householdName,
  householdCreatedAt,
  householdId,
  role,
  currentUserId,
  membersList,
  sentInvitations,
  receivedInvitations,
  balances,
  debts,
  settlementsList,
}: HouseholdViewClientProps) {
  const { t, locale } = useI18n()
  const dateLocale = locale === 'ca' ? ca : locale === 'en' ? enUS : es

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          {t('household.title')}
        </h1>
        <p className="text-muted-foreground">
          {hasHousehold
            ? (locale === 'en' ? 'Manage your family members, roles and invitations.' : locale === 'ca' ? 'Administra els membres de la teva família i convida a d\'altres.' : 'Administra los miembros de tu familia e invita a otros.')
            : (locale === 'en' ? 'Create a new household or accept an invitation to get started.' : locale === 'ca' ? 'Crea una nova llar o accepta una invitació per començar.' : 'Crea un nuevo hogar o acepta una invitación para empezar.')}
        </p>
      </div>

      {!hasHousehold ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Form */}
          <CreateHouseholdForm />

          {/* Received Invitations */}
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {locale === 'en' ? 'Received Invitations' : locale === 'ca' ? 'Invitacions Rebudes' : 'Invitaciones Recibidas'}
              </CardTitle>
              <CardDescription>
                {locale === 'en' ? 'Households that invited you to join.' : locale === 'ca' ? 'Llares que m\'han convidat a unir-m\'hi.' : 'Hogares que te han invitado a unirte a ellos.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <Mail className="h-10 w-10 stroke-1 mb-2 text-slate-400" />
                  <p className="text-sm">
                    {locale === 'en' ? 'No pending invitations.' : locale === 'ca' ? 'No tens invitacions pendents.' : 'No tienes invitaciones pendientes.'}
                  </p>
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
                          {locale === 'en' ? 'Invited by:' : locale === 'ca' ? 'Convidat per:' : 'Invitado por:'}{' '}
                          <span className="font-medium">
                            {(inv.profiles as any)?.display_name || 'Alguien'}
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(inv.created_at), "d 'de' MMMM, yyyy", {
                            locale: dateLocale,
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
        <Tabs defaultValue="members" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-100 bg-transparent p-1 rounded-xl">
            <TabsTrigger value="members" className="flex items-center gap-2 rounded-lg py-2">
              <Users2 className="h-4 w-4" />
              {t('household.members')}
            </TabsTrigger>
            <TabsTrigger value="settlements" className="flex items-center gap-2 rounded-lg py-2">
              <Coins className="h-4 w-4" />
              {t('household.settlements')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6 outline-none">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Members List */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200/50 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-primary" />
                        {locale === 'en' ? `Members of ${householdName}` : locale === 'ca' ? `Membres de ${householdName}` : `Miembros de ${householdName}`}
                      </CardTitle>
                      {householdCreatedAt && (
                        <CardDescription className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {locale === 'en' ? 'Created on ' : locale === 'ca' ? 'Creat el ' : 'Creado el '}
                          {format(
                            new Date(householdCreatedAt),
                            "d 'de' MMMM, yyyy",
                            { locale: dateLocale }
                          )}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{locale === 'en' ? 'Name' : locale === 'ca' ? 'Nom' : 'Nombre'}</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>{locale === 'en' ? 'Role' : locale === 'ca' ? 'Rol' : 'Rol'}</TableHead>
                          <TableHead className="w-16 text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membersList.map((member) => {
                          const isCurrentUser = member.user_id === currentUserId
                          const memberDisplayName =
                            member.profiles?.display_name || 'Miembro'
                          const memberEmail =
                            member.profiles?.email || 'Desconocido'
                          const memberAvatarUrl = member.profiles?.avatar_url
                          const memberStatus = member.profiles?.status

                          return (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-border/40">
                                    {memberAvatarUrl ? (
                                      <AvatarImage src={memberAvatarUrl} alt={memberDisplayName} className="object-cover" />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                      {memberDisplayName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-1.5">
                                      {memberDisplayName}
                                      {isCurrentUser && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          ({locale === 'en' ? 'You' : locale === 'ca' ? 'Tu' : 'Tú'})
                                        </span>
                                      )}
                                    </span>
                                    {memberStatus && (
                                      <span className="text-[10px] text-muted-foreground italic font-normal mt-0.5">
                                        {memberStatus}
                                      </span>
                                    )}
                                  </div>
                                </div>
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
                                    ? (locale === 'en' ? 'Owner' : locale === 'ca' ? 'Propietari' : 'Propietario')
                                    : (locale === 'en' ? 'Member' : locale === 'ca' ? 'Membre' : 'Miembro')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {(role === 'owner' && !isCurrentUser) ||
                                  (isCurrentUser && role === 'member') ? (
                                  <MemberActions
                                    memberId={member.id}
                                    householdId={householdId!}
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

                {/* Sent Invitations */}
                {role === 'owner' && (
                  <Card className="border-slate-200/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hourglass className="h-5 w-5 text-amber-500 animate-pulse" />
                        {locale === 'en' ? 'Pending Sent Invitations' : locale === 'ca' ? 'Invitacions Enviades Pendents' : 'Invitaciones Enviadas Pendientes'}
                      </CardTitle>
                      <CardDescription>
                        {locale === 'en' ? 'Invitations waiting to be accepted.' : locale === 'ca' ? 'Invitacions pendents d\'acceptar.' : 'Invitaciones pendientes de aceptar por los destinatarios.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sentInvitations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {locale === 'en' ? 'No pending sent invitations.' : locale === 'ca' ? 'No hi ha invitacions enviades pendents.' : 'No hay invitaciones enviadas pendientes.'}
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
                                  {locale === 'en' ? 'Assigned role: ' : locale === 'ca' ? 'Rol assignat: ' : 'Rol asignado: '}
                                  {inv.role === 'owner' ? (locale === 'en' ? 'Owner' : locale === 'ca' ? 'Propietari' : 'Propietario') : (locale === 'en' ? 'Member' : locale === 'ca' ? 'Membre' : 'Miembro')}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-amber-600 bg-amber-50 dark:bg-amber-950/20">
                                {locale === 'en' ? 'Pending' : locale === 'ca' ? 'Pendent' : 'Pendiente'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Invite Form */}
              <div className="space-y-6">
                {role === 'owner' ? (
                  <Card className="border-slate-200/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {t('household.invite')}
                      </CardTitle>
                      <CardDescription>
                        {locale === 'en' ? 'Send an email invite to add members.' : locale === 'ca' ? 'Envia una invitació per correu als membres.' : 'Envía una invitación por correo a los miembros que deseas sumar.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InviteMemberForm householdId={householdId!} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-slate-200/50 shadow-md bg-muted/20">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {locale === 'en' ? 'Household Member' : locale === 'ca' ? 'Membre de la llar' : 'Miembro del hogar'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {locale === 'en'
                        ? 'Only the household owner can manage invitations and members.'
                        : locale === 'ca'
                        ? 'Només el propietari de la llar pot gestionar invitacions.'
                        : 'Solo el propietario del hogar puede gestionar las invitaciones y miembros adicionales.'}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settlements" className="outline-none">
            <SettlementsTabContent
              householdId={householdId!}
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
