import { format as formatDateFn } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea un número o cadena a euros en formato español (ej: 25,50 €)
 */
export function formatCurrency(amount: number | string): string {
  const numericAmount =
    typeof amount === 'string'
      ? parseFloat(amount.replace(',', '.'))
      : amount
  if (isNaN(numericAmount)) return '0,00 €'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(numericAmount)
}

/**
 * Formatea una fecha usando date-fns en español
 */
export function formatDate(
  date: string | Date,
  formatStr: string = "d 'de' MMMM, yyyy"
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Fecha inválida'
  return formatDateFn(dateObj, formatStr, { locale: es })
}

/**
 * Formatea una fecha corta (dd/mm/aaaa)
 */
export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy')
}
