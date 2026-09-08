'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ParsedBankExpense {
  temp_id: string
  expense_date: string // YYYY-MM-DD
  description: string
  amount: number
  category_id: string | null
  category_name: string | null
  payment_method: string
  is_duplicate: boolean
  duplicate_reason?: string
  selected: boolean
}

export interface ParseBankStatementResult {
  expenses?: ParsedBankExpense[]
  error?: string
  totalParsed?: number
  possibleDuplicatesCount?: number
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  }
  return cleaned
}

/**
 * Parsea un archivo de extracto bancario (CSV, TXT, TSV) usando la API de Gemini
 * para identificar columnas, mapear categorías y detectar posibles duplicados.
 */
export async function parseBankStatementAction(
  householdId: string,
  formData: FormData
): Promise<ParseBankStatementResult> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { error: 'Por favor, selecciona un archivo válido de extracto bancario.' }
  }

  // Comprobar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'El archivo es demasiado grande. Máximo 5 MB.' }
  }

  const supabase = await createClient()

  // 1. Validar autenticación y acceso al hogar
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { error: 'No perteneces a este hogar.' }
  }

  try {
    // 2. Obtener categorías del hogar y gastos existentes para la detección de duplicados
    const [categoriesRes, existingExpensesRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name')
        .eq('household_id', householdId),
      supabase
        .from('expenses')
        .select('id, amount, description, expense_date')
        .eq('household_id', householdId)
        .order('expense_date', { ascending: false })
        .limit(300),
    ])

    const categories = categoriesRes.data || []
    const existingExpenses = existingExpensesRes.data || []

    // 3. Leer el contenido del archivo
    const fileBuffer = await file.arrayBuffer()
    const decoder = new TextDecoder('utf-8')
    let rawText = decoder.decode(fileBuffer)

    // Si UTF-8 produce demasiados caracteres extraños, intentar con windows-1252 o latin1
    if (rawText.includes('ï¿½') || rawText.includes('')) {
      const latinDecoder = new TextDecoder('iso-8859-1')
      rawText = latinDecoder.decode(fileBuffer)
    }

    if (!rawText || rawText.trim().length === 0) {
      return { error: 'El archivo está vacío o no se pudo leer.' }
    }

    // Limitar el contenido enviado al modelo a los primeros ~150KB / ~300 líneas
    const lines = rawText.split(/\r?\n/)
    const truncatedText = lines.slice(0, 300).join('\n')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { error: 'Falta la clave API de Gemini (GEMINI_API_KEY) en el servidor.' }
    }

    // 4. Preparar lista de categorías para el prompt
    const categoriesPromptList = categories
      .map((c) => `- ${c.name} (ID: ${c.id})`)
      .join('\n')

    const systemPrompt = `Eres un sistema experto en contabilidad familiar y parseo de extractos bancarios de cualquier entidad (BBVA, CaixaBank, Santander, Revolut, ING, Sabadell, Abanca, Kutxabank, N26, etc.).

Tu objetivo es leer el texto del extracto bancario adjunto, extraer cada transacción individual que represente un GASTO o Salida de Dinero (ignora ingresos o traspasos positivos salvo que sean comisiones/cargos negativos), y devolver una estructura JSON estricta.

Categorías disponibles en el hogar:
${categoriesPromptList}

Instrucciones de extracción:
1. "expense_date": Fecha de la transacción en formato estricto YYYY-MM-DD. Si solo hay día/mes, asume el año actual o más reciente.
2. "description": Nombre del comercio, concepto o pagador limpio (ej. "Mercadona", "Gasolinera Repsol", "Restaurante El Patio", "Netflix").
3. "amount": Importe como número decimal positivo positivo estricto (ej. 24.50 o 12.00). Si en el extracto aparece "-24,50 €" o en la columna "Debe", convierte a número 24.50. Ignora los gastos con importe 0.
4. "category_id": ID exacto de la categoría disponible que mejor encaje con la transacción. Si es Mercadona ➔ Alimentación, si es Gasolina ➔ Transporte, etc. Si no estás seguro o no encaja ninguna, asigna null.
5. "payment_method": Tipo de método deducido si se menciona (ej. "Tarjeta", "Transferencia", "Domiciliación", "Recibo" o "Tarjeta").

Texto del extracto bancario:
\`\`\`
${truncatedText}
\`\`\`

Devuelve ÚNICAMENTE un objeto JSON con la clave "transactions" como un array de objetos con este formato:
{
  "transactions": [
    {
      "expense_date": "YYYY-MM-DD",
      "description": "Nombre limpio del concepto",
      "amount": 24.50,
      "category_id": "ID_CATEGORIA_O_NULL",
      "category_name": "Nombre de categoría sugerido",
      "payment_method": "Tarjeta"
    }
  ]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      console.error('Gemini Bank Import Error:', await response.text())
      return { error: 'No se pudo interpretar el archivo bancario con IA. Comprueba el formato.' }
    }

    const resJson = await response.json()
    const botReply = resJson?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!botReply) {
      return { error: 'No se encontraron transacciones legibles en el extracto.' }
    }

    const cleanedJsonText = cleanJsonResponse(botReply)
    const parsed = JSON.parse(cleanedJsonText)
    const rawTransactions: any[] = Array.isArray(parsed.transactions)
      ? parsed.transactions
      : Array.isArray(parsed)
      ? parsed
      : []

    if (rawTransactions.length === 0) {
      return { error: 'No se detectaron gastos válidos en el extracto analizado.' }
    }

    let possibleDuplicatesCount = 0

    // 5. Procesar y enriquecer transacciones con comprobación de duplicados
    const processedExpenses: ParsedBankExpense[] = rawTransactions.map((tx, idx) => {
      const numAmount = typeof tx.amount === 'number' ? Math.abs(tx.amount) : parseFloat(String(tx.amount || 0).replace(',', '.'))
      const cleanDesc = (tx.description || 'Gasto importado').trim()
      const txDate = tx.expense_date || new Date().toISOString().split('T')[0]

      // Comprobar coincidencia exacta o cercana en gastos existentes
      const matchingExisting = existingExpenses.find((exp) => {
        const sameAmount = Math.abs(Number(exp.amount) - numAmount) < 0.01
        const sameDate = exp.expense_date === txDate
        const descMatch =
          exp.description.toLowerCase().includes(cleanDesc.toLowerCase()) ||
          cleanDesc.toLowerCase().includes(exp.description.toLowerCase())
        return sameAmount && (sameDate || descMatch)
      })

      const isDuplicate = !!matchingExisting
      if (isDuplicate) possibleDuplicatesCount++

      const matchedCategory = categories.find((c) => c.id === tx.category_id)

      return {
        temp_id: `tx_${Date.now()}_${idx}`,
        expense_date: txDate,
        description: cleanDesc,
        amount: Math.round(numAmount * 100) / 100,
        category_id: matchedCategory?.id || null,
        category_name: matchedCategory?.name || tx.category_name || null,
        payment_method: tx.payment_method || 'Tarjeta',
        is_duplicate: isDuplicate,
        duplicate_reason: isDuplicate
          ? `Coincide con gasto existente de ${matchingExisting?.amount}€ ("${matchingExisting?.description}")`
          : undefined,
        selected: !isDuplicate, // Desmarcar duplicados por defecto
      }
    })

    return {
      expenses: processedExpenses,
      totalParsed: processedExpenses.length,
      possibleDuplicatesCount,
    }
  } catch (err: any) {
    console.error('parseBankStatementAction error:', err)
    return { error: 'Error al procesar el extracto bancario: ' + (err.message || 'Error desconocido') }
  }
}

export interface BulkCreateExpensePayload {
  expense_date: string
  description: string
  amount: number
  category_id: string
  payment_method?: string
  notes?: string
  created_by?: string | null
  is_personal?: boolean
}

/**
 * Inserta masivamente un lote de gastos seleccionados en la base de datos Supabase,
 * publica una notificación en el chat familiar y otorga recompensas al Tamagotchi.
 */
export async function bulkCreateExpensesAction(
  householdId: string,
  expenses: BulkCreateExpensePayload[]
): Promise<{ success?: string; count?: number; error?: string }> {
  if (!expenses || expenses.length === 0) {
    return { error: 'No se enviaron gastos para importar.' }
  }

  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // 2. Formatear lote de inserción (forzando user.id inicialmente para cumplir con la política RLS)
  const insertPayloads = expenses.map((exp) => ({
    household_id: householdId,
    created_by: user.id,
    amount: Math.abs(exp.amount),
    category_id: exp.category_id,
    description: exp.description.trim(),
    expense_date: exp.expense_date,
    payment_method: exp.payment_method || 'Tarjeta',
    notes: exp.notes ? exp.notes.trim() : 'Importado de extracto bancario',
    is_personal: exp.is_personal ?? false,
  }))

  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert(insertPayloads)
    .select('id')

  if (error) {
    console.error('bulkCreateExpensesAction insert error:', error)
    return { error: 'Error al registrar los gastos en la base de datos: ' + error.message }
  }

  // 3. Actualizar el pagador final (created_by) para aquellos gastos que eran 'shared' (null) o de otro miembro
  const updatesToMake = expenses
    .map((exp, idx) => ({
      id: inserted?.[idx]?.id,
      targetCreatedBy: exp.created_by !== undefined ? exp.created_by : user.id,
    }))
    .filter((item) => item.id && item.targetCreatedBy !== user.id)

  if (updatesToMake.length > 0) {
    await Promise.all(
      updatesToMake.map((item) =>
        supabase
          .from('expenses')
          .update({ created_by: item.targetCreatedBy })
          .eq('id', item.id!)
      )
    )
  }

  const totalAmountSum = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const count = inserted?.length || expenses.length

  // 3. Publicar notificación automática en el Chat Familiar
  try {
    const formattedTotal = totalAmountSum.toFixed(2)
    await supabase.from('messages').insert({
      household_id: householdId,
      created_by: user.id,
      content: `📥 **Extracto bancario importado**: Se han añadido **${count} gastos** en lote por un importe total de **${formattedTotal} €** 💳`,
    })
  } catch (chatErr) {
    console.error('Error posting bulk import notification to chat:', chatErr)
  }

  // 4. Otorgar recompensa al Tamagotchi Dotzi
  try {
    const { data: gs } = await supabase
      .from('user_game_state')
      .select('coins')
      .eq('user_id', user.id)
      .maybeSingle()

    const coinsReward = count * 2 // +2 monedas por cada gasto organizado en lote
    const currentCoins = gs?.coins ?? 100
    const newCoins = currentCoins + coinsReward

    if (gs) {
      await supabase
        .from('user_game_state')
        .update({
          coins: newCoins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }
  } catch (gameErr) {
    console.error('Error updating game state for bulk import:', gameErr)
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/chat')

  return {
    success: `¡Se han importado ${count} gastos correctamente!`,
    count,
  }
}
