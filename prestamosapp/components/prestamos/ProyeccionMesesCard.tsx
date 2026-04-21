import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from 'lucide-react'

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
  return date.toLocaleString('es-DO', { month: 'short', year: 'numeric' })
}

export function ProyeccionesCard({ prestamos }: ProyeccionesCardProps) {
  // Filtramos solo los activos
  const activos = prestamos.filter(p => p.Estado === "Activo")

  // Generamos los nombres de los próximos 3 meses
  const hoy = new Date()
  const meses = Array.from({ length: 3 }).map((_, i) => {
    const fn = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1)
    return {
      nombre: getMonthName(fn).replace('.', ''),
      capital: 0,
      interes: 0,
      total: 0
    }
  })

  // Calculamos la proyección
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

  return (
    <Card className="shadow-sm flex flex-col h-full border-l-4 border-l-[#213685]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Proyección (3 Meses)</CardTitle>
        <BarChart3 className="h-4 w-4 text-[#213685]" />
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="space-y-4">
          {meses.map((mes, idx) => {
            const capitalPorc = (mes.capital / mes.total) * 100 || 0
            const interesPorc = (mes.interes / mes.total) * 100 || 0
            const anchoTotalBarra = (mes.total / maxTotal) * 100

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-end text-sm">
                  <span className="font-medium text-slate-600 capitalize truncate w-20">{mes.nombre}</span>
                  <span className="font-bold text-slate-800">
                    ${mes.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Barra apilada */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                  {mes.total > 0 ? (
                    <div className="h-full flex" style={{ width: `${anchoTotalBarra}%`, minWidth: '5%' }}>
                      {/* Porción Capital */}
                      <div 
                        className="h-full bg-slate-300 transition-all duration-500"
                        style={{ width: `${capitalPorc}%` }}
                        title={`Capital: $${mes.capital.toFixed(2)}`}
                      />
                      {/* Porción Interés */}
                      <div 
                        className="h-full bg-[#213685] transition-all duration-500"
                        style={{ width: `${interesPorc}%` }}
                        title={`Interés: $${mes.interes.toFixed(2)}`}
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full bg-slate-50" />
                  )}
                </div>

                {/* Leyenda pequeña */}
                {mes.total > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>C: ${mes.capital.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
                    <span>I: ${mes.interes.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
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
