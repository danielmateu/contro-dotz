import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Envía un correo electrónico de invitación para unirse a un hogar
 */
export async function sendInvitationEmail(
  to: string,
  householdName: string,
  inviterName: string
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const registerUrl = `${siteUrl}/register?email=${encodeURIComponent(to)}`

  // Por defecto usa onboarding@resend.dev para pruebas gratuitas.
  // Puede configurarse una cuenta de correo corporativo verificada usando la variable RESEND_SENDER_EMAIL.
  const sender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev'

  const { data, error } = await resend.emails.send({
    from: `Control Dotz <${sender}>`,
    to,
    subject: `¡Te han invitado a unirte al hogar "${householdName}"!`,
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-b: 1px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; margin: 0; font-family: 'Outfit', sans-serif;">Control Dotz</h1>
          <p style="color: #64748b; font-size: 13px; font-weight: 500; margin-top: 4px; margin-bottom: 0; text-transform: uppercase; letter-spacing: 0.05em;">Gestión Inteligente de Gastos</p>
        </div>
        
        <div style="margin-bottom: 32px;">
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin-top: 0;">¡Hola!</p>
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
            <strong>${inviterName}</strong> te ha invitado a unirte a su grupo familiar <strong>"${householdName}"</strong> en Control Dotz para gestionar los gastos diarios del hogar de manera conjunta.
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin-bottom: 0;">
            Al unirte, podrás registrar gastos, crear categorías personalizadas y planificar presupuestos mensuales de forma colaborativa.
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${registerUrl}" style="display: inline-block; background-color: #020617; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">
            Aceptar Invitación y Registrarse
          </a>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; line-height: 18px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </p>
          <p style="word-break: break-all; font-size: 12px; margin: 0;">
            <a href="${registerUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">${registerUrl}</a>
          </p>
        </div>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
