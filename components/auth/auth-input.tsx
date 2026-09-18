'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { MorphIcon } from 'morphicons/react'
// @ts-ignore
import { __iconNode as EyeData } from 'lucide-react/dist/esm/icons/eye.mjs'
// @ts-ignore
import { __iconNode as EyeOffData } from 'lucide-react/dist/esm/icons/eye-off.mjs'

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  label?: string
  showPasswordToggle?: boolean
  containerClassName?: string
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      className,
      containerClassName,
      type,
      icon,
      label,
      placeholder,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      showPasswordToggle = false,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
    )

    const inputId = React.useId()
    const activeId = id || inputId

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value)
      }
    }, [value])

    const hasValue = String(internalValue).length > 0
    const isActive = isFocused || hasValue

    const isPasswordField = type === 'password' || showPasswordToggle
    const currentInputType = isPasswordField
      ? showPassword
        ? 'text'
        : 'password'
      : type

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value)
      onChange?.(e)
    }

    return (
      <div className={cn('relative w-full group my-1', containerClassName)}>
        {/* Glow aura exterior al hacer focus */}
        <div
          className={cn(
            'absolute -inset-0.5 rounded-[14px] bg-linear-to-r from-blue-600 via-sky-500 to-cyan-400 blur-sm opacity-0 transition-opacity duration-300 pointer-events-none',
            isFocused && 'opacity-60 dark:opacity-80'
          )}
        />

        {/* Contenedor con borde gradiente de 1px */}
        <div
          className={cn(
            'relative rounded-xl p-[1px] transition-all duration-300',
            'bg-slate-200/90 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700/80',
            isFocused &&
              'bg-linear-to-r from-blue-600 via-sky-500 to-cyan-400 scale-[1.01]'
          )}
        >
          {/* Fondo interior del input */}
          <div
            className={cn(
              'relative flex items-center h-12 w-full rounded-[11px] px-3.5 transition-colors duration-200',
              'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
              isFocused && 'bg-white dark:bg-slate-900'
            )}
          >
            {/* Icono Izquierdo */}
            {icon && (
              <div
                className={cn(
                  'mr-2.5 text-slate-400 dark:text-slate-500 transition-all duration-300 shrink-0 pointer-events-none flex items-center justify-center',
                  isFocused &&
                    'text-blue-600 dark:text-cyan-400 scale-110'
                )}
              >
                {icon}
              </div>
            )}

            {/* Label Dinámico Flotante */}
            {label && (
              <label
                htmlFor={activeId}
                className={cn(
                  'absolute transition-all duration-200 ease-out pointer-events-none select-none z-10 rounded-xs px-1 font-medium',
                  icon ? 'left-9' : 'left-3.5',
                  isActive
                    ? '-top-2.5 text-[11px] font-extrabold tracking-wide uppercase text-blue-600 dark:text-cyan-400 bg-white dark:bg-slate-900 shadow-xs'
                    : 'top-3.5 text-sm text-slate-400 dark:text-slate-500'
                )}
              >
                {label}
              </label>
            )}

            {/* Elemento Input */}
            <input
              ref={ref}
              id={activeId}
              type={currentInputType}
              value={internalValue}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder={label ? (isFocused ? placeholder : '') : placeholder}
              className={cn(
                'h-full w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none border-0 ring-0 focus:outline-none focus:ring-0 placeholder:text-slate-400/60 placeholder:font-normal transition-colors',
                isPasswordField && 'pr-8',
                className
              )}
              {...props}
            />

            {/* Alternar visibilidad de contraseña */}
            {isPasswordField && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 cursor-pointer active:scale-90"
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                <MorphIcon
                  icon={showPassword ? EyeOffData : EyeData}
                  spring="snappy"
                  className="h-4 w-4"
                />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
