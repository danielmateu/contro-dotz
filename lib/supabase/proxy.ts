import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresca la sesión si ha expirado
  let user = null
  let authError = null

  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      authError = error
    } else {
      user = data?.user ?? null
    }
  } catch (err) {
    console.error('Error en proxy updateSession:', err)
  }

  // Si hubo un error de autenticación (ej: refresh_token_not_found o token inválido/revocado),
  // limpiamos las cookies de sesión para evitar que el navegador siga enviando tokens obsoletos.
  if (authError) {
    const allCookies = request.cookies.getAll()
    allCookies.forEach((c) => {
      if (c.name.startsWith('sb-')) {
        request.cookies.delete(c.name)
        response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
      }
    })
  } else if (!user) {
    // Fallback offline: solo si no hay error de red ni de auth explícito, intentar leer la sesión JWT local
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (!sessionErr) {
        user = sessionData?.session?.user ?? null
      }
    } catch (_) {}
  }

  return { response, user }
}

