'use client'

import { useActionState, useState, useRef } from 'react'
import { updateProfileNameAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, User, Smile, Camera, Loader2, Trash2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface ProfileNameFormProps {
  initialName: string
  initialAvatarUrl?: string
  initialStatus?: string
  userId: string
}

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function ProfileNameForm({
  initialName,
  initialAvatarUrl = '',
  initialStatus = '',
  userId,
}: ProfileNameFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileNameAction,
    initialState
  )

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [status, setStatus] = useState(initialStatus)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validations
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecciona un archivo de imagen válido (.png, .jpg, .jpeg, etc.)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('La imagen debe ser menor a 2MB.')
      return
    }

    setUploadError(null)
    setIsUploading(true)

    try {
      // Definir la ruta del archivo: avatars/{userId}/avatar-{timestamp}.png
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Subir archivo al bucket "avatars"
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        throw error
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (err: any) {
      console.error('Error al subir la imagen:', err)
      setUploadError('Error al subir la imagen. Por favor, inténtalo de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl('')
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const initials = initialName.substring(0, 2).toUpperCase() || 'U'

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de subida</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      {/* Input oculto para la subida de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Inputs ocultos que se enviarán con el form */}
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      {/* Sección del Avatar del Perfil */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-2 border-b border-border/40">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <Avatar className="h-24 w-24 border-2 border-border shadow-md relative overflow-hidden transition-all duration-300 group-hover:opacity-90">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={initialName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay de cámara al pasar el ratón */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center sm:items-start gap-2">
          <h3 className="font-semibold text-foreground text-sm">Imagen de Perfil</h3>
          <p className="text-xs text-muted-foreground text-center sm:text-left max-w-[280px]">
            Formatos aceptados: PNG, JPG, JPEG. Tamaño máximo de 2MB.
          </p>
          <div className="flex gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="text-xs h-8"
            >
              Cambiar Imagen
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Campo: Nombre para Mostrar */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Nombre para mostrar</Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={initialName}
            required
            className="pl-9 bg-muted/50 focus:bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Este nombre será visible para los demás miembros de tu hogar en los gastos.
        </p>
      </div>

      {/* Campo: Estado de perfil */}
      <div className="space-y-2">
        <Label htmlFor="status">Estado de perfil</Label>
        <div className="relative">
          <Smile className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="status"
            name="status"
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="¿Qué estás haciendo? Ej. Trabajando 💻, Comprando 🛒"
            className="pl-9 bg-muted/50 focus:bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Un estado corto que otros miembros de tu familia verán en la app.
        </p>
      </div>

      <Button type="submit" disabled={pending || isUploading} className="w-full sm:w-auto">
        {pending ? 'Guardando cambios...' : 'Guardar Cambios'}
      </Button>
    </form>
  )
}
