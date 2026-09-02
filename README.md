# Control Dotz 🪙

Control Dotz es un gestor inteligente de gastos compartidos para el hogar, desarrollado con **Next.js**, **Supabase** y **Resend**. Permite a las familias crear hogares virtuales, invitar a miembros por correo electrónico, registrar gastos, categorizar consumos y planificar presupuestos mensuales colaborativos con una interfaz visual moderna, responsiva y adaptada al modo oscuro.

---

## 🚀 Características Principales

- **Gestión Familiar**: Crea un hogar o acepta invitaciones de otros miembros para empezar a colaborar.
- **Registro de Gastos**: Introduce, edita o elimina gastos detallados indicando el importe, categoría y fecha.
- **Presupuestos Mensuales**: Planifica metas financieras y vigila el estado de tus gastos con barras de progreso visuales.
- **Categorías Personalizadas**: Organiza las finanzas con colores e iconos intuitivos.
- **Notificaciones por Email**: Invitaciones fluidas integradas con **Resend** mediante plantillas HTML premium.
- **Seguridad Robusta (RLS)**: Las bases de datos están protegidas mediante **Row Level Security (RLS)** en Supabase; los datos de un hogar son totalmente privados y accesibles solo para sus miembros.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, Middleware)
- **Base de datos & Auth**: [Supabase](https://supabase.com/) (PostgreSQL con RLS, RPCs y Triggers automáticos)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Correos**: [Resend](https://resend.com/) (SDK Oficial)
- **Manejo de fechas**: [date-fns](https://date-fns.org/)
- **Validación de esquemas**: [Zod](https://zod.dev/)

---

## 📦 Instalación y Configuración Local

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/danielmateu/contro-dotz.git
cd contro-dotz
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica

# Resend Integration
RESEND_API_KEY=re_tu_clave_de_api
RESEND_SENDER_EMAIL=mail@tudominio.es # Deja vacío o usa onboarding@resend.dev en desarrollo

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Gemini AI Configuration
GEMINI_API_KEY=TuAPUKEY_50045665065220420_fAK

```

---

## 💾 Configuración de la Base de Datos (Supabase)

El proyecto utiliza triggers y políticas RLS avanzadas para asegurar el aislamiento de datos por hogar. 

Para configurar tu base de datos:
1. Ve al panel de control de tu proyecto en **Supabase** -> **SQL Editor**.
2. Abre una nueva consulta (`New query`).
3. Copia y ejecuta el contenido del archivo de base de datos ubicado en [`supabase/migrations/schema.sql`](file:///c:/Users/Daniel/Desktop/contro-dotz/supabase/migrations/schema.sql).
4. *(Opcional en Desarrollo)*: Para probar el flujo de registro local de manera rápida sin esperas de correo, ve a **Project Settings -> Authentication** en Supabase y desactiva la opción **"Confirm email"**.

---

## 💻 Desarrollo

Para iniciar el servidor de desarrollo local:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación funcionando.

---

## 🤝 Contribuciones y Buenas Prácticas

Si eres desarrollador y quieres aportar al proyecto, ¡eres bienvenido! Por favor, ten en cuenta las siguientes directrices:

1. **Crear una rama de trabajo**: Usa nombres descriptivos para tus ramas, por ejemplo: `feature/nueva-categoria` o `bugfix/correo-invitacion`.
2. **Seguridad y RLS**: Si añades una nueva tabla o campo, asegúrate de habilitar **Row Level Security (RLS)** y definir las políticas correspondientes en `schema.sql` para que los datos no queden expuestos.
3. **Optimización de consultas**: Evita bucles recursivos en las políticas RLS. Usa la función segura `auth.jwt()->>'email'` para comparar correos en lugar de hacer subconsultas a la tabla `profiles`.
4. **Verificación de Tipos y Compilación**: Antes de enviar tu Pull Request, asegúrate de que el código compile y pase los lints ejecutando:
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
