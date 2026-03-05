import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from 'lucide-react'

// Definimos las props que recibirá
interface DashboardSolicitudesProps {
  solicitudes: any[];
  onNavigate: (section: string) => void;
}

export function DashboardSolicitudes({ solicitudes, onNavigate }: DashboardSolicitudesProps) {
  
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  // 👇 Lógica actualizada: Solo mostramos las que están "Pendiente"
  const solicitudesMostrar = solicitudes
    .filter(s => s.Estado.toLowerCase() === 'pendiente') // 🔥 CAMBIO AQUÍ
    .sort((a, b) => new Date(a.FechaDeseada).getTime() - new Date(b.FechaDeseada).getTime())
    .slice(0, 4);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#213685]" />
          Próximos Préstamos Solicitados
        </CardTitle>
        <CardDescription>
          Solicitudes pendientes de revisión
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3 mb-4">
          {solicitudesMostrar.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border rounded-lg border-dashed">
              No hay solicitudes pendientes en este momento.
            </div>
          ) : (
            solicitudesMostrar.map((solicitud) => {
              // Como ahora solo mostramos pendientes, este check es un formalismo
              const esAprobada = solicitud.Estado.toLowerCase() === 'aprobada';
              
              return (
                <div key={solicitud.IdSolicitud} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  <div>
                    {/* Como la API devuelve el objeto Cliente anidado, lo leemos así */}
                    <p className="font-medium text-slate-800">{solicitud.Cliente?.Nombre || 'Cliente'}</p>
                    <p className="text-sm text-slate-500">
                      <span className="font-bold text-[#213685]">{formatMoney(solicitud.MontoSolicitado)}</span> 
                      <span className="mx-1">•</span> 
                      {formatDate(solicitud.FechaDeseada)}
                    </p>
                  </div>
                  <Badge 
                    variant={esAprobada ? "default" : "secondary"}
                    className={
                      esAprobada 
                        ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none" 
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 shadow-none"
                    }
                  >
                    {solicitud.Estado}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
        
        <Button 
          className="w-full bg-[#213685] hover:bg-[#213685]/90 mt-auto"
          onClick={() => onNavigate("solicitudes")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Ver todas o crear nueva
        </Button>
      </CardContent>
    </Card>
  )
}