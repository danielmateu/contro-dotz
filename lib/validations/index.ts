import { z } from 'zod'

// Esquema de Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es requerido.' })
    .email({ message: 'Introduce un correo electrónico válido.' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
})

// Esquema de Registro
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'El correo electrónico es requerido.' })
      .email({ message: 'Introduce un correo electrónico válido.' }),
    displayName: z
      .string()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirma tu contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

// Esquema de Recuperación de Contraseña
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es requerido.' })
    .email({ message: 'Introduce un correo electrónico válido.' }),
})

// Esquema de Restablecimiento de Contraseña
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirma tu nueva contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

// Esquema de Creación/Edición de Hogar
export const householdSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'El nombre del hogar debe tener al menos 2 caracteres.' })
    .max(50, { message: 'El nombre del hogar no puede superar los 50 caracteres.' }),
})

// Esquema para invitar miembros
export const inviteSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es requerido.' })
    .email({ message: 'Introduce un correo electrónico válido.' }),
  role: z.enum(['owner', 'member'], {
    message: 'El rol es requerido.',
  }),
})

// Métodos de pago permitidos
export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'Domiciliación',
  'Bizum',
  'Otro',
] as const

// Esquema de Gasto (Gastos diarios)
export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, { message: 'El importe es requerido.' })
    .refine(
      (val) => {
        const num = parseFloat(val.replace(',', '.'))
        return !isNaN(num) && num > 0
      },
      { message: 'El importe debe ser un número positivo.' }
    )
    .refine(
      (val) => {
        const numStr = val.replace(',', '.')
        const parts = numStr.split('.')
        return parts.length < 2 || parts[1].length <= 2;
      },
      { message: 'El importe no puede tener más de dos decimales.' }
    ),
  category_id: z.string().uuid({ message: 'Selecciona una categoría válida.' }),
  description: z
    .string()
    .min(2, { message: 'La descripción debe tener al menos 2 caracteres.' })
    .max(100, { message: 'La descripción no puede superar los 100 caracteres.' }),
  expense_date: z.string().min(1, { message: 'La fecha es requerida.' }),
  payment_method: z.enum(
    ['Efectivo', 'Tarjeta', 'Transferencia', 'Domiciliación', 'Bizum', 'Otro'],
    {
      message: 'Selecciona un método de pago válido.',
    }
  ),
  notes: z.string().optional(),
})

// Esquema de Presupuesto
export const budgetSchema = z.object({
  category_id: z.string().uuid({ message: 'Selecciona una categoría válida.' }),
  amount: z
    .string()
    .min(1, { message: 'El importe del presupuesto es requerido.' })
    .refine(
      (val) => {
        const num = parseFloat(val.replace(',', '.'))
        return !isNaN(num) && num >= 0
      },
      { message: 'El importe debe ser un número igual o mayor a cero.' }
    ),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, { message: 'El formato de mes debe ser YYYY-MM.' }),
})

// Esquema de Liquidación (Pago de saldo)
export const settlementSchema = z.object({
  payer_id: z.string().uuid({ message: 'Selecciona un deudor válido.' }),
  receiver_id: z.string().uuid({ message: 'Selecciona un acreedor válido.' }),
  amount: z
    .string()
    .min(1, { message: 'El importe de la liquidación es requerido.' })
    .refine(
      (val) => {
        const num = parseFloat(val.replace(',', '.'))
        return !isNaN(num) && num > 0
      },
      { message: 'El importe debe ser un número positivo.' }
    )
    .refine(
      (val) => {
        const numStr = val.replace(',', '.')
        const parts = numStr.split('.')
        return parts.length < 2 || parts[1].length <= 2;
      },
      { message: 'El importe no puede tener más de dos decimales.' }
    ),
}).refine(data => data.payer_id !== data.receiver_id, {
  message: 'El deudor y el acreedor no pueden ser la misma persona.',
  path: ['receiver_id'],
})
