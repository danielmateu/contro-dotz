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
import { TamagotchiAvatar, MaleIcon, FemaleIcon } from '@/components/game/tamagotchi-avatar'
import { UserGameState, DotziGender, DotziPersonality } from '@/lib/game/game-service'
import { useI18n } from '@/lib/i18n/i18n-context'
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
  const { t } = useI18n()

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
      label: t('tamagotchi.persSaverLabel'),
      icon: <Shield className="w-4 h-4 text-emerald-500" />,
      desc: t('tamagotchi.persSaverDesc'),
    },
    {
      id: 'foodie',
      label: t('tamagotchi.persFoodieLabel'),
      icon: <Utensils className="w-4 h-4 text-rose-500" />,
      desc: t('tamagotchi.persFoodieDesc'),
    },
    {
      id: 'adventurer',
      label: t('tamagotchi.persAdventurerLabel'),
      icon: <Compass className="w-4 h-4 text-amber-500" />,
      desc: t('tamagotchi.persAdventurerDesc'),
    },
    {
      id: 'zen',
      label: t('tamagotchi.persZenLabel'),
      icon: <Sun className="w-4 h-4 text-cyan-500" />,
      desc: t('tamagotchi.persZenDesc'),
    },
    {
      id: 'party',
      label: t('tamagotchi.persPartyLabel'),
      icon: <PartyPopper className="w-4 h-4 text-purple-500" />,
      desc: t('tamagotchi.persPartyDesc'),
    },
  ]

  const skinColors = [
    { id: 'skin_indigo', name: t('tamagotchi.skinIndigo'), colorBg: 'bg-emerald-500' },
    { id: 'skin_purple', name: t('tamagotchi.skinPurple'), colorBg: 'bg-purple-500' },
    { id: 'skin_cyan', name: t('tamagotchi.skinCyan'), colorBg: 'bg-cyan-500' },
    { id: 'skin_amber', name: t('tamagotchi.skinAmber'), colorBg: 'bg-amber-500' },
    { id: 'skin_rose', name: t('tamagotchi.skinRose'), colorBg: 'bg-pink-500' },
  ]

  const hairstyles: { id: string; name: string; icon: React.ReactNode }[] = [
    { id: 'hair_none', name: t('tamagotchi.hairNone'), icon: <Smile className="w-3.5 h-3.5 text-muted-foreground" /> },
    { id: 'hair_copete', name: t('tamagotchi.hairCopete'), icon: <Scissors className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'hair_cresta', name: t('tamagotchi.hairCresta'), icon: <Zap className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'hair_afro', name: t('tamagotchi.hairAfro'), icon: <CircleDot className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'hair_bow', name: t('tamagotchi.hairBow'), icon: <Sparkles className="w-3.5 h-3.5 text-pink-500" /> },
    { id: 'hair_spikes', name: t('tamagotchi.hairSpikes'), icon: <Zap className="w-3.5 h-3.5 text-sky-500" /> },
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
                <span>{t('tamagotchi.rpgCreator')}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t('tamagotchi.rpgSubtitle')}
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
                gender={gender}
                interactive={false}
              />
            </div>

            <div className="text-center space-y-2 w-full">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-lg tracking-tight">
                  {petName || 'Dotzi'}
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-primary/20">
                  {gender === 'boy' ? t('tamagotchi.boy') : gender === 'girl' ? t('tamagotchi.girl') : t('tamagotchi.neutral')}
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
                <span>{t('tamagotchi.nameLabel')}</span>
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
                <span>{t('tamagotchi.genderLabel')}</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'boy', label: t('tamagotchi.boy'), icon: <MaleIcon className="w-3.5 h-3.5" /> },
                  { id: 'girl', label: t('tamagotchi.girl'), icon: <FemaleIcon className="w-3.5 h-3.5" /> },
                  { id: 'neutral', label: t('tamagotchi.neutral'), icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
                ].map((g) => (
                  <Button
                    key={g.id}
                    type="button"
                    variant={gender === g.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGender(g.id as DotziGender)}
                    className="rounded-xl h-9 text-xs font-semibold px-2 flex items-center justify-center gap-1"
                  >
                    {g.icon}
                    <span>{g.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* 3. Constitución Física Inicial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>{t('tamagotchi.physiqueLabel')}</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { w: 80, label: t('tamagotchi.weightGordito') },
                  { w: 50, label: t('tamagotchi.weightEquilibrado') },
                  { w: 25, label: t('tamagotchi.weightDelgado') },
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
                <span>{t('tamagotchi.personalityLabel')}</span>
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
                <span>{t('tamagotchi.skinColorLabel')}</span>
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
                <span>{t('tamagotchi.hairstyleLabel')}</span>
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
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl font-bold bg-linear-to-r from-primary to-indigo-600 shadow-md gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isSaving ? t('tamagotchi.savingCharacter') : t('tamagotchi.saveCharacter')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
