import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, MapPin, Phone, Clock } from 'lucide-react'

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
  hoy.setHours(12, 0, 0, 0);

  // 1. Procesar la lista de préstamos activos
  let listaRadar = prestamos
    .filter(p => p.Estado === "Activo")
    .map(p => {
      const cuotasPagadas = (p.CantidadCuotas || 0) - (p.CuotasRestantes || 0);
      const fechaPago = getProximoPagoDate(p.FechaInicio, p.ModalidadPago, cuotasPagadas);
      
      const diffTime = fechaPago.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      return {
        ...p,
        fechaPagoFormat: fechaPago.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }),
        diasRestantes: diffDays
      };
    });

  // 2. Filtrar: Solo los que están entre -7 días y +7 días
  listaRadar = listaRadar.filter(p => p.diasRestantes >= -7 && p.diasRestantes <= 7);

  // 3. Ordenar: Los más vencidos primero
  listaRadar.sort((a, b) => a.diasRestantes - b.diasRestantes);

  const getLeftBorderColor = (dias: number) => {
    if (dias <= -5) return 'border-l-red-500';
    if (dias < 0) return 'border-l-amber-500';
    if (dias === 0) return 'border-l-blue-500';
    return 'border-l-emerald-500';
  };

  const getBadgeStyle = (dias: number) => {
    if (dias <= -5) return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (dias < 0) return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    if (dias === 0) return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
  };

  const getAvatarStyle = (dias: number) => {
    if (dias <= -5) return 'bg-red-100 text-red-700';
    if (dias < 0) return 'bg-amber-100 text-amber-700';
    if (dias === 0) return 'bg-blue-100 text-blue-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getStatusText = (dias: number) => {
    if (dias < 0) return `Atrasado ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`;
    if (dias === 0) return 'Vence HOY';
    return `En ${dias} día${dias === 1 ? '' : 's'}`;
  };

  return (
    <Card className="overflow-hidden shadow-md flex flex-col h-full border-0">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-lg pb-4 pt-4 px-5 shrink-0">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Clock className="w-5 h-5 text-blue-400" />
          Radar de Cobros
          <Badge variant="secondary" className="ml-auto bg-white/15 text-white border-0 text-[10px]">
            {listaRadar.length} pendiente{listaRadar.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs mt-1">
          Cobros programados en ventana de 7 días
        </CardDescription>
      </div>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[280px]">
          <div className="p-3 space-y-2.5">
            {listaRadar.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No hay cobros en el radar</p>
                <p className="text-xs mt-1">¡Todo al día! 🎉</p>
              </div>
            ) : (
              listaRadar.map((prestamo) => {
                const dias = prestamo.diasRestantes;
                const inicial = prestamo.clienteNombre ? prestamo.clienteNombre.charAt(0).toUpperCase() : '?';

                return (
                  <div
                    key={prestamo.IdPrestamo}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-slate-100 border-l-4 bg-white transition-all hover:shadow-md ${getLeftBorderColor(dias)}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarStyle(dias)}`}>
                      {inicial}
                    </div>
                    
                    {/* Info del cliente */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {prestamo.clienteNombre}
                      </p>
                      {prestamo.clienteTelefono && (
                        <a 
                          href={`tel:${prestamo.clienteTelefono}`} 
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-0.5" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {prestamo.clienteTelefono}
                        </a>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-slate-500">
                          Cuota: {formatMoney(prestamo.MontoCuota)}
                        </span>
                        <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                          {prestamo.ModalidadPago}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 border-0 font-semibold ${getBadgeStyle(dias)}`}>
                        {getStatusText(dias)}
                      </Badge>
                      <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
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