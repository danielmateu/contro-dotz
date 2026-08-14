'use server'

interface Category {
  id: string
  name: string
}

interface ScanResult {
  amount?: string
  description?: string
  expense_date?: string
  category_id?: string | null
  error?: string
}

/**
 * Limpia bloques de código markdown si el modelo los devuelve
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    // Eliminar ```json al inicio y ``` al final
    cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  }
  return cleaned
}

/**
 * Server Action que envía la imagen de un ticket a la API de Gemini (modelo gemini-2.5-flash)
 * y extrae la información del gasto en formato JSON estructurado.
 */
export async function scanReceiptAction(
  formData: FormData
): Promise<ScanResult> {
  try {
    const base64Data = formData.get('base64Data') as string
    const mimeType = formData.get('mimeType') as string
    const categoriesJson = formData.get('categories') as string
    const categoriesList: Category[] = JSON.parse(categoriesJson || '[]')
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { error: 'Falta configurar la clave API de Gemini (GEMINI_API_KEY) en las variables de entorno del servidor.' }
    }

    // Preparar lista de categorías legibles para el prompt
    const categoriesPromptList = categoriesList
      .map((c) => `- ${c.name} (ID: ${c.id})`)
      .join('\n')

    // Prompt instructivo multimodal
    const prompt = `Analiza detalladamente esta imagen de ticket de compra y extrae la información del gasto.
Identifica el importe total, la fecha del ticket y el comercio o concepto principal de forma resumida.

Instrucciones para categorías:
Te proporciono una lista de categorías disponibles con sus respectivos IDs. Debes clasificar el gasto en la categoría que mejor encaje del listado. Devuelve estrictamente el ID de la categoría seleccionada. Si ninguna categoría del listado encaja razonablemente, devuelve null.
Categorías disponibles:
${categoriesPromptList}

Devuelve una respuesta estrictamente en formato JSON válido con la siguiente estructura (no añadas explicaciones ni texto adicional fuera del JSON):
{
  "amount": "string (número decimal formateado con dos decimales usando punto para separar decimales, ej. '24.50' o '5.00')",
  "description": "string (resumen corto del comercio y concepto clave, ej. 'Mercadona - Alimentación' o 'Repsol - Gasolina')",
  "expense_date": "string (fecha del ticket en formato YYYY-MM-DD)",
  "category_id": "string (el ID exacto de la categoría seleccionada o null)"
}`

    // Llamada directa al API HTTP de Gemini
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
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API HTTP Error:', errText)
      return { error: 'Error en la comunicación con el servicio de Inteligencia Artificial.' }
    }

    const resJson = await response.json()
    const textResponse = resJson?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      return { error: 'No se pudo obtener un análisis legible del ticket.' }
    }

    // Limpiar y parsear la respuesta estructurada
    const cleanedText = cleanJsonResponse(textResponse)
    const parsedData = JSON.parse(cleanedText)

    return {
      amount: parsedData.amount || '',
      description: parsedData.description || '',
      expense_date: parsedData.expense_date || '',
      category_id: parsedData.category_id || null,
    }
  } catch (err: any) {
    console.error('scanReceiptAction Error:', err)
    return { error: 'Error inesperado al procesar el ticket de compra.' }
  }
}

/**
 * Server Action para consultar a Gemini sobre las finanzas del hogar
 */
