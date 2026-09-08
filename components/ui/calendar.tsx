"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function getShortMonthNames(localeCode?: string) {
  return Array.from({ length: 12 }, (_, idx) => {
    const date = new Date(2026, idx, 15)
    const formatted = date.toLocaleString(localeCode || 'es', { month: 'short' })
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '')
  })
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  month: controlledMonth,
  onMonthChange: controlledOnMonthChange,
  defaultMonth,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  const [internalMonth, setInternalMonth] = React.useState<Date>(() => {
    if (controlledMonth) return controlledMonth
    if (defaultMonth) return defaultMonth
    const sel = (props as any).selected
    if (sel && typeof sel === 'object' && 'from' in sel && sel.from) {
      return sel.from
    }
    if (sel instanceof Date) return sel
    return new Date()
  })

  const currentMonth = controlledMonth || internalMonth

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth)
    controlledOnMonthChange?.(newMonth)
  }

  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days')
  const [yearPageStart, setYearPageStart] = React.useState<number>(() => {
    const y = currentMonth.getFullYear()
    return y - (y % 12)
  })

  React.useEffect(() => {
    const y = currentMonth.getFullYear()
    setYearPageStart(y - (y % 12))
  }, [currentMonth])

  const shortMonths = React.useMemo(() => getShortMonthNames(locale?.code), [locale?.code])

  return (
    <div className={cn("relative bg-background p-2 rounded-lg", className)}>
      {view === 'days' && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          className="group/calendar [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]"
          captionLayout="label"
          month={currentMonth}
          onMonthChange={handleMonthChange}
          locale={locale}
          formatters={formatters}
          classNames={{
            root: cn("w-fit", defaultClassNames.root),
            months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
            month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
            nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-10", defaultClassNames.nav),
            button_previous: cn(buttonVariants({ variant: buttonVariant }), "size-(--cell-size) p-0 select-none aria-disabled:opacity-50 z-20", defaultClassNames.button_previous),
            button_next: cn(buttonVariants({ variant: buttonVariant }), "size-(--cell-size) p-0 select-none aria-disabled:opacity-50 z-20", defaultClassNames.button_next),
            month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", defaultClassNames.month_caption),
            caption_label: cn("font-medium select-none text-sm", defaultClassNames.caption_label),
            month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
            weekdays: cn("flex", defaultClassNames.weekdays),
            weekday: cn("flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none", defaultClassNames.weekday),
            week: cn("mt-2 flex w-full", defaultClassNames.week),
            week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
            week_number: cn("text-[0.8rem] text-muted-foreground select-none", defaultClassNames.week_number),
            day: cn("group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none", defaultClassNames.day),
            range_start: cn("relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted", defaultClassNames.range_start),
            range_middle: cn("rounded-none", defaultClassNames.range_middle),
            range_end: cn("relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted", defaultClassNames.range_end),
            today: cn("rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none", defaultClassNames.today),
            outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
            disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
            hidden: cn("invisible", defaultClassNames.hidden),
            ...classNames,
          }}
          components={{
            MonthCaption: ({ calendarMonth }) => {
              const mDate = calendarMonth.date
              const monthNameRaw = mDate.toLocaleString(locale?.code || 'es', { month: 'long' })
              const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1)
              const year = mDate.getFullYear()

              return (
                <div className="flex items-center justify-center gap-1.5 h-7 z-20">
                  <button
                    type="button"
                    onClick={() => setView('months')}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <span>{monthName}</span>
                    <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setYearPageStart(year - (year % 12))
                      setView('years')
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <span>{year}</span>
                    <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )
            },
            Root: ({ className, rootRef, ...props }) => (
              <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
            ),
            Chevron: ({ className, orientation, ...props }) => {
              if (orientation === "left") return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
              if (orientation === "right") return <ChevronRightIcon className={cn("size-4", className)} {...props} />
              return <ChevronDownIcon className={cn("size-4", className)} {...props} />
            },
            DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
            WeekNumber: ({ children, ...props }) => (
              <td {...props}>
                <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
              </td>
            ),
            ...components,
          }}
          {...props}
        />
      )}

      {/* Selector de Mes (Vista en Cuadrícula 3x4) */}
      {view === 'months' && (
        <div className="w-[260px] p-2 space-y-3">
          <div className="flex items-center justify-between px-1 border-b border-border/40 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const prevYear = new Date(currentMonth)
                prevYear.setFullYear(prevYear.getFullYear() - 1)
                handleMonthChange(prevYear)
              }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => {
                const y = currentMonth.getFullYear()
                setYearPageStart(y - (y % 12))
                setView('years')
              }}
              className="flex items-center gap-1 text-xs font-bold text-foreground hover:bg-muted px-2 py-1 rounded-md transition-colors"
            >
              <span>{currentMonth.getFullYear()}</span>
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const nextYear = new Date(currentMonth)
                nextYear.setFullYear(nextYear.getFullYear() + 1)
                handleMonthChange(nextYear)
              }}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {shortMonths.map((name, idx) => {
              const isSelected = currentMonth.getMonth() === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const updated = new Date(currentMonth)
                    updated.setMonth(idx)
                    handleMonthChange(updated)
                    setView('days')
                  }}
                  className={cn(
                    "h-9 rounded-md text-xs font-semibold transition-all flex items-center justify-center cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "hover:bg-muted text-foreground/80 hover:text-foreground"
                  )}
                >
                  {name}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView('days')}
              className="h-7 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* Selector de Año (Vista en Cuadrícula 3x4) */}
      {view === 'years' && (
        <div className="w-[260px] p-2 space-y-3">
          <div className="flex items-center justify-between px-1 border-b border-border/40 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setYearPageStart((prev) => prev - 12)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold text-foreground">
              {yearPageStart} - {yearPageStart + 11}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setYearPageStart((prev) => prev + 12)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((year) => {
              const isSelected = currentMonth.getFullYear() === year
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    const updated = new Date(currentMonth)
                    updated.setFullYear(year)
                    handleMonthChange(updated)
                    setView('months')
                  }}
                  className={cn(
                    "h-9 rounded-md text-xs font-semibold transition-all flex items-center justify-center cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "hover:bg-muted text-foreground/80 hover:text-foreground"
                  )}
                >
                  {year}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView('days')}
              className="h-7 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Volver
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

