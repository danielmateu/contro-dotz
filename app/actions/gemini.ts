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

export interface ScanPayrollResult {
  amount?: string
  month?: string
  year?: string
  company?: string
  error?: string
}

/**
 * Server Action que analiza un documento de nómina (PDF o Imagen PNG/JPG) con Gemini AI (gemini-flash-latest)
 * y extrae la información del salario líquido (neto) y el periodo (mes y año).
 */
export async function scanPayrollAction(
  formData: FormData
): Promise<ScanPayrollResult> {
  try {
    const base64Data = formData.get('base64Data') as string
    const mimeType = formData.get('mimeType') as string
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { error: 'Falta configurar la clave API de Gemini (GEMINI_API_KEY) en las variables de entorno del servidor.' }
    }

    const prompt = `Analiza detalladamente este documento de nómina o recibo de salario (puede ser PDF o Imagen) y extrae los datos clave del recibo de sueldo.

Instrucciones de extracción:
1. "amount": Extrae el importe neto final a cobrar por el trabajador. Busca campos como "LÍQUIDO A PERCIBIR", "Líquido total a percibir", "Neto a cobrar", "Total a recibir" o el importe bancario abonado final. Formatea el número con punto decimal y dos decimales (ej. '2450.00' o '1952.50').
2. "month": El número de mes del periodo liquidado o fecha de la nómina (dos dígitos, ej. '01' para enero, '08' para agosto, '12' para diciembre).
3. "year": El año de 4 dígitos correspondiente al periodo liquidado (ej. '2026' o '2025').
4. "company": Nombre de la empresa o empleador emisor si aparece en la nómina (ej. 'Empresa S.L.').

Devuelve una respuesta strictly en formato JSON válido con la siguiente estructura (no añadas explicaciones ni markdown fuera del JSON):
{
  "amount": "string (ej. '2450.00')",
  "month": "string (ej. '08')",
  "year": "string (ej. '2026')",
  "company": "string (ej. 'Nombre Empresa')"
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
      console.error('Gemini API HTTP Error scanning payroll:', errText)
      return { error: 'Error en la comunicación con el servicio de Inteligencia Artificial.' }
    }

    const resJson = await response.json()
    const textResponse = resJson?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      return { error: 'No se pudo obtener un análisis legible de la nómina.' }
    }

    const cleanedText = cleanJsonResponse(textResponse)
    const parsedData = JSON.parse(cleanedText)

    return {
      amount: parsedData.amount || '',
      month: parsedData.month ? parsedData.month.toString().padStart(2, '0') : '',
      year: parsedData.year ? parsedData.year.toString() : '',
      company: parsedData.company || '',
    }
  } catch (err: any) {
    console.error('scanPayrollAction Error:', err)
    return { error: 'Error inesperado al procesar el documento de la nómina.' }
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
      categoriesRes,
      savingGoalsRes,
      shoppingItemsRes,
      gameStateRes,
    ] = await Promise.all([
      // A. Miembros del hogar
      supabase
        .from('household_members')
        .select('user_id, role, monthly_income, monthly_contribution, profiles(display_name, email)')
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
        .select('user_id, amount, contribution')
        .eq('household_id', householdId)
        .eq('month', currentMonthStr),
      // G. Categorías de gastos
      supabase
        .from('categories')
        .select('id, name')
        .eq('household_id', householdId),
      // H. Huchas / Metas de ahorro
      supabase
        .from('saving_goals')
        .select('id, name, target_amount, current_amount')
        .eq('household_id', householdId),
      // I. Lista de la compra activa
      supabase
        .from('shopping_list')
        .select('id, name, quantity, bought')
        .eq('household_id', householdId)
        .eq('bought', false),
      // J. Estado del juego de la mascota Dotzi
      supabase
        .from('user_game_state')
        .select('coins, cleanliness, pet_name, personality, friendship_points')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const membersList = membersRes.data || []
    const currentExpenses = expensesRes.data || []
    const currentBudgets = budgetsRes.data || []
    const settlementsList = settlementsRes.data || []
    const allExpenses = allExpensesRes.data || []
    const monthlyIncomes = memberIncomesRes.data || []
    const categoriesList = categoriesRes.data || []
    const savingGoalsList = savingGoalsRes.data || []
    const shoppingListItems = shoppingItemsRes.data || []
    const petGameState = gameStateRes.data

    // Formatear miembros y calcular balances
    const formattedMembers = membersList.map((m) => {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const specificIncome = monthlyIncomes.find((inc) => inc.user_id === m.user_id)
      const income = specificIncome ? Number(specificIncome.amount) : Number(m.monthly_income || 0)
      const contribution = specificIncome && specificIncome.contribution !== null && specificIncome.contribution !== undefined
        ? Number(specificIncome.contribution)
        : Number(m.monthly_contribution || 0)

      return {
        user_id: m.user_id,
        monthly_income: income,
        monthly_contribution: contribution,
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
      miembros: formattedMembers.map((m) => ({
        user_id: m.user_id,
        nombre: m.profiles?.display_name,
        email: m.profiles?.email,
      })),
      categorias_disponibles: categoriesList.map((c) => ({
        id: c.id,
        nombre: c.name,
      })),
      huchas_de_ahorro: savingGoalsList.map((g) => ({
        id: g.id,
        nombre: g.name,
        objetivo: Number(g.target_amount || 0),
        actual: Number(g.current_amount || 0),
      })),
      dotzi_mascota: {
        nombre: petGameState?.pet_name || 'Dotzi',
        monedas: petGameState?.coins ?? 100,
        limpieza: petGameState?.cleanliness ?? 100,
        puntos_amistad: petGameState?.friendship_points ?? 0,
      },
      lista_compra_pendiente: shoppingListItems.map((item) => ({
        id: item.id,
        nombre: item.name,
        cantidad: item.quantity,
      })),
      gastos_del_mes: expensesContext,
      presupuestos_del_mes: budgetsContext,
      balances_y_cuentas: {
        saldos_netos: balancesContext,
        transferencias_sugeridas: debtsContext,
      },
      ingresos_y_analisis_proporcional: {
        ingresos_totales_hogar: totalHouseholdIncome,
        reparto_proporcional: analisisProporcional,
      },
    }

    // 3. Crear el prompt estructurado para Gemini
    const systemPrompt = `Actúas como Gemini AI, el asistente financiero e integrador del hogar inteligente contro-dotz.
Tu objetivo es ayudar a los miembros de la familia a entender sus gastos, saldos, huchas y lista de la compra, así como proponer o realizar acciones en los distintos módulos del hogar (Gastos, Huchas de Ahorro, Lista de la Compra, Presupuestos y Avisos entre miembros).

A continuación tienes el contexto del hogar actual en formato JSON para el mes de ${currentMonthStr}:
${JSON.stringify(householdContext, null, 2)}

INSTRUCCIONES DE RESPUESTA:
1. CONSULTAS DE LECTURA (ej. "¿cuánto hemos gastado?", "¿qué hay en la lista de compra?", "¿cómo van las huchas?", "dame un consejo de ahorro", "proponer reducir presupuesto"):
   - Responde de forma cercana, concisa (máximo 3 párrafos) y formateada con negritas en markdown.
   - NO incluyas ninguna etiqueta PENDING_ACTION.

2. ACCIONES QUE MODIFICAN DATOS (ej. "Crear una hucha...", "Añadir X a la lista de la compra", "Registra un gasto de...", "Avisar a Laura...", "Añadir 50€ a la hucha..."):
   - DEBES redactar una confirmación clara y explicativa al usuario en el texto.
   - Ejemplos de texto de confirmación:
     - "Voy a crear una hucha llamada **\"Vacaciones\"** con un objetivo de **1.500 €**.\n¿Quieres continuar?"
     - "Voy a añadir **Leche** y **Huevos** a la lista de la compra.\n¿Quieres continuar?"
     - "Voy a registrar un gasto de **45,00 €** en la categoría *Suministros* para \"Recibo de internet\".\n¿Quieres continuar?"
     - "Voy a avisar a **Laura** de que \"El seguro vence el viernes\".\n¿Quieres continuar?"
     - "Voy a añadir **50,00 €** a la hucha **\"Vacaciones\"**.\n¿Quieres continuar?"
   - Y al FINAL OBLIGATORIAMENTE de tu mensaje, añade una sola línea con la estructura JSON delimitada:

   Ejemplos exactos de la etiqueta al final (en una única línea):
   <!--PENDING_ACTION:{"action":"create_saving_goal","params":{"name":"Vacaciones","target_amount":1500},"status":"pending"}-->
   <!--PENDING_ACTION:{"action":"add_shopping_items","params":{"items":[{"name":"Leche","quantity":1},{"name":"Huevos","quantity":1}]},"status":"pending"}-->
   <!--PENDING_ACTION:{"action":"add_expense","params":{"amount":45,"description":"Recibo de internet","category_id":"ID_CATEGORIA_SI_EXISTE_O_NULL","category_name":"Suministros"},"status":"pending"}-->
   <!--PENDING_ACTION:{"action":"add_saving_contribution","params":{"goal_id":"ID_HUCHA_SI_EXISTE_O_NULL","goal_name":"Vacaciones","amount":50},"status":"pending"}-->
   <!--PENDING_ACTION:{"action":"send_member_reminder","params":{"target_user_id":"ID_USUARIO_SI_EXISTE_O_NULL","target_user_name":"Laura","reminder_text":"El seguro vence el viernes"},"status":"pending"}-->

REGLAS CRÍTICAS:
- En las acciones de modificación, NUNCA olvides incluir la etiqueta <!--PENDING_ACTION:...--> al final del texto.
- Sé preciso asociando los IDs del JSON cuando coincidan los nombres (para categorías, miembros o huchas). Si no coinciden exactamente, pon null en el ID.
- Si te preguntan sobre quién le debe a quién, fíjate en "transferencias_sugeridas".
- La pregunta o instrucción del usuario fue: "${userPrompt.replace(/@gemini/gi, '').trim()}"`

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

    // 5. Insertar la respuesta del bot en la tabla de mensajes (formateado con 🤖 para métricas e interfaz)
    const botText = botReply.trim()
    const content = botText.startsWith('🤖') ? botText : `🤖 ${botText}`

    const { error: insertBotErr } = await supabase.from('messages').insert({
      household_id: householdId,
      created_by: user.id,
      content,
    })

    if (insertBotErr) {
      console.error('Error inserting Gemini bot message:', insertBotErr)
    }

    return { success: true }
  } catch (err: any) {
    console.error('askGeminiAction Error:', err)
    return {
      error:
        'No he podido procesar tu solicitud con Gemini en este momento. Inténtalo de nuevo.',
    }
  }
}

export interface ChatWithDotziParams {
  householdId: string
  userPrompt: string
  petStats: {
    health: number
    moodTitle: string
    level: number
    streakDays: number
    spentPercentage: number
  }
  gameState: {
    coins: number
    equippedAccessory: string
  }
  locale?: string
}

/**
 * Server Action para obtener el historial de chat guardado con Dotzi
 */
export async function getDotziChatHistoryAction(): Promise<{
  messages?: Array<{ id: string; sender: 'user' | 'dotzi'; text: string; timestamp: string }>
  error?: string
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Sesión no iniciada.' }

    const { data, error } = await supabase
      .from('dotzi_chat_messages')
      .select('id, sender, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('getDotziChatHistoryAction Error:', error)
      return { error: 'Error al recuperar el historial del chat.' }
    }

    const messages = (data || []).map((m: any) => ({
      id: m.id,
      sender: m.sender as 'user' | 'dotzi',
      text: m.content,
      timestamp: m.created_at,
    }))

    return { messages }
  } catch (err: any) {
    console.error('getDotziChatHistoryAction Catch Error:', err)
    return { error: 'Error al cargar el historial.' }
  }
}

/**
 * Server Action para borrar el historial de chats con Dotzi del usuario activo
 */
export async function clearDotziChatHistoryAction(): Promise<{ success?: boolean; error?: string }> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Sesión no iniciada.' }

    const { error } = await supabase
      .from('dotzi_chat_messages')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('clearDotziChatHistoryAction Error:', error)
      return { error: 'Error al borrar el historial de chats.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('clearDotziChatHistoryAction Catch Error:', err)
    return { error: 'Error inesperado al borrar el historial.' }
  }
}

/**
 * Server Action para charlar con Dotzi usando Gemini AI y su personalidad de Tamagotchi Financiero
 */
export async function chatWithDotziAction({
  householdId,
  userPrompt,
  petStats,
  gameState,
  locale = 'es',
}: ChatWithDotziParams): Promise<{ reply?: string; userMessageId?: string; replyMessageId?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      error: 'Falta configurar la clave API de Gemini en el servidor.',
    }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userMsgId: string | undefined

    // Registrar mensaje del usuario en DB si está autenticado
    if (user) {
      const { data: insertedUserMsg } = await supabase
        .from('dotzi_chat_messages')
        .insert({
          user_id: user.id,
          household_id: householdId || null,
          sender: 'user',
          content: userPrompt.trim(),
        })
        .select('id')
        .single()

      if (insertedUserMsg) {
        userMsgId = insertedUserMsg.id
      }
    }

    // Obtener los últimos 10 mensajes del historial previo para alimentar el contexto conversacional a Gemini
    let conversationHistoryContext = ''
    if (user) {
      const { data: historyMsgs } = await supabase
        .from('dotzi_chat_messages')
        .select('sender, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (historyMsgs && historyMsgs.length > 0) {
        const chronological = historyMsgs.reverse()
        conversationHistoryContext = chronological
          .map((m: any) => `${m.sender === 'user' ? 'Usuario' : 'Dotzi'}: ${m.content}`)
          .join('\n')
      }
    }

    const langName = locale === 'ca' ? 'catalán' : locale === 'en' ? 'inglés' : 'español'
    const systemPrompt = `Eres "Dotzi", el Tamagotchi y mascota financiera oficial de la aplicación contro-dotz.
Tu trabajo es ser el compañero interactivo, empático, simpático y muy motivador del usuario.
Hablas siempre en ${langName}.

Tu personalidad:
- Eres alegre, cariñoso, cercano y usas emojis de forma divertida.
- Te interesas genuinamente por la salud económica del hogar y te encantan tus accesorios.
- Respondes en 1 o 2 párrafos cortos (máximo 60-70 palabras) para que sea súper cómodo de leer en pantalla móvil.
- Usas negritas de markdown para resaltar datos importantes o consejos.

Tu estado actual:
- Salud Financiera: ${petStats.health}% (${petStats.moodTitle})
- Nivel: ${petStats.level} | Racha: ${petStats.streakDays} días en verde
- Presupuesto consumido del mes: ${petStats.spentPercentage}%
- Accesorio equipado actual: "${gameState.equippedAccessory}"
- Saldo de DotzCoins: ${gameState.coins}

${conversationHistoryContext ? `Historial reciente de conversación:\n${conversationHistoryContext}\n` : ''}
El usuario te dice ahora: "${userPrompt.trim()}"

Responde como Dotzi con tu toque único, empático y personalizado manteniendo la coherencia de la conversación:`

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
      console.error('Gemini API HTTP Error in Dotzi Chat:', await response.text())
      return { error: 'Error al conectar con la personalidad de Dotzi.' }
    }

    const resJson = await response.json()
    const botReply = resJson?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!botReply) {
      return { error: 'Dotzi se ha quedado pensativo. ¡Prueba otra vez!' }
    }

    const trimmedReply = botReply.trim()
    let replyMsgId: string | undefined

    // Guardar respuesta de Dotzi en DB si el usuario está autenticado
    if (user) {
      const { data: insertedReply } = await supabase
        .from('dotzi_chat_messages')
        .insert({
          user_id: user.id,
          household_id: householdId || null,
          sender: 'dotzi',
          content: trimmedReply,
        })
        .select('id')
        .single()

      if (insertedReply) {
        replyMsgId = insertedReply.id
      }
    }

    return {
      reply: trimmedReply,
      userMessageId: userMsgId,
      replyMessageId: replyMsgId,
    }
  } catch (err: any) {
    console.error('chatWithDotziAction Error:', err)
    return { error: 'Error al hablar con Dotzi.' }
  }
}

