"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/toast"
import { updateExpensePayerAction } from "@/app/actions/expense"
import { Loader2 } from "lucide-react"

interface Member {
  id: string
  name: string
  avatarUrl: string | null
}

interface PayerSelectorInlineProps {
  expenseId: string
  currentPayerId: string | null
  currentPayerName: string
  currentPayerAvatar: string | null
  members: Member[]
  isOwner: boolean
}

export function PayerSelectorInline({
  expenseId,
  currentPayerId,
  currentPayerName,
  currentPayerAvatar,
  members,
  isOwner,
}: PayerSelectorInlineProps) {
  const [isPending, startTransition] = useTransition()
  const [payerId, setPayerId] = useState<string | null>(currentPayerId)

  // Sincronizar el estado interno si el prop cambia desde el servidor
  useEffect(() => {
    setPayerId(currentPayerId)
  }, [currentPayerId])

  // Encontrar el miembro correspondiente para el render actual
  const activeMember = members.find((m) => m.id === payerId)
  const displayName = payerId === null ? "A medias / Compartido" : (activeMember?.name || currentPayerName)
  
  // Utilizar el avatar del miembro activo si está en la lista de miembros, de lo contrario usar el prop inicial
  const avatarUrl = payerId === null 
    ? null 
    : (activeMember ? activeMember.avatarUrl : (payerId === currentPayerId ? currentPayerAvatar : null))

  const handleChange = (val: string | null) => {
    const targetPayerId = val === 'shared' || val === null ? null : val
    setPayerId(targetPayerId)

    startTransition(async () => {
      const res = await updateExpensePayerAction(expenseId, targetPayerId)
      if (res?.error) {
        toast.add({
          title: "Error al actualizar pagador",
          description: res.error,
          type: "error",
        })
        // Revertir en caso de error
        setPayerId(currentPayerId)
      } else {
        const selectedName = val === 'shared' || val === null 
          ? 'A medias / Compartido' 
          : (members.find(m => m.id === val)?.name || 'Miembro')
        toast.add({
          title: "Pagador actualizado",
          description: `Se ha asignado el pago a: ${selectedName}`,
          type: "success",
        })
      }
    })
  }

  // Estructura estática si no es propietario
  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 select-none">
        <Avatar className="h-6 w-6 border border-border/40">
          {currentPayerAvatar ? (
            <AvatarImage src={currentPayerAvatar} alt={currentPayerName} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
            {currentPayerId ? currentPayerName.substring(0, 2).toUpperCase() : 'CO'}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{currentPayerName}</span>
      </div>
    )
  }

  // Si es propietario, renderiza el selector inline
  const selectValue = payerId === null ? 'shared' : payerId

  return (
    <div className="relative flex items-center">
      <Select
        value={selectValue}
        onValueChange={handleChange}
        disabled={isPending}
        items={[
          ...members.map((m) => ({ value: m.id, label: m.name })),
          { value: 'shared', label: 'A medias / Compartido (Todos)' },
        ]}
      >
        <SelectTrigger className="border-none bg-transparent hover:bg-muted/50 p-1 rounded-lg h-auto flex gap-1.5 items-center cursor-pointer transition-colors shadow-none focus-visible:ring-0 select-none data-[placeholder]:text-foreground max-w-[185px]">
          <Avatar className="h-6 w-6 border border-border/40 shrink-0">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
              {payerId ? displayName.substring(0, 2).toUpperCase() : 'CO'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-foreground text-sm font-normal">{displayName}</span>
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />}
        </SelectTrigger>
        <SelectContent align="start">
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
          <SelectItem value="shared">A medias / Compartido (Todos)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
