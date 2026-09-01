'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { householdSchema, inviteSchema } from '@/lib/validations'
import { sendInvitationEmail } from '@/lib/mail'

/**
 * Crea un nuevo hogar y asocia al usuario como creador (owner)
 */
export async function createHouseholdAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string

  const validation = householdSchema.safeParse({ name })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  // Llama a la función RPC de PostgreSQL que crea el hogar e inserta la membresía
  const { data: householdId, error } = await supabase.rpc('create_household', {
    household_name: name,
  })

  if (error) {
    console.error('DATABASE ERROR:', error)
    return { error: 'Error al crear el hogar. Por favor, inténtalo de nuevo.' }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Envía una invitación para unirse a un hogar (Solo owners)
 */
export async function inviteUserAction(
  householdId: string,
  prevState: any,
  formData: FormData
) {
  const email = formData.get('email') as string
  const role = formData.get('role') as string

  const validation = inviteSchema.safeParse({ email, role })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { error } = await supabase.from('invitations').insert({
    household_id: householdId,
    email: email.toLowerCase().trim(),
    role,
    invited_by: user.id,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return {
        error:
          'Ya existe una invitación pendiente para este correo en este hogar.',
      }
    }
    return {
      error:
        'Error al enviar la invitación. Asegúrate de tener permisos de propietario (owner) y que el hogar sea válido.',
    }
  }

  // Cargar datos adicionales para el email (hogar e invitador)
  const { data: household } = await supabase
    .from('households')
    .select('name')
    .eq('id', householdId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  // Disparar correo de invitación con Resend si hay API Key configurada
  if (process.env.RESEND_API_KEY) {
    const householdName = household?.name || 'Control Dotz'
    const inviterName =
      profile?.display_name ||
      profile?.email ||
      user.email ||
      'Un miembro de tu familia'
    try {
      await sendInvitationEmail(
        email.toLowerCase().trim(),
        householdName,
        inviterName
      )
    } catch (mailError) {
      console.error('Error al enviar email por Resend:', mailError)
    }
  }

  revalidatePath('/household')
  return { success: 'Invitación enviada con éxito.' }
}

/**
 * Acepta una invitación pendiente
 */
export async function acceptInvitationAction(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)

  if (error) {
    console.error('ACCEPT INVITATION DB ERROR:', error)
    return { error: 'Error al aceptar la invitación.' }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  return { success: 'Invitación aceptada con éxito.' }
}

/**
 * Rechaza una invitación pendiente
 */
export async function rejectInvitationAction(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'rejected' })
    .eq('id', invitationId)

  if (error) {
    return { error: 'Error al rechazar la invitación.' }
  }

  revalidatePath('/household')
  return { success: 'Invitación rechazada con éxito.' }
}

/**
 * Elimina a un miembro del hogar (Solo owners, o uno mismo para salir)
 */
export async function removeMemberAction(memberId: string, householdId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    return {
      error:
        'Error al eliminar al miembro. Comprueba que tengas permisos suficientes.',
    }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  return { success: 'Miembro eliminado con éxito.' }
}

/**
 * Actualiza el nombre para mostrar del perfil del usuario
 */
export async function updateProfileNameAction(prevState: any, formData: FormData) {
  const displayName = formData.get('displayName') as string
  const avatarUrl = formData.get('avatarUrl') as string
  const status = formData.get('status') as string

  if (!displayName || displayName.trim().length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName.trim(),
      avatar_url: avatarUrl ? avatarUrl.trim() : null,
      status: status ? status.trim() : null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('UPDATE PROFILE ERROR:', error)
    return { error: 'Error al actualizar el nombre de perfil.' }
  }

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: 'Perfil actualizado con éxito.' }
}

/**
 * Server Action para generar e iniciar el envío del informe financiero por correo a todos los miembros del hogar
 */
