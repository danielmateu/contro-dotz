'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, FileText, ChevronDown, ChevronUp, Copy, Check, Sparkles, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

interface AudioPlayerProps {
  url: string
  duration?: number
  transcription?: string
  isTranscribing?: boolean
  isOwnMessage?: boolean
}

export function AudioPlayer({
  url,
  duration = 0,
  transcription,
  isTranscribing = false,
  isOwnMessage = false,
}: AudioPlayerProps) {
  const { t } = useI18n()
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [audioDuration, setAudioDuration] = useState<number>(duration)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [showTranscription, setShowTranscription] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(url)
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(Math.round(audio.duration))
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [url])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.playbackRate = playbackRate
      audioRef.current.play().catch((err) => console.error('Error playing audio:', err))
      setIsPlaying(true)
    }
  }

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2]
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length
    const newSpeed = speeds[nextIndex]
    setPlaybackRate(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleCopyTranscription = () => {
    if (!transcription) return
    navigator.clipboard.writeText(transcription)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs sm:max-w-sm">
      {/* Tarjeta del reproductor */}
      <div
        className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${
          isOwnMessage
            ? 'bg-emerald-600/20 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-100'
            : 'bg-slate-800/80 dark:bg-slate-900/80 border-slate-700/50 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Botón Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 ${
              isOwnMessage
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Barra de tiempo y Slider */}
          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>

            {/* Slider Seekbar */}
            <input
              type="range"
              min={0}
              max={audioDuration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
          </div>

          {/* Selector de velocidad */}
          <button
            type="button"
            onClick={handleSpeedChange}
            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-600/30"
            title="Cambiar velocidad"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Estado / Botón de Transcripción */}
        {(transcription || isTranscribing) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/30 text-xs">
            {isTranscribing ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 animate-pulse font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('chat.transcribingAudio')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowTranscription((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{showTranscription ? t('chat.hideTranscription') : t('chat.showTranscription')}</span>
                {showTranscription ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bloque desplegable de Transcripción */}
      {showTranscription && transcription && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-xs text-slate-300 backdrop-blur-sm shadow-inner relative group animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-emerald-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {t('chat.transcription')}
            </span>
            <button
              type="button"
              onClick={handleCopyTranscription}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Copiar transcripción"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-200 italic font-sans">
            &ldquo;{transcription}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
