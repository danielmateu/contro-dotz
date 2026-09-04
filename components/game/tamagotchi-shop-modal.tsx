'use client'

import React, { useState } from 'react'
import {
  SHOP_ITEMS,
  ShopItem,
  UserGameState,
  saveUserGameState,
} from '@/lib/game/game-service'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Shirt, Coins, Check } from 'lucide-react'

interface TamagotchiShopModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: UserGameState
  onStateChange: (newState: UserGameState) => void
  locale?: string
}

export function TamagotchiShopModal({
  open,
  onOpenChange,
  gameState,
  onStateChange,
  locale = 'es',
}: TamagotchiShopModalProps) {
  const isCatalan = locale === 'ca'
  const [activeTab, setActiveTab] = useState<'shop' | 'wardrobe' | 'style' | 'food'>('shop')
  const [previewAccessory, setPreviewAccessory] = useState<string>(gameState.equippedAccessory)
  const [previewSkin, setPreviewSkin] = useState<string>(gameState.skinColor || 'skin_indigo')
  const [previewHair, setPreviewHair] = useState<string>(gameState.hairstyle || 'hair_none')
  const [eatingFood, setEatingFood] = useState<string | null>(null)

  const handleBuy = async (item: ShopItem) => {
    if (gameState.coins < item.price) return
    if (gameState.unlockedItems.includes(item.id)) return

    const newCoins = gameState.coins - item.price
    const newUnlocked = [...gameState.unlockedItems, item.id]

    let newAccessory = gameState.equippedAccessory
    let newSkin = gameState.skinColor || 'skin_indigo'
    let newHair = gameState.hairstyle || 'hair_none'

    if (item.category === 'skin') {
      newSkin = item.id
      setPreviewSkin(item.id)
    } else if (item.category === 'hair') {
      newHair = item.id
      setPreviewHair(item.id)
    } else {
      newAccessory = item.id
      setPreviewAccessory(item.id)
    }

    const newState: UserGameState = {
      ...gameState,
      coins: newCoins,
      unlockedItems: newUnlocked,
      equippedAccessory: newAccessory,
      skinColor: newSkin,
      hairstyle: newHair,
    }

    onStateChange(newState)
    await saveUserGameState(newState)
  }

  const handleEquip = async (itemId: string, category: 'accessory' | 'skin' | 'hair') => {
    const newState: UserGameState = { ...gameState }

    if (category === 'skin') {
      newState.skinColor = itemId
      setPreviewSkin(itemId)
    } else if (category === 'hair') {
      newState.hairstyle = itemId
      setPreviewHair(itemId)
    } else {
      newState.equippedAccessory = itemId
      setPreviewAccessory(itemId)
    }

    onStateChange(newState)
    await saveUserGameState(newState)
  }

  const handleFeed = async (foodItem: ShopItem) => {
    if (gameState.coins < foodItem.price) return

    const newCoins = gameState.coins - foodItem.price
    const newState: UserGameState = {
      ...gameState,
      coins: newCoins,
    }

    // Disparar animación de comida
    setEatingFood(foodItem.icon)
    setTimeout(() => setEatingFood(null), 1500)

    onStateChange(newState)
    await saveUserGameState(newState)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-3.5 sm:p-6 rounded-3xl border-border shadow-2xl sm:max-w-xl md:max-w-2xl w-[calc(100vw-1.5rem)] max-h-[90vh] sm:max-h-[85vh] flex flex-col gap-3 sm:gap-4 overflow-hidden">
        {/* Cabecera con Saldo de Monedas */}
        <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-3 sm:pb-4 pr-8 sm:pr-6 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>{isCatalan ? 'Botiga, Armari i Menjar de Dotzi' : 'Tienda, Armario y Comida de Dotzi'}</span>
            </DialogTitle>

            <Badge className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold px-2.5 sm:px-3 py-1 text-xs gap-1.5 rounded-xl shrink-0">
              <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{gameState.coins} Coins</span>
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isCatalan
              ? 'Personalitza la pell, el peinat, els accesoris i alimenta en Dotzi.'
              : 'Personaliza la piel, el peinado, los accesorios y alimenta a Dotzi.'}
          </DialogDescription>
        </DialogHeader>

        {/* Contenido Principal Grid: Vista previa + Catálogo */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start min-h-0 flex-1 overflow-y-auto sm:overflow-hidden">
          {/* Vista Previa de Dotzi */}
          <div className="sm:col-span-4 flex flex-row sm:flex-col items-center justify-center bg-linear-to-b from-muted/50 to-muted/20 p-3 sm:p-4 rounded-2xl border border-border/50 relative overflow-hidden gap-3 sm:gap-2 shrink-0">
            <div className="shrink-0">
              <TamagotchiAvatar
                mood="happy"
                size="lg"
                equippedAccessory={previewAccessory}
                skinColor={previewSkin}
                hairstyle={previewHair}
                eatingFood={eatingFood}
                interactive={true}
              />
            </div>
            <div className="text-left sm:text-center min-w-0">
              <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold block line-clamp-2">
                {eatingFood ? (
                  <span className="text-emerald-500 font-bold">{isCatalan ? 'Menjant feliç! 😋' : '¡Comiendo feliz! 😋'}</span>
                ) : (
                  SHOP_ITEMS.find((i) => i.id === previewAccessory)?.name[isCatalan ? 'ca' : 'es'] || (isCatalan ? 'Sense accessori' : 'Sin accesorio')
                )}
              </span>
            </div>
          </div>

          {/* Pestañas: Tienda vs Armario vs Estilo vs Comida */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="sm:col-span-8 flex flex-col min-h-0 h-full w-full">
            <TabsList className="grid grid-cols-4 rounded-2xl bg-muted/60 p-1 shrink-0">
              <TabsTrigger value="shop" className="rounded-xl font-bold text-[11px] sm:text-xs gap-1 px-1 sm:px-2">
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isCatalan ? 'Botiga' : 'Tienda'}</span>
              </TabsTrigger>
              <TabsTrigger value="wardrobe" className="rounded-xl font-bold text-[11px] sm:text-xs gap-1 px-1 sm:px-2">
                <Shirt className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isCatalan ? 'Armari' : 'Armario'}</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="rounded-xl font-bold text-[11px] sm:text-xs gap-1 px-1 sm:px-2">
                <span className="text-xs">🎨</span>
                <span className="truncate">{isCatalan ? 'Estil' : 'Estilo'}</span>
              </TabsTrigger>
              <TabsTrigger value="food" className="rounded-xl font-bold text-[11px] sm:text-xs gap-1 px-1 sm:px-2">
                <span className="text-xs">🍕</span>
                <span className="truncate">{isCatalan ? 'Menjar' : 'Comida'}</span>
              </TabsTrigger>
            </TabsList>

            {/* Contenido Tienda (Accesorios) */}
            <TabsContent value="shop" className="space-y-2.5 pt-3 max-h-70 sm:max-h-85 overflow-y-auto pr-1 flex-1">
              {SHOP_ITEMS.filter((i) => i.category !== 'skin' && i.category !== 'hair' && i.category !== 'food').map((item) => {
                const isUnlocked = gameState.unlockedItems.includes(item.id)
                const isEquipped = gameState.equippedAccessory === item.id
                const canAfford = gameState.coins >= item.price

                return (
                  <div
                    key={item.id}
                    className="p-2.5 sm:p-3 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-between gap-2 sm:gap-3 cursor-pointer"
                    onClick={() => setPreviewAccessory(item.id)}
                    onMouseEnter={() => setPreviewAccessory(item.id)}
                    onMouseLeave={() => setPreviewAccessory(gameState.equippedAccessory)}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="text-xl sm:text-2xl shrink-0 select-none bg-background p-1.5 sm:p-2 rounded-xl border border-border/40 shadow-2xs">
                        {item.icon}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-extrabold text-foreground truncate">
                          {isCatalan ? item.name.ca : item.name.es}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug line-clamp-1">
                          {isCatalan ? item.description.ca : item.description.es}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isUnlocked ? (
                        <Button
                          size="sm"
                          variant={isEquipped ? 'default' : 'outline'}
                          onClick={() => handleEquip(item.id, 'accessory')}
                          className="rounded-xl text-xs font-bold gap-1 h-8 px-2.5 sm:px-3"
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isCatalan ? 'Equipat' : 'Equipado'}</span>
                            </>
                          ) : (
                            <span>{isCatalan ? 'Equipar' : 'Equipar'}</span>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!canAfford}
                          onClick={() => handleBuy(item)}
                          className={`rounded-xl text-xs font-bold gap-1.5 h-8 px-2.5 sm:px-3 ${canAfford ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs' : ''
                            }`}
                        >
                          <Coins className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>{item.price}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            {/* Contenido Armario (Accesorios Desbloqueados) */}
            <TabsContent value="wardrobe" className="space-y-2.5 pt-3 max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-1 flex-1">
              <div
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 sm:gap-3 cursor-pointer ${gameState.equippedAccessory === 'none'
                  ? 'border-primary bg-primary/10'
                  : 'border-border/60 bg-muted/30 hover:bg-muted/50'
                  }`}
                onClick={() => setPreviewAccessory('none')}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="text-xl">🚫</span>
                  <span className="text-xs font-bold">
                    {isCatalan ? 'Sense accesori' : 'Sin accesorio'}
                  </span>
                </div>
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant={gameState.equippedAccessory === 'none' ? 'default' : 'outline'}
                    onClick={() => handleEquip('none', 'accessory')}
                    className="rounded-xl text-xs font-bold h-8 px-2.5 sm:px-3"
                  >
                    {gameState.equippedAccessory === 'none'
                      ? isCatalan ? 'Equipat' : 'Equipado'
                      : isCatalan ? 'Equipar' : 'Equipar'}
                  </Button>
                </div>
              </div>

              {SHOP_ITEMS.filter((i) => gameState.unlockedItems.includes(i.id) && i.category !== 'skin' && i.category !== 'hair' && i.category !== 'food').map((item) => {
                const isEquipped = gameState.equippedAccessory === item.id

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 sm:gap-3 cursor-pointer ${isEquipped ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/30 hover:bg-muted/50'
                      }`}
                    onClick={() => setPreviewAccessory(item.id)}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="text-xl sm:text-2xl shrink-0 select-none">{item.icon}</span>
                      <span className="text-xs font-bold text-foreground truncate">
                        {isCatalan ? item.name.ca : item.name.es}
                      </span>
                    </div>

                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={isEquipped ? 'default' : 'outline'}
                        onClick={() => handleEquip(item.id, 'accessory')}
                        className="rounded-xl text-xs font-bold h-8 px-2.5 sm:px-3"
                      >
                        {isEquipped
                          ? isCatalan ? 'Equipat' : 'Equipado'
                          : isCatalan ? 'Equipar' : 'Equipar'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            {/* Contenido Estilo (Colores de Piel & Peinados) */}
            <TabsContent value="style" className="space-y-3 pt-3 max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-1 flex-1">
              <div>
                <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                  {isCatalan ? '🎨 Color de Pell' : '🎨 Color de Piel'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SHOP_ITEMS.filter((i) => i.category === 'skin').map((item) => {
                    const isUnlocked = gameState.unlockedItems.includes(item.id) || item.price === 0
                    const isEquipped = (gameState.skinColor || 'skin_indigo') === item.id
                    const canAfford = gameState.coins >= item.price

                    return (
                      <div
                        key={item.id}
                        className={`p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${isEquipped ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/30 hover:bg-muted/50'
                          }`}
                        onClick={() => setPreviewSkin(item.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{item.icon}</span>
                          <span className="text-xs font-bold truncate">{isCatalan ? item.name.ca : item.name.es}</span>
                        </div>
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isUnlocked ? (
                            <Button
                              size="sm"
                              variant={isEquipped ? 'default' : 'outline'}
                              onClick={() => handleEquip(item.id, 'skin')}
                              className="rounded-xl text-[11px] font-bold h-7 px-2"
                            >
                              {isEquipped ? (isCatalan ? 'Actiu' : 'Activo') : (isCatalan ? 'Posar' : 'Usar')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!canAfford}
                              onClick={() => handleBuy(item)}
                              className="rounded-xl text-[11px] font-bold gap-1 h-7 px-2 bg-amber-500 text-slate-950"
                            >
                              <Coins className="w-3 h-3 fill-current" />
                              <span>{item.price}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mb-2 pt-2">
                  {isCatalan ? '💇‍♂️ Peinats i Capells' : '💇‍♂️ Peinados y Capello'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SHOP_ITEMS.filter((i) => i.category === 'hair').map((item) => {
                    const isUnlocked = gameState.unlockedItems.includes(item.id) || item.price === 0
                    const isEquipped = (gameState.hairstyle || 'hair_none') === item.id
                    const canAfford = gameState.coins >= item.price

                    return (
                      <div
                        key={item.id}
                        className={`p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${isEquipped ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/30 hover:bg-muted/50'
                          }`}
                        onClick={() => setPreviewHair(item.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{item.icon}</span>
                          <span className="text-xs font-bold truncate">{isCatalan ? item.name.ca : item.name.es}</span>
                        </div>
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isUnlocked ? (
                            <Button
                              size="sm"
                              variant={isEquipped ? 'default' : 'outline'}
                              onClick={() => handleEquip(item.id, 'hair')}
                              className="rounded-xl text-[11px] font-bold h-7 px-2"
                            >
                              {isEquipped ? (isCatalan ? 'Actiu' : 'Activo') : (isCatalan ? 'Posar' : 'Usar')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!canAfford}
                              onClick={() => handleBuy(item)}
                              className="rounded-xl text-[11px] font-bold gap-1 h-7 px-2 bg-amber-500 text-slate-950"
                            >
                              <Coins className="w-3 h-3 fill-current" />
                              <span>{item.price}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Contenido Comida (Alimentar a Dotzi) */}
            <TabsContent value="food" className="space-y-2.5 pt-3 max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-1 flex-1">
              {SHOP_ITEMS.filter((i) => i.category === 'food').map((item) => {
                const canAfford = gameState.coins >= item.price

                return (
                  <div
                    key={item.id}
                    className="p-2.5 sm:p-3 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-between gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="text-2xl shrink-0 select-none bg-background p-2 rounded-xl border border-border/40 shadow-2xs">
                        {item.icon}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-extrabold text-foreground truncate">
                          {isCatalan ? item.name.ca : item.name.es}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug line-clamp-1">
                          {isCatalan ? item.description.ca : item.description.es}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="sm"
                        disabled={!canAfford}
                        onClick={() => handleFeed(item)}
                        className={`rounded-xl text-xs font-bold gap-1.5 h-8 px-2.5 sm:px-3 ${canAfford ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs' : ''
                          }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>{isCatalan ? `Alimentar (${item.price})` : `Dar (${item.price})`}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}


