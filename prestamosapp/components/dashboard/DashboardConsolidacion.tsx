import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { PiggyBank, CheckCircle, Clock, FileText } from 'lucide-react'
import Link from "next/link"

interface DashboardConsolidacionProps {
  ingresos: number;
  egresos: number;
  fechaInicio?: string;
  fechaFin?: string;
  onNavigate: (section: string) => void;
}

export function DashboardConsolidacion({ 
  ingresos, 
  egresos, 
  fechaInicio, 
  fechaFin,
  onNavigate
}: DashboardConsolidacionProps) {
  
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
  };

  const balanceNeto = ingresos - egresos;

  // Lógica simple para el checklist
  const tieneGastos = egresos > 0;
  const tieneIngresos = ingresos > 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-[#213685]" />
          Consolidación de Capital
        </CardTitle>
        <CardDescription>
          Período actual: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Ingresos Registrados</span>
            <span className="font-bold text-green-600">{formatMoney(ingresos)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Gastos y Egresos</span>
            <span className="font-bold text-red-600">{formatMoney(egresos)}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-100 mt-2">
            <span className="text-sm font-semibold text-slate-700">Balance Neto</span>
            <span className={`font-bold text-lg ${balanceNeto >= 0 ? 'text-[#213685]' : 'text-red-600'}`}>
              {formatMoney(balanceNeto)}
            </span>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-slate-700">Checklist de la Quincena</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {tieneGastos ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-orange-400" />}
                <span className={tieneGastos ? "text-slate-700" : "text-slate-500"}>Registro de gastos fijos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {tieneIngresos ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-orange-400" />}
                <span className={tieneIngresos ? "text-slate-700" : "text-slate-500"}>Ingreso de cuotas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Link a tu pantalla de consolidación real (Ajusta el href a tu ruta real) */}
        <div className="mt-6">
          <Button 
            className="w-full bg-[#213685] hover:bg-[#213685]/90"
            onClick={() => onNavigate("consolidacion")} 
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Consolidación Completa
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}