export async function sendHouseholdReportAction(
  householdId: string
): Promise<any> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return {
      error:
        'No se ha configurado la API Key de Resend (RESEND_API_KEY) en las variables del servidor.',
    }
  }

  const supabase = await createClient()

  // 1. Validar sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // Verificar pertenencia al hogar
  const { data: isMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!isMember) {
    return { error: 'No tienes acceso a este hogar.' }
  }

  try {
    // Importar dinámicamente utilidades de finanzas y correos
    const { sendFinancialReportEmail } = await import('@/lib/mail')
    const { calculateBalances, calculateDebts } = await import('@/lib/finance-utils')

    // 2. Cargar datos financieros del mes actual
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthNum = now.getMonth() + 1
    const currentMonthStr = `${currentYear}-${currentMonthNum
      .toString()
      .padStart(2, '0')}`
    const currentStartDate = `${currentMonthStr}-01`
    const currentLastDay = new Date(currentYear, currentMonthNum, 0).getDate()
    const currentEndDate = `${currentMonthStr}-${currentLastDay
      .toString()
      .padStart(2, '0')}`

    const [
      householdRes,
      membersRes,
      expensesRes,
      budgetsRes,
      settlementsRes,
      allExpensesRes,
    ] = await Promise.all([
      supabase.from('households').select('name').eq('id', householdId).single(),
      supabase
        .from('household_members')
        .select('user_id, role, profiles(display_name, email)')
        .eq('household_id', householdId),
      supabase
        .from('expenses')
        .select('amount, description, expense_date, categories(name)')
        .eq('household_id', householdId)
        .gte('expense_date', currentStartDate)
        .lte('expense_date', currentEndDate),
      supabase
        .from('budgets')
        .select('amount, category_id, categories(name)')
        .eq('household_id', householdId)
        .eq('month', currentMonthStr),
      supabase
        .from('settlements')
        .select('payer_id, receiver_id, amount')
        .eq('household_id', householdId),
      supabase
        .from('expenses')
        .select('created_by, amount')
        .eq('household_id', householdId),
    ])

    const householdName = householdRes.data?.name || 'Hogar'
    const membersList = membersRes.data || []
    const currentExpenses = expensesRes.data || []
    const currentBudgets = budgetsRes.data || []
    const settlementsList = settlementsRes.data || []
    const allExpenses = allExpensesRes.data || []

    const formattedMembers = membersList.map((m) => {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      return {
        user_id: m.user_id,
        profiles: {
          display_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
          email: prof?.email || '',
        },
      }
    })

    // Calcular balances y deudas históricas
    const exactBalances = calculateBalances(
      formattedMembers,
      allExpenses,
      settlementsList
    )
    const exactDebts = calculateDebts(exactBalances)

    // Agrupar gastos del mes actual por categoría
    const categorySpentMap: Record<string, number> = {}
    let totalSpent = 0
    currentExpenses.forEach((exp) => {
      const catName = (exp.categories as any)?.name || 'Otros'
      const amt = Number(exp.amount)
      categorySpentMap[catName] = (categorySpentMap[catName] || 0) + amt
      totalSpent += amt
    })

    // Estructurar presupuestos
    const budgetsData = currentBudgets.map((b) => {
      const catName = (b.categories as any)?.name || 'Categoría'
      const limit = Number(b.amount)
      const spent = categorySpentMap[catName] || 0
      return {
        name: catName,
        limit,
        spent,
        percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      }
    })

    // Generar filas HTML de presupuestos
    const budgetsHtmlRows = budgetsData
      .map(
        (b) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; font-weight: 500;">${
          b.name
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${b.spent.toFixed(
          2
        )}€</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; text-align: right;">de ${b.limit.toFixed(
          2
        )}€</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; text-align: right; color: ${
          b.percent > 100 ? '#ef4444' : b.percent > 80 ? '#f59e0b' : '#10b981'
        }">${b.percent}%</td>
      </tr>
    `
      )
      .join('')

    // Generar filas HTML de balances por miembro
    const balancesHtmlRows = exactBalances
      .map(
        (b) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; font-weight: 500;">${
          b.name
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; text-align: right;">${b.spent.toFixed(
          2
        )}€</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 14px; font-weight: 700; color: ${
          b.balance > 0 ? '#10b981' : b.balance < 0 ? '#ef4444' : '#64748b'
        }">
          ${b.balance > 0 ? `+${b.balance.toFixed(2)}€` : `${b.balance.toFixed(2)}€`}
        </td>
      </tr>
    `
      )
      .join('')

    // Generar deudas simplificadas HTML
    const debtsHtml =
      exactDebts.length > 0
        ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Saldos Simplificados</h3>
          <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 22px;">
            ${exactDebts
              .map(
                (d) => `
              <li><strong>${d.from_name}</strong> debe transferir <strong>${d.amount.toFixed(
                  2
                )}€</strong> a <strong>${d.to_name}</strong>.</li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
        : `
        <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center; color: #15803d; font-size: 14px; font-weight: 600;">
          🎉 ¡El hogar está completamente al día! No hay deudas pendientes entre los miembros.
        </div>
      `

    // Template HTML
    const reportHtml = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">Control Dotz</h1>
          <p style="color: #64748b; font-size: 11px; font-weight: 600; margin-top: 4px; margin-bottom: 0; text-transform: uppercase; letter-spacing: 0.08em;">Informe Financiero Mensual - ${currentMonthStr}</p>
        </div>

        <div style="margin-bottom: 24px; text-align: center;">
          <span style="font-size: 14px; color: #64748b; font-weight: 500;">Resumen del Hogar:</span>
          <h2 style="font-size: 28px; font-weight: 800; color: #6366f1; margin: 6px 0 0 0;">"${householdName}"</h2>
        </div>

        <div style="margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 8px; box-sizing: border-box;">
                <div style="padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em;">Gasto Total Mes</span>
                  <p style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">${totalSpent.toFixed(
                    2
                  )}€</p>
                </div>
              </td>
              <td style="width: 50%; padding: 8px; box-sizing: border-box;">
                <div style="padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em;">Promedio Diario</span>
                  <p style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">${(
                    totalSpent / now.getDate()
                  ).toFixed(2)}€</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-left: 4px solid #6366f1; padding-left: 8px;">Estado de Presupuestos</h3>
          ${
            budgetsHtmlRows.length > 0
              ? `
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Categoría</th>
                    <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; text-align: right;">Gastado</th>
                    <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; text-align: right;">Límite</th>
                    <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; text-align: right;">Consumido</th>
                  </tr>
                </thead>
                <tbody>
                  ${budgetsHtmlRows}
                </tbody>
              </table>
            `
              : `<p style="font-size: 13px; color: #64748b; font-style: italic; margin: 0;">No hay presupuestos asignados para este mes.</p>`
          }
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-left: 4px solid #6366f1; padding-left: 8px;">Balances y Cuentas</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Miembro</th>
                <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; text-align: right;">Aportado</th>
                <th style="padding: 10px 12px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; text-align: right;">Balance Neto</th>
              </tr>
            </thead>
            <tbody>
              ${balancesHtmlRows}
            </tbody>
          </table>

          ${debtsHtml}
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 18px;">
            Este informe fue enviado de forma manual a petición de un miembro de tu grupo familiar.
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">
            Control Dotz © 2026 - Gestión Inteligente de Gastos del Hogar.
          </p>
        </div>
      </div>
    `

    // 3. Enviar el correo a cada uno de los miembros
    const memberEmails = formattedMembers
      .map((m) => m.profiles.email)
      .filter((email) => email.trim() !== '')

    if (memberEmails.length === 0) {
      return { error: 'No se encontraron miembros con correos válidos en este hogar.' }
    }

    await Promise.all(
      memberEmails.map((email) =>
        sendFinancialReportEmail(email, householdName, reportHtml)
      )
    )

    return {
      success:
        '¡Informe familiar enviado con éxito por email a todos los miembros!',
    }
  } catch (err: any) {
    console.error('sendHouseholdReportAction Error:', err)
    return { error: 'Error inesperado al generar y enviar el reporte financiero.' }
  }
}

