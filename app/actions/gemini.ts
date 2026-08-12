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
