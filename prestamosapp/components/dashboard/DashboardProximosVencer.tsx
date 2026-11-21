import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, MapPin, Phone, Clock } from 'lucide-react'

import { proximaCuotaPendiente } from "@/lib/fechasPago"

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
      // Vencimiento de la primera cuota pendiente según los días de pago acordados (13 y 27, etc.)
      const proxima = proximaCuotaPendiente(p);
      if (!proxima) return null;
      const fechaPago = proxima.fecha;

      const diffTime = fechaPago.getTime() - hoy.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      return {
        ...p,
        // Monto real de la cuota pendiente (incluye lo arrastrado de pagos incompletos)
        MontoCuota: proxima.monto ?? p.MontoCuota,
        fechaPagoFormat: fechaPago.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }),
        diasRestantes: diffDays
      };
    })
    .filter((p): p is any => p !== null);

  // 2. Filtrar: Solo los que están entre -7 días y +3 días (para que no salgan cobros semanales tan pronto se pagan)
  listaRadar = listaRadar.filter(p => p.diasRestantes >= -7 && p.diasRestantes <= 3);

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
          <Badge variant="secondary" className="ml-auto bg-background/15 text-white border-0 text-[10px]">
            {listaRadar.length} pendiente{listaRadar.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs mt-1">
          Cobros programados en ventana de 7 días
        </CardDescription>
      </div>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[280px] [&_[data-radix-scroll-area-viewport]>div]:!block">
          <div className="p-3 space-y-2.5">
            {listaRadar.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
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
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-slate-100 dark:border-slate-800 border-l-4 bg-background transition-all hover:shadow-md ${getLeftBorderColor(dias)}`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarStyle(dias)}`}>
                      {inicial}
                    </div>
                    
                    {/* Info del cliente */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
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
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Cuota: {formatMoney(prestamo.MontoCuota)}
                        </span>
                        <span className="text-[10px] uppercase bg-accent text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                          {prestamo.ModalidadPago}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 border-0 font-semibold ${getBadgeStyle(dias)}`}>
                        {getStatusText(dias)}
                      </Badge>
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
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