import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, ArrowRight } from 'lucide-react'

interface Prestamo {
  MontoPrestado: number
  InteresMontoTotal: number
  CantidadCuotas: number
  CuotasRestantes: number
  ModalidadPago: string
  Estado: string
}

interface ProyeccionesCardProps {
  prestamos: Prestamo[]
}

const getMonthName = (date: Date) => {
  return date.toLocaleString('es-DO', { month: 'long' }).replace('.', '')
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

export function ProyeccionesCard({ prestamos }: ProyeccionesCardProps) {
  const activos = prestamos.filter(p => p.Estado === "Activo")

  const hoy = new Date()
  const meses = Array.from({ length: 3 }).map((_, i) => {
    const fn = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1)
    return {
      nombre: getMonthName(fn),
      capital: 0,
      interes: 0,
      total: 0
    }
  })

  activos.forEach(p => {
    let cuotasRestantes = Number(p.CuotasRestantes) || 0
    if (cuotasRestantes <= 0) return

    const capitalPorCuota = Number(p.MontoPrestado) / (Number(p.CantidadCuotas) || 1)
    const interesPorCuota = Number(p.InteresMontoTotal) / (Number(p.CantidadCuotas) || 1)

    let cuotasPorMes = 1
    const modalidad = p.ModalidadPago?.toLowerCase() || ''
    if (modalidad === 'diario') cuotasPorMes = 22
    else if (modalidad === 'semanal') cuotasPorMes = 4
    else if (modalidad === 'quincenal') cuotasPorMes = 2
    else if (modalidad === 'mensual') cuotasPorMes = 1

    for (let i = 0; i < 3; i++) {
      if (cuotasRestantes <= 0) break
      const cuotasEsteMes = Math.min(cuotasPorMes, cuotasRestantes)
      meses[i].capital += cuotasEsteMes * capitalPorCuota
      meses[i].interes += cuotasEsteMes * interesPorCuota
      meses[i].total += cuotasEsteMes * (capitalPorCuota + interesPorCuota)
      cuotasRestantes -= cuotasEsteMes
    }
  })

  const maxTotal = Math.max(...meses.map(m => m.total), 1)
  const totalProyectado = meses.reduce((s, m) => s + m.total, 0)

  const mesColors = [
    { bar: 'from-[#213685] to-[#3a5bc7]', bg: 'bg-[#213685] text-white dark:text-white/5', text: 'text-[#213685]', ring: 'ring-[#213685]/20' },
    { bar: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
    { bar: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' }
  ]

  return (
    <Card className="shadow-md flex flex-col h-full border-0 overflow-hidden">
      {/* Header oscuro */}
      <div className="bg-gradient-to-r from-[#213685] to-[#3a5bc7] rounded-t-lg px-5 pt-4 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-200" />
            <h3 className="text-white font-bold text-base">Proyección 3 Meses</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Total Proyectado</p>
            <p className="text-white font-bold text-lg leading-tight">{formatMoney(totalProyectado)}</p>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-5">
        <div className="space-y-5">
          {meses.map((mes, idx) => {
            const barWidth = mes.total > 0 ? (mes.total / maxTotal) * 100 : 0
            const capitalPorc = mes.total > 0 ? (mes.capital / mes.total) * 100 : 0
            const colors = mesColors[idx]

            return (
              <div key={idx} className="space-y-2">
                {/* Month name + total */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-foreground capitalize">{mes.nombre}</span>
                  <span className="font-bold text-sm text-foreground">{formatMoney(mes.total)}</span>
                </div>

                {/* Stacked bar */}
                <div className="h-3 w-full bg-accent rounded-full overflow-hidden">
                  {mes.total > 0 && (
                    <div
                      className="h-full flex rounded-full overflow-hidden transition-all duration-700"
                      style={{ width: `${Math.max(barWidth, 8)}%` }}
                    >
                      <div
                        className={`h-full bg-gradient-to-r ${colors.bar} transition-all duration-500`}
                        style={{ width: `${capitalPorc}%` }}
                      />
                      <div
                        className="h-full bg-slate-300 transition-all duration-500"
                        style={{ width: `${100 - capitalPorc}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.bar}`} />
                    <span className="text-muted-foreground">Capital: {formatMoney(mes.capital)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-muted-foreground">Interés: {formatMoney(mes.interes)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
