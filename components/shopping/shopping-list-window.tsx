'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createExpenseAction } from '@/app/actions/expense'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingBasket,
  Plus,
  Trash2,
  Check,
  Receipt,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/validations'

interface Member {
  user_id: string
  display_name: string
  avatar_url: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface ShoppingItem {
  id: string
  name: string
  quantity: string | null
  bought: boolean
  created_by: string
  created_at: string
}

interface ShoppingListWindowProps {
  householdId: string
  householdName: string
  userId: string
  initialItems: ShoppingItem[]
  categories: Category[]
  members: Member[]
}

export function ShoppingListWindow({
  householdId,
  householdName,
  userId,
  initialItems,
  categories,
  members,
}: ShoppingListWindowProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Estados del Dialog Conversor a Gasto
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<ShoppingItem | null>(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategoryId, setExpenseCategoryId] = useState('')
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('Tarjeta')
  const [expenseNotes, setExpenseNotes] = useState('')

  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState<string | null>(null)
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null)

  const [showBought, setShowBought] = useState(true)
  const [isClearingBought, setIsClearingBought] = useState(false)

  const supabase = createClient()

  // Suscribirse a la lista de la compra en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel(`shopping_list_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ShoppingItem
            setItems((prev) => {
              if (prev.some((i) => i.id === newItem.id)) return prev
              return [...prev, newItem]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as ShoppingItem
            setItems((prev) =>
              prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id
            setItems((prev) => prev.filter((i) => i.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, supabase])

  // Añadir artículo
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || isAdding) return

    setIsAdding(true)
    setAddError(null)

    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .insert({
          household_id: householdId,
          name: itemName.trim(),
          quantity: itemQuantity.trim() || null,
          bought: false,
          created_by: userId,
        })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setItems((prev) => [...prev, data[0] as ShoppingItem])
      }

      setItemName('')
      setItemQuantity('')
    } catch (err: any) {
      console.error('Error adding shopping item:', err)
      setAddError('Error al añadir el artículo. Inténtalo de nuevo.')
    } finally {
      setIsAdding(false)
    }
  }

  // Cambiar estado comprado/pendiente
  const handleToggleBought = async (itemId: string, currentBoughtState: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({ bought: !currentBoughtState })
        .eq('id', itemId)

      if (error) throw error

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, bought: !currentBoughtState } : i))
      )
    } catch (err) {
      console.error('Error toggling bought state:', err)
    }
  }

  // Eliminar artículo
  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error('Error deleting shopping item:', err)
    }
  }

  // Eliminar todos los artículos comprados
  const handleCleanBoughtItems = async (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar colapso
    if (boughtItems.length === 0 || isClearingBought) return

    setIsClearingBought(true)
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('household_id', householdId)
        .eq('bought', true)

      if (error) throw error

      setItems((prev) => prev.filter((i) => !i.bought))
    } catch (err) {
      console.error('Error clearing bought items:', err)
    } finally {
      setIsClearingBought(false)
    }
  }

  // Abrir modal conversor a gasto
  const handleOpenExpenseModal = (item: ShoppingItem) => {
    setActiveItem(item)
    setExpenseAmount('')
    setExpenseCategoryId(categories[0]?.id || '')
    setExpensePaymentMethod('Tarjeta')
    setExpenseNotes(item.quantity ? `Comprado: ${item.quantity}` : '')
    setExpenseError(null)
    setExpenseSuccess(null)
    setIsDialogOpen(true)
  }

  // Guardar gasto y eliminar artículo
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem || isSavingExpense) return

    const amountStr = expenseAmount.trim()
    if (!amountStr) {
      setExpenseError('El importe es obligatorio.')
      return
    }

    setIsSavingExpense(true)
    setExpenseError(null)
    setExpenseSuccess(null)

    try {
      // Crear FormData para enviar a la server action
      const formData = new FormData()
      formData.append('amount', amountStr)
      formData.append('category_id', expenseCategoryId)
      formData.append('description', `Compra: ${activeItem.name}`)
      formData.append('expense_date', new Date().toISOString().split('T')[0])
      formData.append('payment_method', expensePaymentMethod)
      formData.append('notes', expenseNotes.trim())

      const res = await createExpenseAction(householdId, {}, formData)

      if (res.error) {
        setExpenseError(res.error)
      } else {
        setExpenseSuccess('¡Gasto registrado y artículo removido con éxito!')

        // Eliminar de la lista de la compra al convertirse con éxito
        await supabase.from('shopping_list').delete().eq('id', activeItem.id)
        setItems((prev) => prev.filter((i) => i.id !== activeItem.id))

        setTimeout(() => {
          setIsDialogOpen(false)
        }, 800)
      }
    } catch (err) {
      console.error('Error converting item to expense:', err)
      setExpenseError('Error de red al guardar el gasto.')
    } finally {
      setIsSavingExpense(false)
    }
  }

  const getCreatorProfile = (creatorId: string) => {
    return members.find((m) => m.user_id === creatorId) || {
      user_id: creatorId,
      display_name: 'Miembro',
      avatar_url: '',
    }
  }

  const pendingItems = items.filter((i) => !i.bought)
  const boughtItems = items.filter((i) => i.bought)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Columna Izquierda: Formulario de añadir artículo */}
      <div className="md:col-span-1 space-y-4">
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5 text-primary" />
              Añadir Artículo
            </CardTitle>
            <CardDescription>
              Añade cosas que hagan falta en la nevera o en la despensa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              {addError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{addError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="name">Nombre del producto</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej. Leche entera, Manzanas"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  disabled={isAdding}
                  className="bg-muted/50 focus:bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity">Cantidad / Detalles (Opcional)</Label>
                <Input
                  id="quantity"
                  type="text"
                  placeholder="Ej. 6 bricks, 1 kg, Marca Hacendado"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  disabled={isAdding}
                  className="bg-muted/50 focus:bg-background"
                />
              </div>

              <Button type="submit" disabled={!itemName.trim() || isAdding} className="w-full">
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Añadiendo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir a la Lista
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Lista de artículos */}
      <div className="md:col-span-2 space-y-6">
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Artículos Pendientes ({pendingItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60">
                <Check className="h-10 w-10 text-emerald-500 bg-emerald-500/10 p-2 rounded-full mb-2" />
                <p className="text-sm font-semibold text-foreground">¡Todo comprado!</p>
                <p className="text-xs mt-1">No hay artículos pendientes. Buen trabajo.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {pendingItems.map((item) => {
                  const creator = getCreatorProfile(item.created_by)

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Checkbox para marcar como comprado */}
                        <button
                          onClick={() => handleToggleBought(item.id, item.bought)}
                          className="mt-1 h-5 w-5 rounded-md border border-border/80 flex items-center justify-center hover:bg-muted/30 transition-all"
                        >
                          <span className="sr-only">Marcar comprado</span>
                        </button>

                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-foreground wrap-break-word">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground flex-wrap">
                            {item.quantity && (
                              <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-md font-medium border border-primary/10">
                                {item.quantity}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Avatar className="h-3.5 w-3.5 border">
                                {creator.avatar_url ? (
                                  <AvatarImage src={creator.avatar_url} alt={creator.display_name} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">
                                  {creator.display_name.substring(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{creator.display_name}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenExpenseModal(item)}
                          className="h-8 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" />
                          Gasto
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección: Comprados recientemente */}
        {boughtItems.length > 0 && (
          <Card className="border-slate-200/50 shadow-sm opacity-80">
            <CardHeader className="py-3 flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowBought(!showBought)}>
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Comprados recientemente ({boughtItems.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCleanBoughtItems}
                  disabled={isClearingBought}
                  className="h-6 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 px-2 rounded-md font-bold"
                >
                  {isClearingBought ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Limpiar Comprados
                </Button>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                {showBought ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>

            {showBought && (
              <CardContent className="pt-0 space-y-4">
                <div className="divide-y divide-border/40">
                  {boughtItems.map((item) => {
                    const creator = getCreatorProfile(item.created_by)

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Checkbox completado */}
                          <button
                            onClick={() => handleToggleBought(item.id, item.bought)}
                            className="mt-1 h-5 w-5 rounded-md border border-emerald-500/80 bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all"
                          >
                            <Check className="h-3.5 w-3.5 font-bold" />
                          </button>

                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm text-muted-foreground line-through wrap-break-word">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground/80 flex-wrap">
                              {item.quantity && (
                                <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium border border-border/60">
                                  {item.quantity}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Avatar className="h-3.5 w-3.5 border opacity-70">
                                  {creator.avatar_url ? (
                                    <AvatarImage src={creator.avatar_url} alt={creator.display_name} className="object-cover" />
                                  ) : null}
                                  <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">
                                    {creator.display_name.substring(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{creator.display_name}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenExpenseModal(item)}
                            className="h-8 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                          >
                            <Receipt className="h-3.5 w-3.5 mr-1" />
                            Gasto
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Diálogo Conversor Inteligente a Gasto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Convertir a Gasto Familiar
            </DialogTitle>
            <DialogDescription>
              Ingresa el importe y categoría para registrar la compra de **{activeItem?.name}**.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveExpense}>
            <div className="space-y-4 py-2 text-left">
              {expenseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{expenseError}</AlertDescription>
                </Alert>
              )}

              {expenseSuccess && (
                <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <AlertTitle>Éxito</AlertTitle>
                  <AlertDescription>{expenseSuccess}</AlertDescription>
                </Alert>
              )}

              {/* Importe definitivo */}
              <div className="space-y-1">
                <Label htmlFor="expense_amount">Importe definitivo (€)</Label>
                <Input
                  id="expense_amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  disabled={isSavingExpense}
                  className="bg-muted/50 focus:bg-background text-lg font-bold text-emerald-600 dark:text-emerald-400"
                />
                <p className="text-[10px] text-muted-foreground">
                  Ingresa el valor total pagado por el artículo.
                </p>
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <Label htmlFor="expense_category_id">Categoría</Label>
                <Select
                  value={expenseCategoryId}
                  onValueChange={(val) => setExpenseCategoryId(val || '')}
                  disabled={isSavingExpense}
                  items={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                >
                  <SelectTrigger id="expense_category_id" className="w-full bg-muted/50 h-9">
                    <SelectValue placeholder="-- Selecciona una categoría --" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Método de pago */}
              <div className="space-y-1">
                <Label htmlFor="expense_payment_method">Método de pago</Label>
                <Select
                  value={expensePaymentMethod}
                  onValueChange={(val) => setExpensePaymentMethod(val || 'Tarjeta')}
                  disabled={isSavingExpense}
                  items={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
                >
                  <SelectTrigger id="expense_payment_method" className="w-full bg-muted/50 h-9">
                    <SelectValue placeholder="-- Selecciona método de pago --" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notas */}
              <div className="space-y-1">
                <Label htmlFor="expense_notes">Notas (Opcional)</Label>
                <Input
                  id="expense_notes"
                  type="text"
                  placeholder="Detalles del gasto..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  disabled={isSavingExpense}
                  className="bg-muted/50 focus:bg-background text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <DialogClose render={<Button variant="outline" type="button" disabled={isSavingExpense}>Cancelar</Button>} />
              <Button type="submit" disabled={!expenseAmount || isSavingExpense} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSavingExpense ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Gasto
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