export async function askGeminiAction(
  householdId: string,
  userPrompt: string
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      error: 'Falta configurar la clave API de Gemini (GEMINI_API_KEY) en el servidor.',
    }
  }

  // Importar de forma dinámica o normal para evitar problemas de ciclo o SSR
  const { createClient } = await import('@/lib/supabase/server')
  const { calculateBalances, calculateDebts } = await import('@/lib/finance-utils')

  // 1. Obtener sesión del usuario y validar pertenencia al hogar
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

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
    // 2. Cargar contexto financiero del mes actual en paralelo
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
      membersRes,
      expensesRes,
      budgetsRes,
      settlementsRes,
      allExpensesRes,
      memberIncomesRes,
    ] = await Promise.all([
      // A. Miembros del hogar
      supabase
        .from('household_members')
        .select('user_id, role, monthly_income, profiles(display_name, email)')
        .eq('household_id', householdId),
      // B. Gastos del mes actual
      supabase
        .from('expenses')
        .select('amount, description, expense_date, created_by, categories(name)')
        .eq('household_id', householdId)
        .gte('expense_date', currentStartDate)
        .lte('expense_date', currentEndDate),
      // C. Presupuestos del mes actual
      supabase
        .from('budgets')
        .select('amount, category_id, categories(name)')
        .eq('household_id', householdId)
        .eq('month', currentMonthStr),
      // D. Liquidaciones registradas para el balance histórico
      supabase
        .from('settlements')
        .select('payer_id, receiver_id, amount')
        .eq('household_id', householdId),
      // E. Todos los gastos históricos del hogar para el cálculo de balances
      supabase
        .from('expenses')
        .select('created_by, amount')
        .eq('household_id', householdId),
      // F. Ingresos específicos del mes
      supabase
        .from('member_incomes')
        .select('user_id, amount')
        .eq('household_id', householdId)
        .eq('month', currentMonthStr),
    ])

    const membersList = membersRes.data || []
    const currentExpenses = expensesRes.data || []
    const currentBudgets = budgetsRes.data || []
    const settlementsList = settlementsRes.data || []
    const allExpenses = allExpensesRes.data || []

    // Formatear miembros y calcular balances
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

    const exactBalances = calculateBalances(
      formattedMembers,
      allExpenses,
      settlementsList
    )
    const exactDebts = calculateDebts(exactBalances)

    // Agrupar gastos del mes actual por categoría
    const categorySpentMap: Record<string, number> = {}
    currentExpenses.forEach((exp) => {
      const catName = (exp.categories as any)?.name || 'Otros'
      categorySpentMap[catName] = (categorySpentMap[catName] || 0) + Number(exp.amount)
    })

    const budgetsContext = currentBudgets.map((b) => {
      const catName = (b.categories as any)?.name || 'Categoría'
      const limit = Number(b.amount)
      const spent = categorySpentMap[catName] || 0
      return {
        categoria: catName,
        limite: limit,
        gastado: spent,
        porcentaje_consumido: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      }
    })

    const expensesContext = currentExpenses.map((exp) => ({
      fecha: exp.expense_date,
      importe: Number(exp.amount),
      categoria: (exp.categories as any)?.name || 'Otros',
      concepto: exp.description,
      registrado_por:
        formattedMembers.find((m) => m.user_id === exp.created_by)?.profiles
          ?.display_name || 'Desconocido',
    }))

    const balancesContext = exactBalances.map((b) => ({
      nombre: b.name,
      gastado_personalmente: b.spent,
      balance_neto: b.balance,
      estado:
        b.balance > 0
          ? `Se le debe ${b.balance}€`
          : b.balance < 0
            ? `Debe ${Math.abs(b.balance)}€`
            : 'Al día',
    }))

    const debtsContext = exactDebts.map((d) => ({
      debe_pagar: d.from_name,
      a_favor_de: d.to_name,
      importe: d.amount,
    }))

    const totalSpent = currentExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const monthlyIncomes = memberIncomesRes.data || []

    // Obtener los ingresos reales aplicables para el mes en curso (nómina específica o base)
    const membersIncomeList = membersList.map((m) => {
      const specificIncome = monthlyIncomes.find((inc) => inc.user_id === m.user_id)
      return {
        user_id: m.user_id,
        income: specificIncome ? Number(specificIncome.amount) : Number(m.monthly_income || 0),
      }
    })
    const totalHouseholdIncome = membersIncomeList.reduce((sum, item) => sum + item.income, 0)

    // Gastos realizados por miembro este mes
    const memberSpentMap: Record<string, number> = {}
    membersList.forEach((m) => {
      memberSpentMap[m.user_id] = 0
    })
    currentExpenses.forEach((exp) => {
      if (exp.created_by && memberSpentMap[exp.created_by] !== undefined) {
        memberSpentMap[exp.created_by] += Number(exp.amount)
      }
    })

    const analisisProporcional = exactBalances.map((b) => {
      const matchedMember = membersList.find((m) => {
        const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        const name = prof?.display_name || prof?.email?.split('@')[0] || 'Miembro'
        return name === b.name
      })

      const matchedIncomeItem = matchedMember ? membersIncomeList.find(item => item.user_id === matchedMember.user_id) : null
      const income = matchedIncomeItem ? matchedIncomeItem.income : 0
      const spent = matchedMember ? (memberSpentMap[matchedMember.user_id] || 0) : 0
      const incomePercentage = totalHouseholdIncome > 0 ? (income / totalHouseholdIncome) * 100 : 0
      const proportionalShare = totalHouseholdIncome > 0 ? totalSpent * (income / totalHouseholdIncome) : 0
      const diff = spent - proportionalShare

      return {
        nombre: b.name,
        ingreso: income,
        porcentaje_ingresos_hogar: incomePercentage,
        aportacion_real: spent,
        cuota_proporcional: proportionalShare,
        diferencia: diff,
      }
    })

    const householdContext = {
      mes_actual: currentMonthStr,
      miembros: formattedMembers.map((m) => m.profiles?.display_name),
      gastos_del_mes: expensesContext,
      presupuestos_del_mes: budgetsContext,
      balances_y_cuentas: {
        saldos_netos: balancesContext,
        transferencias_sugeridas: debtsContext,
      },
      ingresos_y_analisis_proporcional: {
        ingresos_totales_hogar: totalHouseholdIncome,
        reparto_proporcional: analisisProporcional,
      }
    }

    // 3. Crear el prompt estructurado para Gemini
    const systemPrompt = `Actúas como Gemini AI, el asistente financiero inteligente del hogar.
Tu objetivo es ayudar a los miembros de la familia a entender sus gastos, balances y cuentas.
Te facilito el contexto financiero del hogar actual en formato JSON para el mes de ${currentMonthStr}:
${JSON.stringify(householdContext, null, 2)}

Instrucciones para responder:
- Responde a la consulta del usuario de forma familiar, cercana y muy concisa (no más de 3 párrafos).
- Utiliza negritas en markdown para resaltar importes, nombres de personas o categorías.
- No muestres código JSON en tu respuesta. Tradúcelo todo a un formato de texto amigable en español.
- Si te preguntan sobre quién le debe a quién, fíjate en "transferencias_sugeridas" en el JSON, ya que están optimizadas matemáticamente.
- Sé preciso con los datos del JSON. Si no tienes datos sobre lo que te preguntan, indícalo con amabilidad.
- Analiza si el reparto de gastos es justo de acuerdo con la proporción de ingresos de cada miembro ("reparto_proporcional"). Si un miembro aporta más o menos de lo correspondiente proporcionalmente a sus ingresos (diferencia positiva o negativa), ofréceles consejos constructivos y empáticos sobre cómo equilibrar las cuentas del hogar.
- Compara los gastos totales del mes con los ingresos del hogar para aconsejarles sobre su nivel de ahorro y darles recomendaciones personalizadas de mejora para el día a día.
- La pregunta del usuario fue: "${userPrompt.replace(/@gemini/gi, '').trim()}"`

    // 4. Llamar a la API de Gemini
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
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API HTTP Error:', errText)
      throw new Error('Error al conectar con la API de Gemini')
    }

    const resJson = await response.json()
    const botReply = resJson?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!botReply) {
      throw new Error('Respuesta de bot vacía')
    }

    // 5. Insertar la respuesta del bot en la tabla de mensajes
    await supabase.from('messages').insert({
      household_id: householdId,
      created_by: null,
      is_bot: true,
      content: botReply.trim(),
    })

    return { success: true }
  } catch (err: any) {
    console.error('askGeminiAction Error:', err)
    return {
      error:
        'No he podido procesar tu solicitud con Gemini en este momento. Inténtalo de nuevo.',
    }
  }
}

