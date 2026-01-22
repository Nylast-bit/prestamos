import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, AlertTriangle } from 'lucide-react'

interface PrestamoStatsProps {
  activos: number
  capital: number
  interes: number
  mora: number
}

export function PrestamoStats({ activos, capital, interes, mora }: PrestamoStatsProps) {
  
  // Calculamos el total global (Cartera Total)
  const capitalEnCalleTotal = capital + interes;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* 1. Préstamos Activos */}
      <Card className="border-l-4 border-l-[#213685] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Préstamos Activos</CardTitle>
          <DollarSign className="h-4 w-4 text-[#213685]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#213685]">{activos}</div>
          <p className="text-xs text-muted-foreground">Clientes con deuda vigente</p>
        </CardContent>
      </Card>
      
      {/* 2. Capital en Calle (CAPITAL + INTERÉS) */}
      <Card className="border-l-4 border-l-green-600 shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capital en Calle</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
         </CardHeader>
         <CardContent>
            {/* AQUÍ ESTÁ EL CAMBIO: Sumamos capital + interes */}
            <div className="text-2xl font-bold text-green-600">
                ${capitalEnCalleTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Saldo Total (Capital + Interés)</p>
         </CardContent>
      </Card>

      {/* 3. Interés Total (Ganancia Proyectada) */}
       <Card className="border-l-4 border-l-blue-500 shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interés Proyectado</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
         </CardHeader>
         <CardContent>
            <div className="text-2xl font-bold text-blue-600">
                ${interes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Ganancia esperada total</p>
         </CardContent>
      </Card>

      {/* 4. En Mora */}
       <Card className="border-l-4 border-l-red-500 shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Mora</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
         </CardHeader>
         <CardContent>
            <div className="text-2xl font-bold text-red-600">{mora}</div>
            <p className="text-xs text-muted-foreground">Préstamos atrasados</p>
         </CardContent>
      </Card>
    </div>
  )
}