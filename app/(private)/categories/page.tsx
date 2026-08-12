import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Categorías',
  robots: {
    index: false,
    follow: false,
  },
}
import { CategoryDialog } from '@/components/categories/category-dialog'
import { DeleteCategoryButton } from '@/components/categories/delete-category-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, FolderOpen } from 'lucide-react'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar membresía
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  // Cargar las categorías del hogar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .eq('household_id', membership.household_id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Categorías
          </h1>
          <p className="text-muted-foreground">
            Personaliza y gestiona las categorías de gastos de tu familia.
          </p>
        </div>

        {/* Botón de crear categoría que abre el diálogo */}
        <CategoryDialog
          householdId={membership.household_id}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          }
        />
      </div>

      {/* Grid de categorías */}
      {!categories || categories.length === 0 ? (
        <Card className="border-slate-200/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-slate-400 mb-4 stroke-1" />
            <h3 className="text-lg font-semibold font-heading">
              Sin categorías registradas
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Las categorías ayudan a organizar tus gastos. Pulsa en &quot;Nueva
              Categoría&quot; para crear la primera.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat) => {
            const LucideIconComp = (Icons as any)[cat.icon] as LucideIcon

            return (
              <Card
                key={cat.id}
                className="border-slate-200/50 shadow-sm relative group hover:shadow-md hover:border-slate-300/50 transition-all overflow-hidden"
              >
                {/* Indicador de color en la parte superior */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: cat.color }}
                />

                <CardContent className="p-4 pt-6 flex flex-col items-center text-center space-y-3">
                  {/* Icono de categoría */}
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-xs border border-slate-100 dark:border-slate-800"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                    }}
                  >
                    {LucideIconComp ? (
                      <LucideIconComp className="h-6 w-6" />
                    ) : (
                      <Icons.Tag className="h-6 w-6" />
                    )}
                  </div>

                  {/* Nombre de categoría */}
                  <span className="font-bold text-sm text-foreground font-heading tracking-tight truncate max-w-full">
                    {cat.name}
                  </span>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-center gap-1">
                    {/* Botón de editar */}
                    <CategoryDialog
                      category={{
                        id: cat.id,
                        name: cat.name,
                        color: cat.color,
                        icon: cat.icon,
                      }}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          aria-label={`Editar categoría: ${cat.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      }
                    />

                    {/* Botón de eliminar */}
                    <DeleteCategoryButton
                      categoryId={cat.id}
                      categoryName={cat.name}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
