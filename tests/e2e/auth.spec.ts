import { test, expect } from '@playwright/test'

test.describe('Flujo de Autenticación y Acceso Público', () => {
  test('debe mostrar la página de inicio pública correctamente', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Verificar que aparece el título principal de la aplicación
    await expect(
      page.getByRole('heading', {
        name: 'Controla tus gastos diarios en familia con total claridad',
      })
    ).toBeVisible({ timeout: 15_000 })

    // Verificar que aparece la marca de la aplicación
    await expect(page.locator('text=Control Dotz').first()).toBeVisible()
  })

  test('debe redirigir al login si un usuario no autenticado accede al dashboard', async ({
    page,
  }) => {
    // Intentar acceder a una ruta protegida
    await page.goto('/dashboard', { waitUntil: 'networkidle' })

    // El proxy de Next.js debe redirigirnos a la página de login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 15_000 })

    // Esperar a que React hidrate el formulario de login (los labels se renderizan
    // tras la hidratación del componente AuthInput dentro de un boundary Suspense)
    await expect(page.getByLabel('Correo electrónico')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })
})
