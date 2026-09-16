'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Square, Trash2, Send, Play, Pause, Mic } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from '@/components/ui/toast'

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob, duration: number, mimeType: string) => void
  onCancel: () => void
}

export function AudioRecorder({ onAudioRecorded, onCancel }: AudioRecorderProps) {
  const { t } = useI18n()
  const [isRecording, setIsRecording] = useState<boolean>(true)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false)
  const [detectedMimeType, setDetectedMimeType] = useState<string>('audio/webm')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = React.useCallback(async () => {
    try {
      audioChunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Determinar mimeType soportado por el navegador
      let mimeType = 'audio/webm'
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }
      setDetectedMimeType(mimeType)

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      recorder.start(200) // colectar trozos cada 200ms
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error al acceder al micrófono:', err)
      toast.add({
        title: t('chat.micPermissionError'),
        type: 'error',
      })
      onCancel()
    }
  }, [onCancel, t])

  // Iniciar la grabación automáticamente al montar el componente
  useEffect(() => {
    startRecording()
    return () => {
      cleanup()
    }
  }, [startRecording, cleanup])

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    setIsRecording(false)
  }

  const handleTogglePreviewPlay = () => {
    if (!audioUrl) return
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioUrl)
      previewAudioRef.current.onended = () => setIsPlayingPreview(false)
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause()
      setIsPlayingPreview(false)
    } else {
      previewAudioRef.current.play()
      setIsPlayingPreview(true)
    }
  }

  const handleSend = () => {
    if (isRecording) {
      // Detener y enviar de inmediato
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: detectedMimeType })
          onAudioRecorded(blob, recordingTime, detectedMimeType)
        }
        mediaRecorderRef.current.stop()
      }
    } else if (audioBlob) {
      onAudioRecorded(audioBlob, recordingTime, detectedMimeType)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="flex items-center justify-between w-full gap-2 px-3 py-2 bg-slate-900/90 dark:bg-slate-900/95 border border-red-500/30 rounded-2xl shadow-lg backdrop-blur-md transition-all">
      {/* Indicador de estado */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isRecording ? (
          <div className="relative flex items-center justify-center w-8 h-8">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-red-500/50" />
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md">
              <Mic className="w-2.5 h-2.5" />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTogglePreviewPlay}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors shadow-md"
            title="Escuchar vista previa"
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        )}

        {/* Temporizador y estado */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
            {isRecording ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {t('chat.recordingAudio')}
              </>
            ) : (
              <span className="text-emerald-400">{t('chat.audioAttached')}</span>
            )}
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Barras de onda simuladas durante la grabación */}
        {isRecording && (
          <div className="flex items-center gap-0.5 h-5 ml-2 hidden sm:flex">
            <div className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
            <div className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-5" />
            <div className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2" />
            <div className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_150ms] h-4" />
            <div className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_250ms] h-5" />
            <div className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_350ms] h-3" />
          </div>
        )}
      </div>

      {/* Acciones de control */}
      <div className="flex items-center gap-2">
        {/* Cancelar / Descartar */}
        <button
          type="button"
          onClick={() => {
            cleanup()
            onCancel()
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
          title={t('chat.cancelRecording')}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Parar grabación para escuchar vista previa */}
        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            title={t('chat.stopRecording')}
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        {/* Confirmar / Enviar */}
        <button
          type="button"
          onClick={handleSend}
          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          title={t('chat.send')}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
