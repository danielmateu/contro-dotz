import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  try {
    // Inyectar el pathname en las cabeceras para que esté disponible en Server Components
    request.headers.set('x-pathname', request.nextUrl.pathname)

    const { response, user } = await updateSession(request)

    const { pathname } = request.nextUrl

    // Rutas públicas que no requieren autenticación
    const isPublicRoute =
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/manifest') ||
      pathname === '/sw.js' ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.json') ||
      pathname.endsWith('.webmanifest') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.glb')

    // Redirigir a /login si no hay usuario autenticado en una ruta privada
    if (!user && !isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirigir a /dashboard si el usuario autenticado intenta ir a login/register/forgot-password
    if (
      user &&
      (pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/forgot-password'))
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Error executing proxy:', error)
    return NextResponse.next()
  }
}

export default proxy

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sw.js, sitemap.xml, robots.txt, manifest files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|manifest.webmanifest|sitemap.xml|robots.txt).*)',
  ],
}
