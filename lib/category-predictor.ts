export interface Category {
  id: string
  name: string
}

// Mapa de palabras clave en español para asociar a las categorías principales
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  alimentacion: [
    'mercadona', 'carrefour', 'lidl', 'dia', 'consum', 'alcampo', 'ahorramas', 
    'supermercado', 'super', 'comida', 'compra semanal', 'compras semanal', 'hipercor', 
    'bonpreu', 'aldi', 'fruta', 'verdura', 'carne', 'pescado', 'panaderia', 'alimentacion'
  ],
  vivienda: [
    'alquiler', 'hipoteca', 'luz', 'agua', 'gas', 'electricidad', 'comunidad', 
    'seguro hogar', 'reparacion', 'mantenimiento', 'mueble', 'ikea', 'leroy merlin', 
    'fontanero', 'cerrajero', 'bricolaje', 'alquiler mensual', 'vivienda'
  ],
  transporte: [
    'gasolina', 'combustible', 'repsol', 'cepsa', 'bp', 'shell', 'diesel', 
    'peaje', 'autobus', 'metro', 'tren', 'renfe', 'cabify', 'uber', 'taxi', 
    'parking', 'aparcamiento', 'taller', 'itv', 'coche', 'moto', 'transporte', 'billete'
  ],
  salud: [
    'farmacia', 'medico', 'dentista', 'optica', 'psicologo', 'hospital', 
    'medicamento', 'sanitas', 'adeslas', 'asisa', 'clinica', 'salud', 'pastillas', 'jarabe'
  ],
  educacion: [
    'colegio', 'universidad', 'academia', 'curso', 'libro', 'material escolar', 
    'matricula', 'clase particular', 'ingles', 'master', 'educacion', 'escuela'
  ],
  ocio: [
    'cine', 'teatro', 'concierto', 'festival', 'museo', 'viaje', 'hotel', 
    'vuelo', 'reserva', 'airbnb', 'ocio', 'juego', 'playstation', 'nintendo', 
    'steam', 'espectaculo', 'vacaciones', 'turismo'
  ],
  ropa: [
    'zara', 'h&m', 'mango', 'ropa', 'calzado', 'zapato', 'tienda', 'decathlon', 
    'pull&bear', 'stradivarius', 'bershka', 'massimo dutti', 'primark', 'vestido',
    'pantalon', 'camisa', 'zapatillas', 'calzoncillo', 'calcetines'
  ],
  suscripciones: [
    'netflix', 'spotify', 'prime', 'amazon prime', 'disney', 'hbo', 'dazn', 
    'youtube premium', 'apple', 'icloud', 'suscripcion', 'mensualidad', 'game pass'
  ],
  restaurantes: [
    'restaurante', 'cena', 'comida fuera', 'bar', 'cafeteria', 'pizza', 
    'burguer', 'mcdonald', 'burger king', 'starbucks', 'tapa', 'caña', 
    'copa', 'club', 'telepizza', 'dominos', 'kfc', 'pizzeria', 'cañas', 'cerveza'
  ],
  compras: [
    'amazon', 'aliexpress', 'shein', 'temu', 'compra online', 'el corte ingles', 
    'fnac', 'mediamarkt', 'regalo', 'compra', 'tienda online'
  ]
}

/**
 * Normaliza un texto eliminando tildes y convirtiéndolo a minúsculas
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Predice la categoría de un gasto basándose en su descripción
 * @param description Concepto o descripción del gasto
 * @param categories Listado de categorías disponibles en el hogar
 * @returns La categoría coincidente o null si no se encuentra coincidencia clara
 */
export function predictCategory(description: string, categories: Category[]): Category | null {
  if (!description || description.trim().length < 2 || categories.length === 0) {
    return null
  }

  const normalizedDesc = normalizeText(description)

  // 1. Intentar buscar coincidencia directa por palabra clave
  for (const [categoryKey, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Comprobar si alguna palabra clave está incluida en la descripción
    const hasKeyword = keywords.some(keyword => {
      const normalizedKeyword = normalizeText(keyword)
      // Comprobar coincidencia exacta de palabra o inclusión limpia
      const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i')
      return regex.test(normalizedDesc) || normalizedDesc.includes(normalizedKeyword)
    })

    if (hasKeyword) {
      // Buscar en el listado de categorías del hogar la que más se parezca a la clave
      // Ej: si la clave es 'alimentacion', buscar la categoría con nombre 'Alimentación'
      const matchedCategory = categories.find(cat => {
        const normalizedCatName = normalizeText(cat.name)
        // Comparación flexible (alimentacion vs alimentacion)
        return (
          normalizedCatName === categoryKey ||
          normalizedCatName.includes(categoryKey) ||
          categoryKey.includes(normalizedCatName)
        )
      })

      if (matchedCategory) {
        return matchedCategory
      }
    }
  }

  // 2. Coincidencia secundaria: buscar si el nombre de alguna categoría del hogar está directamente en la descripción
  for (const cat of categories) {
    const normalizedCatName = normalizeText(cat.name)
    if (normalizedCatName.length > 3 && normalizedDesc.includes(normalizedCatName)) {
      return cat
    }
  }

  return null
}
