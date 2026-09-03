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
import { ShoppingBag, Shirt, Coins, Check, Sparkles } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'shop' | 'wardrobe'>('shop')
  const [previewAccessory, setPreviewAccessory] = useState<string>(gameState.equippedAccessory)

  const handleBuy = async (item: ShopItem) => {
    if (gameState.coins < item.price) return
    if (gameState.unlockedItems.includes(item.id)) return

    const newCoins = gameState.coins - item.price
    const newUnlocked = [...gameState.unlockedItems, item.id]

    const newState: UserGameState = {
      ...gameState,
      coins: newCoins,
      unlockedItems: newUnlocked,
      equippedAccessory: item.id, // Equipar automáticamente tras comprar
    }

    setPreviewAccessory(item.id)
    onStateChange(newState)
    await saveUserGameState(newState)
  }

  const handleEquip = async (itemId: string) => {
    const newState: UserGameState = {
      ...gameState,
      equippedAccessory: itemId,
    }

    setPreviewAccessory(itemId)
    onStateChange(newState)
    await saveUserGameState(newState)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="p-6 rounded-3xl border-border shadow-2xl min-w-xl">
        {/* Cabecera con Saldo de Monedas */}
        <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-500" />
              <span>{isCatalan ? 'Botiga i Armari de Dotzi' : 'Tienda y Armario de Dotzi'}</span>
            </DialogTitle>

            <Badge className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold px-3 py-1 text-xs gap-1.5 rounded-xl">
              <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{gameState.coins} Coins</span>
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isCatalan
              ? 'Personalitza el teu Tamagotchi amb barrets, ulleres i la cervesa fresca.'
              : 'Personaliza tu Tamagotchi con gorros, gafas y la cerveza fresca.'}
          </DialogDescription>
        </DialogHeader>

        {/* Vista Previa de Dotzi */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-muted/20 p-4 rounded-2xl border border-border/50 relative overflow-hidden">
          <TamagotchiAvatar
            mood="happy"
            size="lg"
            equippedAccessory={previewAccessory}
            interactive={true}
          />
          <span className="text-[11px] text-muted-foreground font-semibold mt-2">
            {previewAccessory === 'none'
              ? isCatalan ? 'Sense accessori equipat' : 'Sin accesorio equipado'
              : SHOP_ITEMS.find((i) => i.id === previewAccessory)?.name[isCatalan ? 'ca' : 'es']}
          </span>
        </div>

        {/* Pestañas: Tienda vs Armario */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="shop" className="rounded-xl font-bold text-xs gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{isCatalan ? 'Botiga 🛒' : 'Tienda 🛒'}</span>
            </TabsTrigger>
            <TabsTrigger value="wardrobe" className="rounded-xl font-bold text-xs gap-2">
              <Shirt className="w-4 h-4" />
              <span>{isCatalan ? 'Armari 👗' : 'Armario 👗'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Contenido Tienda */}
          <TabsContent value="shop" className="space-y-3 pt-3 max-h-[300px] overflow-y-auto pr-1">
            {SHOP_ITEMS.map((item) => {
              const isUnlocked = gameState.unlockedItems.includes(item.id)
              const isEquipped = gameState.equippedAccessory === item.id
              const canAfford = gameState.coins >= item.price

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-between gap-3"
                  onMouseEnter={() => setPreviewAccessory(item.id)}
                  onMouseLeave={() => setPreviewAccessory(gameState.equippedAccessory)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 select-none bg-background p-2 rounded-xl border border-border/40 shadow-2xs">
                      {item.icon}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-extrabold text-foreground truncate">
                        {isCatalan ? item.name.ca : item.name.es}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-snug truncate">
                        {isCatalan ? item.description.ca : item.description.es}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <Button
                        size="sm"
                        variant={isEquipped ? 'default' : 'outline'}
                        onClick={() => handleEquip(item.id)}
                        className="rounded-xl text-xs font-bold gap-1 h-8"
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
                        className={`rounded-xl text-xs font-bold gap-1.5 h-8 ${canAfford ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs' : ''
                          }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current" />
                        <span>{item.price}</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          {/* Contenido Armario */}
          <TabsContent value="wardrobe" className="space-y-3 pt-3 max-h-[300px] overflow-y-auto pr-1">
            {/* Opción Sin Accesorio */}
            <div
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${gameState.equippedAccessory === 'none'
                ? 'border-primary bg-primary/10'
                : 'border-border/60 bg-muted/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🚫</span>
                <span className="text-xs font-bold">
                  {isCatalan ? 'Sense accesori' : 'Sin accesorio'}
                </span>
              </div>
              <Button
                size="sm"
                variant={gameState.equippedAccessory === 'none' ? 'default' : 'outline'}
                onClick={() => handleEquip('none')}
                className="rounded-xl text-xs font-bold h-8"
              >
                {gameState.equippedAccessory === 'none'
                  ? isCatalan ? 'Equipat' : 'Equipado'
                  : isCatalan ? 'Equipar' : 'Equipar'}
              </Button>
            </div>

            {SHOP_ITEMS.filter((i) => gameState.unlockedItems.includes(i.id)).map((item) => {
              const isEquipped = gameState.equippedAccessory === item.id

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${isEquipped ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-bold text-foreground">
                      {isCatalan ? item.name.ca : item.name.es}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isEquipped ? 'default' : 'outline'}
                    onClick={() => handleEquip(item.id)}
                    className="rounded-xl text-xs font-bold h-8"
                  >
                    {isEquipped
                      ? isCatalan ? 'Equipat' : 'Equipado'
                      : isCatalan ? 'Equipar' : 'Equipar'}
                  </Button>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
