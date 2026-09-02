/**
 * Helper de validación de archivos en servidor (MIME type + tamaño máximo)
 */

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateUploadedFile(file: File | null): FileValidationResult {
  if (!file || file.size === 0) {
    return { valid: true }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    }
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o documentos PDF.',
    }
  }

  return { valid: true }
}
