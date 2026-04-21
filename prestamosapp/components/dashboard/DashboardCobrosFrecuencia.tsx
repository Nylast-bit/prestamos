import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { ChevronDown, ChevronUp, Users, Wallet } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

interface Prestamo {
  IdPrestamo: number
  clienteNombre?: string
  MontoCuota: number
  ModalidadPago: string
  Estado: string
}

interface DashboardCobrosFrecuenciaProps {
  prestamos: Prestamo[]
}

type Frecuencia = 'diario' | 'semanal' | 'quincenal' | 'mensual'

const MAPPING_FRECUENCIA: Record<Frecuencia, { label: string, desc: string }> = {
  diario: { label: "Hoy (Diario)", desc: "Entran hoy" },
  semanal: { label: "Esta Semana", desc: "Entran semanalmente" },
  quincenal: { label: "Esta Quincena", desc: "Entran por quincena" },
  mensual: { label: "Este Mes", desc: "Entran mensualmente" },
}

export function DashboardCobrosFrecuencia({ prestamos }: DashboardCobrosFrecuenciaProps) {
  const [expanded, setExpanded] = useState<Frecuencia | null>(null)

  // Filtrar activos y en mora
  const prestamosValidos = prestamos.filter(p => p.Estado === "Activo" || p.Estado === "En Mora")

  // Agrupar
  const grupos = prestamosValidos.reduce((acc, p) => {
    const freq = (p.ModalidadPago?.toLowerCase() || 'mensual') as Frecuencia
    if (!acc[freq]) {
      acc[freq] = { total: 0, clientes: [] }
    }
    acc[freq].total += Number(p.MontoCuota) || 0
    acc[freq].clientes.push({
      nombre: p.clienteNombre || `Préstamo #${p.IdPrestamo}`,
      monto: Number(p.MontoCuota) || 0
    })
    return acc
  }, {} as Record<Frecuencia, { total: number, clientes: { nombre: string, monto: number }[] }>)

  // Asegurar que existan todos los grupos para mostrarlos en orden
  const orden: Frecuencia[] = ['diario', 'semanal', 'quincenal', 'mensual']

  const toggleExpand = (f: Frecuencia) => {
    setExpanded(expanded === f ? null : f)
  }

  return (
    <Card className="shadow-sm border-l-4 border-l-[#213685] flex flex-col h-fit">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-800">Entradas por Frecuencia</CardTitle>
        <Wallet className="h-4 w-4 text-[#213685]" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {orden.map(freq => {
            const data = grupos[freq] || { total: 0, clientes: [] }
            const config = MAPPING_FRECUENCIA[freq]
            const isExpanded = expanded === freq

            return (
              <div key={freq} className="border rounded-md overflow-hidden bg-white">
                <button
                  onClick={() => toggleExpand(freq)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">{config.label}</span>
                    <span className="text-[10px] text-slate-500">{data.clientes.length} clientes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#213685]">
                      ${data.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-white border-t border-slate-100">
                    <ScrollArea className="max-h-[150px] overflow-y-auto p-2">
                      {data.clientes.length > 0 ? (
                        <ul className="space-y-1">
                          {data.clientes.map((c, idx) => (
                            <li key={idx} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-50 rounded">
                              <span className="text-slate-600 truncate max-w-[120px] font-medium" title={c.nombre}>
                                {c.nombre}
                              </span>
                              <span className="text-slate-800 font-semibold">
                                ${c.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-center text-slate-400 py-2">No hay cobros en esta frecuencia</p>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
