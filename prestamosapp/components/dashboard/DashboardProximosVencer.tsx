import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, MapPin } from 'lucide-react'

// Helper para calcular la fecha del próximo pago (Misma lógica que usamos en tu tabla)
const getProximoPagoDate = (fechaInicioStr: string, modalidad: string, cuotasPagadas: number): Date => {
  if (!fechaInicioStr) return new Date();
  const fechaISO = fechaInicioStr.split('T')[0]; 
  let fechaCalculada = new Date(`${fechaISO}T12:00:00`); 
  const saltosNecesarios = cuotasPagadas + 1;

  for (let i = 0; i < saltosNecesarios; i++) {
    if (modalidad.toLowerCase() === 'quincenal') {
      const year = fechaCalculada.getFullYear();
      const mes = fechaCalculada.getMonth();
      const dia = fechaCalculada.getDate();
      const ultimoDiaDelMes = new Date(year, mes + 1, 0).getDate();
      if (dia < 15) { fechaCalculada = new Date(year, mes, 15, 12, 0, 0); } 
      else if (dia >= 15 && dia < ultimoDiaDelMes) { fechaCalculada = new Date(year, mes + 1, 0, 12, 0, 0); } 
      else { fechaCalculada = new Date(year, mes + 1, 15, 12, 0, 0); }
    } else if (modalidad.toLowerCase() === 'mensual') {
      fechaCalculada.setMonth(fechaCalculada.getMonth() + 1);
    } else if (modalidad.toLowerCase() === 'semanal') {
      fechaCalculada.setDate(fechaCalculada.getDate() + 7);
    } else if (modalidad.toLowerCase() === 'diario') {
      fechaCalculada.setDate(fechaCalculada.getDate() + 1);
    }
  }
  return fechaCalculada;
}

interface DashboardProximosVencerProps {
  prestamos: any[];
}

export function DashboardProximosVencer({ prestamos }: DashboardProximosVencerProps) {
  
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0); // Normalizamos a mediodía para evitar saltos por zona horaria

  // 1. Procesar la lista de préstamos activos
  let listaRadar = prestamos
    .filter(p => p.Estado === "Activo")
    .map(p => {
      const cuotasPagadas = (p.CantidadCuotas || 0) - (p.CuotasRestantes || 0);
      const fechaPago = getProximoPagoDate(p.FechaInicio, p.ModalidadPago, cuotasPagadas);
      
      // Calcular diferencia en días (positiva = futuro, negativa = pasado)
      const diffTime = fechaPago.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      return {
        ...p,
        fechaPagoFormat: fechaPago.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }),
        diasRestantes: diffDays
      };
    });

  // 2. Filtrar: Solo los que están entre -7 días (vencidos hace 1 semana) y +7 días (vencen en 1 semana)
  listaRadar = listaRadar.filter(p => p.diasRestantes >= -7 && p.diasRestantes <= 7);

  // 3. Ordenar: Los más vencidos primero (negativos), luego los de hoy, luego los del futuro
  listaRadar.sort((a, b) => a.diasRestantes - b.diasRestantes);

  return (
    <Card className="lg:col-span-2 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Radar de Cobros (Ventana de 7 días)
        </CardTitle>
        <CardDescription>
          Préstamos que toca cobrar ahora o que están en sus días de gracia.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[250px] pr-4">
          <div className="space-y-3">
            {listaRadar.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay cobros en el radar para estos días. ¡Todo al día! 🎉
              </div>
            ) : (
              listaRadar.map((prestamo) => {
                // Lógica de colores según la realidad de la calle
                const estaAtrasado = prestamo.diasRestantes < 0;
                const esHoy = prestamo.diasRestantes === 0;
                const atrasoCritico = prestamo.diasRestantes <= -5; // Límite de tus 5 días
                
                let borderColor = "border-slate-200";
                let bgColor = "bg-white";
                let badgeVariant = "outline";
                let textoDias = "";

                if (atrasoCritico) {
                  borderColor = "border-red-300"; bgColor = "bg-red-50"; badgeVariant = "destructive";
                  textoDias = `Atrasado ${Math.abs(prestamo.diasRestantes)} días`;
                } else if (estaAtrasado) {
                  borderColor = "border-orange-300"; bgColor = "bg-orange-50"; badgeVariant = "default";
                  textoDias = `Vencido hace ${Math.abs(prestamo.diasRestantes)} d.`; // La ventana de gracia
                } else if (esHoy) {
                  borderColor = "border-blue-300"; bgColor = "bg-blue-50"; badgeVariant = "secondary";
                  textoDias = "Vence HOY";
                } else {
                  textoDias = `En ${prestamo.diasRestantes} días`;
                }

                return (
                  <div key={prestamo.IdPrestamo} className={`flex items-center justify-between p-3 rounded-lg border ${borderColor} ${bgColor} transition-colors`}>
                    <div>
                      <p className="font-bold text-slate-800">{prestamo.clienteNombre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-slate-600">
                          Cuota: {formatMoney(prestamo.MontoCuota)}
                        </span>
                        <span className="text-[10px] uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          {prestamo.ModalidadPago}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge variant={badgeVariant as any} className={estaAtrasado && !atrasoCritico ? "bg-orange-500 hover:bg-orange-600" : ""}>
                        {textoDias}
                      </Badge>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {prestamo.fechaPagoFormat}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}