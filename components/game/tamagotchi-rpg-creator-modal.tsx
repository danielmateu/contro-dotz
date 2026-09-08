'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import { UserGameState, DotziGender, DotziPersonality } from '@/lib/game/game-service'
import {
  Sparkles,
  Wand2,
  Shield,
  Utensils,
  Compass,
  Sun,
  PartyPopper,
  CheckCircle2,
  Edit3,
  User,
  Scale,
  Palette,
  Scissors,
  Zap,
  Smile,
  CircleDot,
} from 'lucide-react'

interface TamagotchiRpgCreatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: UserGameState
  onStateChange: (newState: UserGameState) => Promise<void>
  locale?: string
}

export function TamagotchiRpgCreatorModal({
  open,
  onOpenChange,
  gameState,
  onStateChange,
  locale = 'es',
}: TamagotchiRpgCreatorModalProps) {
  const isCatalan = locale === 'ca'

  // Estado local para el formulario RPG
  const [petName, setPetName] = useState(gameState.petName || 'Dotzi')
  const [gender, setGender] = useState<DotziGender>(gameState.gender || 'neutral')
  const [personality, setPersonality] = useState<DotziPersonality>(gameState.personality || 'saver')
  const [skinColor, setSkinColor] = useState(gameState.skinColor || 'skin_indigo')
  const [hairstyle, setHairstyle] = useState(gameState.hairstyle || 'hair_none')
  const [weight, setWeight] = useState(gameState.weight ?? 50)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPetName(gameState.petName || 'Dotzi')
      setGender(gameState.gender || 'neutral')
      setPersonality(gameState.personality || 'saver')
      setSkinColor(gameState.skinColor || 'skin_indigo')
      setHairstyle(gameState.hairstyle || 'hair_none')
      setWeight(gameState.weight ?? 50)
    }
  }, [open, gameState])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newState: UserGameState = {
        ...gameState,
        petName: petName.trim() || 'Dotzi',
        gender,
        personality,
        skinColor,
        hairstyle,
        weight,
      }
      await onStateChange(newState)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const personalities: { id: DotziPersonality; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'saver',
      label: isCatalan ? 'Estalviador Compulsiu' : 'Ahorrador Compulsivo',
      icon: <Shield className="w-4 h-4 text-emerald-500" />,
      desc: isCatalan ? 'Cuida cada moneda com si fos or pur.' : 'Protege cada moneda con uñas y dientes.',
    },
    {
      id: 'foodie',
      label: isCatalan ? 'Glotó Alegre' : 'Glotón Alegre',
      icon: <Utensils className="w-4 h-4 text-rose-500" />,
      desc: isCatalan ? 'Li encanta menjar i estar feliçment rechoncho.' : '¡Le fascina probar delicias y estar bien alimentado!',
    },
    {
      id: 'adventurer',
      label: isCatalan ? 'Aventurer' : 'Aventurero',
      icon: <Compass className="w-4 h-4 text-amber-500" />,
      desc: isCatalan ? 'Sempre buscant noves misions i reptes.' : 'Siempre listo para afrontar misiones y metas.',
    },
    {
      id: 'zen',
      label: isCatalan ? 'Zen Financer' : 'Zen Financiero',
      icon: <Sun className="w-4 h-4 text-cyan-500" />,
      desc: isCatalan ? 'Pau mental i despeses en serenitat.' : 'Mantiene la calma y el presupuesto bajo control.',
    },
    {
      id: 'party',
      label: isCatalan ? 'Fiester' : 'Fiestero',
      icon: <PartyPopper className="w-4 h-4 text-purple-500" />,
      desc: isCatalan ? 'Ho celebra tot amb la família!' : '¡Celebra cada logro del hogar con alegría!',
    },
  ]

  const skinColors = [
    { id: 'skin_indigo', name: isCatalan ? 'Menta Clàssic' : 'Menta Clásico', colorBg: 'bg-emerald-500' },
    { id: 'skin_purple', name: isCatalan ? 'Púrpura Cíber' : 'Púrpura Cíber', colorBg: 'bg-purple-500' },
    { id: 'skin_cyan', name: isCatalan ? 'Cian Oceà' : 'Cian Océano', colorBg: 'bg-cyan-500' },
    { id: 'skin_amber', name: isCatalan ? 'Daurat Estalviador' : 'Dorado Ahorrador', colorBg: 'bg-amber-500' },
    { id: 'skin_rose', name: isCatalan ? 'Rosa Coquette' : 'Rosa Coquette', colorBg: 'bg-pink-500' },
  ]

  const hairstyles: { id: string; name: string; icon: React.ReactNode }[] = [
    { id: 'hair_none', name: isCatalan ? 'Sense Peinat' : 'Sin Peinado', icon: <Smile className="w-3.5 h-3.5 text-muted-foreground" /> },
    { id: 'hair_copete', name: isCatalan ? 'Copete Cool' : 'Copete Cool', icon: <Scissors className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'hair_cresta', name: isCatalan ? 'Cresta Punk' : 'Cresta Punk', icon: <Zap className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'hair_afro', name: isCatalan ? 'Afro Retro' : 'Afro Retro', icon: <CircleDot className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'hair_bow', name: isCatalan ? 'Llaç Coquette' : 'Lazo Coquette', icon: <Sparkles className="w-3.5 h-3.5 text-pink-500" /> },
    { id: 'hair_spikes', name: isCatalan ? 'Pics Anime' : 'Picos Anime', icon: <Zap className="w-3.5 h-3.5 text-sky-500" /> },
  ]

  const activePersonality = personalities.find((p) => p.id === personality)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader className="space-y-1 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-heading flex items-center gap-2">
                <span>{isCatalan ? 'Creador de Personatge RPG' : 'Creador de Personaje RPG'}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isCatalan
                  ? 'Personalitza el teu Dotzi des de zero: Nom, Sexe, Caràcter i Aparència.'
                  : 'Personaliza tu Dotzi desde cero: Nombre, Sexo, Carácter y Apariencia.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-2 items-stretch">
          {/* Columna Izquierda: Vista Previa Limpia de Dotzi */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-linear-to-b from-primary/10 via-card to-violet-500/10 rounded-3xl border border-border/60 shadow-xs space-y-4">
            <div className="relative p-2 flex justify-center">
              <TamagotchiAvatar
                size="xl"
                skinColor={skinColor}
                hairstyle={hairstyle}
                equippedAccessory={gameState.equippedAccessory}
                weight={weight}
                cleanliness={gameState.cleanliness}
                interactive={false}
              />
            </div>

            <div className="text-center space-y-2 w-full">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-lg tracking-tight">
                  {petName || 'Dotzi'}
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-primary/20">
                  {gender === 'boy' ? 'Chico' : gender === 'girl' ? 'Chica' : 'Neutro'}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground italic px-2 leading-relaxed">
                "{activePersonality?.desc}"
              </p>
            </div>
          </div>

          {/* Columna Derecha: Opciones del Formulario RPG */}
          <div className="md:col-span-7 space-y-5">
            {/* 1. Nombre de tu Dotzi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>{isCatalan ? 'Nom del teu Dotzi' : 'Nombre de tu Dotzi'}</span>
              </Label>
              <Input
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Ej. Dotzi Jr."
                className="rounded-xl h-9 text-sm"
                maxLength={20}
              />
            </div>

            {/* 2. Sexo / Identidad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{isCatalan ? 'Sexe / Identitat' : 'Sexo / Identidad'}</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'boy', label: 'Chico' },
                  { id: 'girl', label: 'Chica' },
                  { id: 'neutral', label: 'Neutro' },
                ].map((g) => (
                  <Button
                    key={g.id}
                    type="button"
                    variant={gender === g.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGender(g.id as DotziGender)}
                    className="rounded-xl h-9 text-xs font-semibold px-2"
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 3. Constitución Física Inicial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>{isCatalan ? 'Constitució Física Inicial' : 'Constitución Física Inicial'}</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { w: 80, label: 'Gordito' },
                  { w: 50, label: 'Equilibrado' },
                  { w: 25, label: 'Delgado' },
                ].map((item) => (
                  <Button
                    key={item.w}
                    type="button"
                    variant={weight === item.w ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWeight(item.w)}
                    className="rounded-xl h-9 text-xs font-semibold px-2"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 4. Carácter RPG */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                <span>{isCatalan ? 'Caràcter RPG' : 'Carácter RPG'}</span>
              </Label>
              <div className="grid grid-cols-1 gap-1.5">
                {personalities.map((p) => {
                  const isSelected = personality === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPersonality(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border/60 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-background border border-border/40 shrink-0">
                          {p.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{p.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.desc}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 ml-2" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 5. Color de Piel */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span>{isCatalan ? 'Color de Pell' : 'Color de Piel'}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {skinColors.map((sk) => (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => setSkinColor(sk.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      skinColor === sk.id
                        ? 'border-primary ring-2 ring-primary/30 font-bold bg-primary/5'
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${sk.colorBg}`} />
                    <span>{sk.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Peinado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-primary" />
                <span>{isCatalan ? 'Peinat' : 'Peinado'}</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hairstyles.map((h) => (
                  <Button
                    key={h.id}
                    type="button"
                    variant={hairstyle === h.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHairstyle(h.id)}
                    className="rounded-xl h-auto py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 text-center leading-tight min-h-[38px]"
                  >
                    <span className="shrink-0">{h.icon}</span>
                    <span className="whitespace-normal">{h.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/40 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            {isCatalan ? 'Cancel·lar' : 'Cancelar'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl font-bold bg-linear-to-r from-primary to-indigo-600 shadow-md gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isSaving ? 'Guardant...' : isCatalan ? 'Guardar Personatge' : 'Guardar Personaje'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
