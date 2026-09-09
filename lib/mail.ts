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

/**
 * Envía el informe financiero del hogar por correo electrónico
 */
export async function sendFinancialReportEmail(
  to: string,
  householdName: string,
  reportHtml: string
) {
  const sender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev'

  const { data, error } = await resend.emails.send({
    from: `Control Dotz <${sender}>`,
    to,
    subject: `📊 Resumen Financiero: Hogar "${householdName}"`,
    html: reportHtml,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Envía la notificación de nueva actualización por correo electrónico a uno o más usuarios
 */
export async function sendUpdateNotificationEmail(
  to: string | string[],
  title: string,
  content: string,
  version?: string,
  category: string = 'feature'
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const sender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev'
  const recipients = Array.isArray(to) ? to : [to]

  if (recipients.length === 0) {
    return { totalSent: 0, errorsCount: 0 }
  }

  const categoryLabels: Record<string, { label: string; bg: string; color: string }> = {
    feature: { label: '🚀 Nueva Función', bg: '#e0e7ff', color: '#3730a3' },
    improvement: { label: '⚡ Mejora', bg: '#dcfce7', color: '#166534' },
    fix: { label: '🛠️ Corrección', bg: '#fef3c7', color: '#92400e' },
    announcement: { label: '📢 Anuncio', bg: '#f3e8ff', color: '#6b21a8' },
  }

  const badge = categoryLabels[category] || categoryLabels.feature
  const formattedContent = content.replace(/\n/g, '<br />')

  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
        <h1 style="color: #0f172a; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; margin: 0; font-family: 'Outfit', sans-serif;">Control Dotz</h1>
        <p style="color: #64748b; font-size: 13px; font-weight: 500; margin-top: 4px; margin-bottom: 0; text-transform: uppercase; letter-spacing: 0.05em;">Novedades y Actualizaciones</p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <span style="display: inline-block; background-color: ${badge.bg}; color: ${badge.color}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-right: 6px;">
            ${badge.label}
          </span>
          ${
            version
              ? `<span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">${version}</span>`
              : ''
          }
        </div>

        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; line-height: 28px;">
          ${title}
        </h2>
        
        <div style="color: #334155; font-size: 15px; line-height: 24px; margin-bottom: 24px;">
          ${formattedContent}
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">
          Probar en Control Dotz
        </a>
      </div>
      
      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Estás recibiendo este correo porque estás registrado en Control Dotz.
        </p>
      </div>
    </div>
  `

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      resend.emails.send({
        from: `Control Dotz <${sender}>`,
        to: recipient,
        subject: `✨ Novedad en Control Dotz: ${title}`,
        html: htmlContent,
      })
    )
  )

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason)

  if (errors.length > 0 && errors.length === recipients.length) {
    throw new Error(`Error enviando correos de actualización: ${errors[0]?.message || errors[0]}`)
  }

  return { totalSent: recipients.length - errors.length, errorsCount: errors.length }
}
