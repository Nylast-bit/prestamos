"use client"

import React, { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  ChevronDown,
  ChevronUp,
  Wallet,
  Sun,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react'

export interface Prestamo {
  IdPrestamo: number
  clienteNombre?: string
  clienteTelefono?: string | null
  MontoCuota: number
  ModalidadPago: string
  Estado: string
}

interface Props {
  prestamos: Prestamo[]
}

const FREQUENCY_CONFIG = {
  diario: {
    label: 'Cobros Diarios',
    icon: Sun,
    colors: {
      border: 'border-amber-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700 hover:bg-amber-200'
    }
  },
  semanal: {
    label: 'Cobros Semanales',
    icon: CalendarDays,
    colors: {
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    }
  },
  quincenal: {
    label: 'Cobros Quincenales',
    icon: Calendar,
    colors: {
      border: 'border-violet-500',
      bg: 'bg-violet-500/10',
      text: 'text-violet-600',
      badge: 'bg-violet-100 text-violet-700 hover:bg-violet-200'
    }
  },
  mensual: {
    label: 'Cobros Mensuales',
    icon: CalendarRange,
    colors: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
    }
  }
} as const

type FrequencyKey = keyof typeof FREQUENCY_CONFIG
const FREQUENCY_ORDER: FrequencyKey[] = ['diario', 'semanal', 'quincenal', 'mensual']

function formatMoney(amount: number) {
  return `$${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
}

export function DashboardCobrosFrecuencia({ prestamos }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (freq: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [freq]: !prev[freq]
    }))
  }

  const { groups, grandTotal } = useMemo(() => {
    const validPrestamos = prestamos.filter(
      p => p.Estado === 'Activo' || p.Estado === 'En Mora'
    )

    const grouped = validPrestamos.reduce((acc, prestamo) => {
      const modal = prestamo.ModalidadPago.toLowerCase() as FrequencyKey
      if (!acc[modal]) {
        acc[modal] = { items: [], total: 0 }
      }
      acc[modal].items.push(prestamo)
      acc[modal].total += prestamo.MontoCuota
      return acc
    }, {} as Record<FrequencyKey, { items: Prestamo[]; total: number }>)

    let grand = 0

    const orderedGroups = FREQUENCY_ORDER.map(key => {
      const groupData = grouped[key] || { items: [], total: 0 }
      grand += groupData.total
      return {
        key,
        ...groupData
      }
    })

    return { groups: orderedGroups, grandTotal: grand }
  }, [prestamos])

  return (
    <Card className="w-full shadow-md border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Cobros por Frecuencia
        </CardTitle>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Total Proyectado
          </span>
          <span className="text-xl font-bold text-primary">
            {formatMoney(grandTotal)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {groups.map(group => {
          if (group.items.length === 0) return null

          const isExpanded = !!expandedGroups[group.key]
          const config = FREQUENCY_CONFIG[group.key]
          const Icon = config.icon

          return (
            <div
              key={group.key}
              className={`rounded-lg border bg-card transition-all duration-200 overflow-hidden ${
                isExpanded ? 'ring-1 ring-ring/20 shadow-sm' : 'hover:border-border hover:bg-accent/30'
              }`}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center justify-between p-4 border-l-4 ${config.colors.border} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${config.colors.bg} ${config.colors.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="font-semibold text-foreground">
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.items.length} cliente{group.items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className={`font-semibold ${config.colors.badge}`}>
                    {formatMoney(group.total)}
                  </Badge>
                  <div className="text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-muted/30 border-t border-border/50">
                  <ScrollArea className="max-h-[180px]">
                    <div className="p-2">
                      {group.items.map((prestamo, idx) => (
                        <div
                          key={`${prestamo.IdPrestamo}-${idx}`}
                          className="flex items-center justify-between py-2 px-3 hover:bg-accent/50 rounded-md transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {prestamo.clienteNombre || 'Cliente Desconocido'}
                            </span>
                            {prestamo.clienteTelefono && (
                              <a
                                href={`tel:${prestamo.clienteTelefono}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center mt-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                {prestamo.clienteTelefono}
                              </a>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {formatMoney(prestamo.MontoCuota)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )
        })}

        {groups.every(g => g.items.length === 0) && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay cobros activos o en mora para mostrar.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
