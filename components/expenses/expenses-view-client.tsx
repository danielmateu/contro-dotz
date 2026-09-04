'use client'

import React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { ExpenseDialog } from '@/components/expenses/expense-dialog'
import { DeleteExpenseButton } from '@/components/expenses/delete-expense-button'
import { ReceiptButton } from '@/components/expenses/receipt-button'
import { PayerSelectorInline } from '@/components/expenses/payer-selector-inline'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Edit2, Receipt, Calendar, CreditCard, Tag } from 'lucide-react'

interface ExpensesViewClientProps {
  householdId: string
  currentUserId: string
  isOwner: boolean
  categories: any[]
  members: any[]
  mappedMembers: any[]
  expenses: any[]
  totalCount?: number
  currentPage?: number
  totalPages?: number
  pageSize?: number
  totalExpensesAmount?: number
  startDate: string
  endDate: string
  categoryId: string
  memberId: string
}

export function ExpensesViewClient({
  householdId,
  currentUserId,
  isOwner,
  categories,
  members,
  mappedMembers,
  expenses,
  totalCount = expenses?.length || 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 40,
  totalExpensesAmount = 0,
  startDate,
  endDate,
  categoryId,
  memberId,
}: ExpensesViewClientProps) {
  const { t, locale } = useI18n()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (pageNumber > 1) {
      params.set('page', pageNumber.toString())
    } else {
      params.delete('page')
    }
    return `${pathname}?${params.toString()}`
  }

  const getPageNumbers = (current: number, total: number) => {
    const pages: (number | 'ellipsis')[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      if (current > 3) pages.push('ellipsis')
      const start = Math.max(2, current - 1)
      const end = Math.min(total - 1, current + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (current < total - 2) pages.push('ellipsis')
      pages.push(total)
    }
    return pages
  }

  const fromItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const toItem = Math.min(currentPage * pageSize, totalCount)
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div className="space-y-6">
      {/* Title & Add Expense Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            {t('expenses.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('expenses.subtitle')}
          </p>
        </div>

        <ExpenseDialog
          householdId={householdId}
          categories={categories || []}
          members={mappedMembers}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      </div>

      {/* Expense Filters Component */}
      <ExpenseFilters
        categories={categories || []}
        members={(members as any) || []}
      />

      {/* Range Info */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            {locale === 'en'
              ? `Showing ${fromItem}–${toItem} of ${totalCount} expenses`
              : locale === 'ca'
              ? `Mostrant ${fromItem}–${toItem} de ${totalCount} despeses`
              : `Mostrando ${fromItem}–${toItem} de ${totalCount} gastos`}
          </span>
          {totalPages > 1 && (
            <span>
              {locale === 'en'
                ? `Page ${currentPage} of ${totalPages}`
                : locale === 'ca'
                ? `Pàgina ${currentPage} de ${totalPages}`
                : `Página ${currentPage} de ${totalPages}`}
            </span>
          )}
        </div>
      )}

      {/* Expenses Table */}
      {!expenses || expenses.length === 0 ? (
        <Card className="border-slate-200/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <Receipt className="h-8 w-8 stroke-1 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground font-heading">
              {t('expenses.noExpenses')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 leading-relaxed">
              {startDate || endDate || categoryId || memberId
                ? (locale === 'en'
                    ? 'No expenses match the selected filters. Try adjusting or clearing them.'
                    : locale === 'ca'
                    ? 'No hi ha despeses que coincideixin amb els filtres seleccionats. Prova a ajustar-los.'
                    : 'No hay gastos que coincidan con los filtros seleccionados. Intenta ajustarlos o limpiarlos.')
                : (locale === 'en'
                    ? 'No expenses recorded in this household yet. Start by adding your first expense!'
                    : locale === 'ca'
                    ? 'Encara no s\'ha enregistrat cap despesa en aquesta llar. Comença afegint la primera!'
                    : 'Aún no se ha registrado ningún gasto en este hogar. ¡Empieza añadiendo tu primer gasto familiar!')}
            </p>
            {!startDate && !endDate && !categoryId && !memberId && (
              <ExpenseDialog
                householdId={householdId}
                categories={categories || []}
                className="mt-6"
                members={mappedMembers}
                currentUserId={currentUserId}
                isOwner={isOwner}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-slate-200/50 shadow-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>{t('expenses.date')}</TableHead>
                  <TableHead>{t('expenses.description')}</TableHead>
                  <TableHead>{t('expenses.category')}</TableHead>
                  <TableHead>{locale === 'en' ? 'Method' : locale === 'ca' ? 'Mètode' : 'Método'}</TableHead>
                  <TableHead>{t('expenses.payer')}</TableHead>
                  <TableHead className="text-right">{t('expenses.amount')}</TableHead>
                  <TableHead className="w-24 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const category = expense.categories as any
                  const creator = expense.profiles as any
                  const expenseDateFormatted = formatDate(
                    expense.expense_date,
                    'dd/MM/yyyy'
                  )

                  return (
                    <TableRow key={expense.id} className="hover:bg-muted/10">
                      {/* Date */}
                      <TableCell className="font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {expenseDateFormatted}
                        </span>
                      </TableCell>

                      {/* Description / Notes */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            {expense.description}
                            {expense.receipt_path && (
                              <ReceiptButton receiptPath={expense.receipt_path} />
                            )}
                          </span>
                          {expense.notes && (
                            <span className="text-xs text-muted-foreground mt-0.5 max-w-50 truncate">
                              {expense.notes}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {category ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                          }}>
                            <Tag className="h-3 w-3" />
                            {category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {locale === 'en' ? 'Uncategorized' : locale === 'ca' ? 'Sense categoria' : 'Sin categoría'}
                          </span>
                        )}
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell className="text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          {expense.payment_method}
                        </span>
                      </TableCell>

                      {/* Payer */}
                      <TableCell className="text-muted-foreground">
                        <PayerSelectorInline
                          expenseId={expense.id}
                          currentPayerId={expense.created_by}
                          currentPayerName={creator?.display_name || (locale === 'en' ? 'Shared / Half' : locale === 'ca' ? 'A mitges / Compartit' : 'A medias / Compartido')}
                          currentPayerAvatar={creator?.avatar_url || null}
                          members={mappedMembers}
                          isOwner={isOwner}
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-50 text-base">
                        {formatCurrency(expense.amount)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ExpenseDialog
                            categories={categories || []}
                            expense={{
                              id: expense.id,
                              amount: Number(expense.amount),
                              category_id: expense.category_id,
                              description: expense.description,
                              expense_date: expense.expense_date,
                              payment_method: expense.payment_method,
                              notes: expense.notes,
                              receipt_path: expense.receipt_path,
                              created_by: expense.created_by,
                            }}
                            members={mappedMembers}
                            currentUserId={currentUserId}
                            isOwner={isOwner}
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                                aria-label={`Editar gasto: ${expense.description}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteExpenseButton
                            expenseId={expense.id}
                            description={expense.description}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter className="bg-muted/40 border-t border-slate-200 dark:border-slate-800 font-bold">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="font-bold text-sm text-foreground py-3">
                    {locale === 'en'
                      ? `Total (${totalCount} ${totalCount === 1 ? 'expense' : 'expenses'})`
                      : locale === 'ca'
                      ? `Total (${totalCount} ${totalCount === 1 ? 'despesa' : 'despeses'})`
                      : `Total (${totalCount} ${totalCount === 1 ? 'gasto' : 'gastos'})`}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-base text-primary py-3">
                    {formatCurrency(totalExpensesAmount)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted-foreground">
                {locale === 'en'
                  ? `Page ${currentPage} of ${totalPages}`
                  : locale === 'ca'
                  ? `Pàgina ${currentPage} de ${totalPages}`
                  : `Página ${currentPage} de ${totalPages}`}
              </p>
              <Pagination className="justify-center sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={createPageUrl(currentPage - 1)}
                      text={locale === 'ca' ? 'Anterior' : locale === 'en' ? 'Previous' : 'Anterior'}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {pageNumbers.map((p, idx) => (
                    <PaginationItem key={idx}>
                      {p === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={createPageUrl(p as number)}
                          isActive={p === currentPage}
                        >
                          {p}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href={createPageUrl(currentPage + 1)}
                      text={locale === 'ca' ? 'Següent' : locale === 'en' ? 'Next' : 'Siguiente'}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