/**
 * Actualiza los ingresos y la aportación mensual base de un miembro en un hogar
 */
export async function updateMemberIncomeAction(
  householdId: string,
  income: number,
  contribution: number = 0
): Promise<any> {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  if (income < 0 || contribution < 0) {
    return { error: 'El ingreso y la aportación no pueden ser valores negativos.' }
  }

  const { error } = await supabase
    .from('household_members')
    .update({ 
      monthly_income: income,
      monthly_contribution: contribution
    })
    .eq('household_id', householdId)
    .eq('user_id', user.id)

  if (error) {
    console.error('UPDATE INCOME ERROR:', error)
    return { error: 'Error al actualizar tus ingresos y aportación en la base de datos.' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/household')
  return { success: 'Ingresos y aportación mensual actualizados con éxito.' }
}

/**
 * Guarda o actualiza un ingreso y aportación específicos para un mes determinado, con documento adjunto opcional
 */
export async function saveMonthlyIncomeAction(
  householdId: string,
  month: string,
  amount: number,
  contribution: number = 0,
  payrollPath?: string | null
): Promise<any> {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  if (amount < 0 || contribution < 0) {
    return { error: 'El importe y la aportación no pueden ser negativos.' }
  }

  // Validar formato de mes YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { error: 'Formato de mes no válido (debe ser AAAA-MM).' }
  }

  const { error } = await supabase
    .from('member_incomes')
    .upsert({
      household_id: householdId,
      user_id: user.id,
      month,
      amount,
      contribution,
      payroll_path: payrollPath || null
    }, {
      onConflict: 'household_id,user_id,month'
    })

  if (error) {
    console.error('SAVE MONTHLY INCOME ERROR:', error)
    return { error: 'Error al registrar el ingreso y aportación mensual en la base de datos.' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/household')
  return { success: 'Nómina y aportación registradas con éxito.' }
}

/**
 * Genera un enlace firmado temporal para descargar una nómina
 */
export async function getPayrollUrlAction(path: string): Promise<any> {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // Seguridad: verificar que el path de la nómina contiene el ID del usuario en el segundo segmento
  // Formato de path esperado: householdId/userId/fileName
  const segments = path.split('/')
  if (segments.length < 2 || segments[1] !== user.id) {
    return { error: 'Acceso denegado. No tienes permisos para descargar este documento.' }
  }

  const { data, error } = await supabase.storage
    .from('payrolls')
    .createSignedUrl(path, 60) // Enlace temporal válido por 60 segundos

  if (error || !data) {
    console.error('ERROR GENERATING SIGNED URL:', error)
    return { error: 'Error al generar la descarga del documento.' }
  }

  return { url: data.signedUrl }
}

/**
 * Elimina un registro de ingreso mensual específico y su archivo físico si existe
 */
export async function deleteMonthlyIncomeAction(incomeId: string): Promise<any> {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // 1. Recuperar el registro para comprobar si tiene archivo físico
  const { data: incomeRecord, error: fetchError } = await supabase
    .from('member_incomes')
    .select('payroll_path')
    .eq('id', incomeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError || !incomeRecord) {
    return { error: 'No se encontró el registro de ingresos.' }
  }

  // 2. Si hay archivo físico, eliminarlo del bucket "payrolls"
  if (incomeRecord.payroll_path) {
    const { error: storageError } = await supabase.storage
      .from('payrolls')
      .remove([incomeRecord.payroll_path])
    if (storageError) {
      console.error('ERROR DELETING PAYROLL DOCUMENT:', storageError)
    }
  }

  // 3. Eliminar registro de base de datos
  const { error } = await supabase
    .from('member_incomes')
    .delete()
    .eq('id', incomeId)

  if (error) {
    console.error('DELETE MONTHLY INCOME ERROR:', error)
    return { error: 'Error al eliminar el registro de ingresos.' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: 'Ingreso mensual eliminado con éxito.' }
}
